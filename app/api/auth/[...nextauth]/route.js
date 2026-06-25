import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) {
        return false;
      }

      try {
        const { findOrCreateOAuthUser } = await import("@/lib/users-db");
        const { createSession } = await import("@/lib/session");

        const dbUser = await findOrCreateOAuthUser({
          email: user.email,
          name: user.name || user.email.split("@")[0],
          authProvider: "google",
          authProviderId: account.providerAccountId,
        });

        await createSession(dbUser.id);
        return true;
      } catch (error) {
        console.error("[NextAuth] Google signIn bridge failed:", error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
  },
};

const nextAuthHandler = NextAuth(authOptions);

async function bindNextAuthUrl(request) {
  const { getRequestOrigin } = await import("@/lib/oauth/config");
  process.env.NEXTAUTH_URL = getRequestOrigin(request);
}

export async function GET(request, context) {
  await bindNextAuthUrl(request);
  return nextAuthHandler(request, context);
}

export async function POST(request, context) {
  await bindNextAuthUrl(request);
  return nextAuthHandler(request, context);
}
