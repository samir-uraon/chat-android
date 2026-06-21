import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

export async function PUT(req) {
  try {
    // 1️⃣ Get session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { message: "Invalid session" },
        { status: 401 }
      );
    }

    // 2️⃣ Read body
    const body = await req.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    // 3️⃣ DB connection
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const users = db.collection("users");

    const objectId = new ObjectId(userId);

    // 4️⃣ Update user
    const result = await users.findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          name,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

  

    if (!result) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 5️⃣ Return updated user
    return NextResponse.json(
      {      
        name: result.name,    
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Update profile error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}