import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json([], { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
console.log("Session User ID:", session.user);
    const userId = session.user.id;

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json([], { status: 400 });
    }

    const currentUser = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    if (!currentUser) {
      return NextResponse.json([], { status: 404 });
    }

    const users = await db
      .collection("users")
      .find({
        _id: { $in: currentUser.contacts || [] },
      })
      .project({ password: 0 })
      .toArray();

    return NextResponse.json(users);
  } catch (error) {
    console.error("CONTACTS API ERROR:", error);
    return NextResponse.json([], { status: 500 });
  }
}