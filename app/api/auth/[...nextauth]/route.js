import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";

import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

export const authOptions = {
  providers: [
    /* ---------------- CREDENTIALS ---------------- */
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        const user = await db.collection("users").findOne({
          email: credentials.email,
        });

        if (!user) throw new Error("User not found");

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) throw new Error("Invalid password");

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      },
    }),

/* ---------------- GOOGLE ---------------- */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

/* ---------------- GITHUB ---------------- */
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    /* ---------------- SIGN IN ---------------- */
    async signIn({ user }) {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB);

      const existingUser = await db.collection("users").findOne({
        email: user.email,
      });

      let userId;

      if (!existingUser) {
        const result = await db.collection("users").insertOne({
          name: user.name,
          email: user.email,
          image: user.image || "",
          contacts: [],
          createdAt: new Date(),
        });

        userId = result.insertedId.toString();
      } else {
        userId = existingUser._id.toString();
      }

      // attach id for JWT
      user.id = userId;

      return true;
    },

    /* ---------------- JWT ---------------- */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    /* ---------------- SESSION ---------------- */
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    },
  },

  cookies: {
    sessionToken: {
      name: "auth-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };