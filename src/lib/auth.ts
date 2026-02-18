import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { isSuperAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";
import { verifyFirebasePasswordCredential } from "@/lib/firebase/password";
import { verifyFirebaseIdToken } from "@/lib/firebase/server";
import { logger } from "@/lib/logger";
import { ensureUserAccess } from "@/lib/user-access";

const TOKEN_SYNC_INTERVAL_MS = 30_000;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const firebaseCredentialsSchema = z.object({
  idToken: z.string().min(20),
});

const authUserSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  emailVerified: true,
  passwordHash: true,
  activeWorkspaceId: true,
  accessStatus: true,
  accessDisabledUntil: true,
  memberships: {
    select: { workspaceId: true },
    orderBy: { createdAt: "asc" as const },
    take: 1,
  },
};

type AuthUser = NonNullable<Awaited<ReturnType<typeof getUserByEmailForAuth>>>;

async function getUserByEmailForAuth(email: string) {
  return db.user.findUnique({
    where: { email: email.toLowerCase() },
    select: authUserSelect,
  });
}

function toSessionUser(user: AuthUser) {
  const fallbackWorkspaceId = user.memberships[0]?.workspaceId ?? null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    activeWorkspaceId: user.activeWorkspaceId ?? fallbackWorkspaceId,
  };
}

function isUniqueConstraintError(error: unknown): error is { code: string } {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: unknown };
  return typeof maybeError.code === "string" && maybeError.code === "P2002";
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email y password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);

      if (!parsed.success) {
        return null;
      }

      const user = await getUserByEmailForAuth(parsed.data.email);

      if (!user) {
        return null;
      }

      const accessAllowed = await ensureUserAccess({
        id: user.id,
        accessStatus: user.accessStatus,
        accessDisabledUntil: user.accessDisabledUntil,
      });

      if (!accessAllowed) {
        return null;
      }

      let passwordOk = false;
      let shouldSyncPasswordHash = false;

      if (user.passwordHash) {
        passwordOk = await bcrypt.compare(parsed.data.password, user.passwordHash);
      }

      if (!passwordOk) {
        const firebasePasswordResult = await verifyFirebasePasswordCredential({
          email: parsed.data.email,
          password: parsed.data.password,
        });

        if (!firebasePasswordResult.valid) {
          return null;
        }

        passwordOk = true;
        shouldSyncPasswordHash = true;
      }

      if (!passwordOk) {
        return null;
      }

      if (shouldSyncPasswordHash) {
        try {
          const passwordHash = await bcrypt.hash(parsed.data.password, 12);
          await db.user.update({
            where: { id: user.id },
            data: { passwordHash },
          });
        } catch (error) {
          logger.warn({ error, userId: user.id }, "Failed to sync password hash from Firebase credentials.");
        }
      }

      return toSessionUser(user);
    },
  }),
  CredentialsProvider({
    id: "firebase-google",
    name: "Google",
    credentials: {
      idToken: { label: "Firebase ID Token", type: "text" },
    },
    async authorize(credentials) {
      const parsed = firebaseCredentialsSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }

      const firebaseUser = await verifyFirebaseIdToken(parsed.data.idToken);
      if (!firebaseUser?.email || !firebaseUser.emailVerified) {
        return null;
      }

      const email = firebaseUser.email.toLowerCase();
      let user = await getUserByEmailForAuth(email);

      if (!user) {
        try {
          await db.user.create({
            data: {
              email,
              name: firebaseUser.name,
              image: firebaseUser.image,
              emailVerified: new Date(),
            },
          });
        } catch (error) {
          if (!isUniqueConstraintError(error)) {
            logger.error({ error, email }, "Failed creating Firebase Google user.");
            return null;
          }
        }

        user = await getUserByEmailForAuth(email);
      } else {
        const profilePatch: { name?: string; image?: string; emailVerified?: Date } = {};

        if (!user.name && firebaseUser.name) {
          profilePatch.name = firebaseUser.name;
        }

        if (!user.image && firebaseUser.image) {
          profilePatch.image = firebaseUser.image;
        }

        if (!user.emailVerified) {
          profilePatch.emailVerified = new Date();
        }

        if (Object.keys(profilePatch).length > 0) {
          await db.user.update({
            where: { id: user.id },
            data: profilePatch,
          });

          user = await getUserByEmailForAuth(email);
        }
      }

      if (!user) {
        return null;
      }

      const accessAllowed = await ensureUserAccess({
        id: user.id,
        accessStatus: user.accessStatus,
        accessDisabledUntil: user.accessDisabledUntil,
      });

      if (!accessAllowed) {
        return null;
      }

      return toSessionUser(user);
    },
  }),
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const dbUser = await db.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: {
          id: true,
          accessStatus: true,
          accessDisabledUntil: true,
        },
      });

      if (!dbUser) {
        return true;
      }

      return ensureUserAccess(dbUser);
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.activeWorkspaceId = user.activeWorkspaceId ?? null;
        token.email = user.email;
        token.lastSyncAt = 0;
      }

      if (!token.sub) {
        return token;
      }

      const now = Date.now();
      const lastSyncAt = typeof token.lastSyncAt === "number" ? token.lastSyncAt : 0;

      const shouldSync =
        trigger === "update" ||
        now - lastSyncAt > TOKEN_SYNC_INTERVAL_MS ||
        typeof token.isSuperAdmin !== "boolean" ||
        typeof token.accessDenied !== "boolean" ||
        typeof token.activeWorkspaceId === "undefined";

      if (!shouldSync) {
        return token;
      }

      const dbUser = await db.user.findUnique({
        where: { id: token.sub },
        select: {
          id: true,
          email: true,
          activeWorkspaceId: true,
          accessStatus: true,
          accessDisabledUntil: true,
          memberships: {
            select: {
              workspaceId: true,
            },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      });

      if (dbUser) {
        const accessAllowed = await ensureUserAccess({
          id: dbUser.id,
          accessStatus: dbUser.accessStatus,
          accessDisabledUntil: dbUser.accessDisabledUntil,
        });

        token.accessDenied = !accessAllowed;
        token.activeWorkspaceId = dbUser.activeWorkspaceId ?? dbUser.memberships[0]?.workspaceId ?? null;
        token.isSuperAdmin = isSuperAdminEmail(dbUser.email);
        token.email = dbUser.email;
      } else {
        token.accessDenied = true;
        token.activeWorkspaceId = null;
        token.isSuperAdmin = false;
      }

      token.lastSyncAt = now;
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = token.sub ?? "";
      session.user.activeWorkspaceId = token.activeWorkspaceId ?? null;
      session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
      session.user.accessDenied = Boolean(token.accessDenied);

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
