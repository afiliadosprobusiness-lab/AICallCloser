import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";

import { isSuperAdminEmail } from "@/lib/admin";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { ensureUserAccess } from "@/lib/user-access";

const TOKEN_SYNC_INTERVAL_MS = 30_000;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

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

      const user = await db.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          passwordHash: true,
          activeWorkspaceId: true,
          accessStatus: true,
          accessDisabledUntil: true,
          memberships: {
            select: { workspaceId: true },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      });

      if (!user?.passwordHash) {
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

      const passwordOk = await bcrypt.compare(parsed.data.password, user.passwordHash);

      if (!passwordOk) {
        return null;
      }

      const fallbackWorkspaceId = user.memberships[0]?.workspaceId ?? null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        activeWorkspaceId: user.activeWorkspaceId ?? fallbackWorkspaceId,
      };
    },
  }),
];

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

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
