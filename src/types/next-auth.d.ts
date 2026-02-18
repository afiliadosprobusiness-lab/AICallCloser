import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      activeWorkspaceId: string | null;
      isSuperAdmin: boolean;
      accessDenied: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    activeWorkspaceId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    activeWorkspaceId?: string | null;
    isSuperAdmin?: boolean;
    accessDenied?: boolean;
  }
}
