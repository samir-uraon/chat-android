import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {getToken} from "next-auth/jwt";

export async function GET(req) {
  try {

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
console.log("SESSION:", session);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const user = await db.collection("users").findOne({
      _id: new ObjectId(session.user.id),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if(user.passwordcreatedAt && token.createdAt() < user.passwordCreatedAt.getTime()) {
      return NextResponse.json(
        { error: "Session expired, please log in again" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image || "",
    });

  } catch (error) {
    console.error("GET USER ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}