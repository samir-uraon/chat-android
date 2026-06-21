import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const body = await req.json();
    const { requestId } = body;

    // ✅ validation
    if (!requestId) {
      return NextResponse.json(
        { message: "requestId is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 🔥 Step 1: Get request from DB
    const request = await db.collection("friendRequests").findOne({
      _id: new ObjectId(requestId),
    });

    if (!request) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    const { from, to } = request;

    // 🔥 Step 2: Update request status
    await db.collection("friendRequests").updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: "accepted",
          seen: true,
          updatedAt: new Date(),
        },
      }
    );

    // 🔥 Step 3: Add both users to contacts
    await db.collection("users").updateOne(
      { _id: new ObjectId(from) },
      { $addToSet: { contacts: to } }
    );

    await db.collection("users").updateOne(
      { _id: new ObjectId(to) },
      { $addToSet: { contacts: from } }
    );

    return NextResponse.json({
      message: "Friend request accepted",
    });

  } catch (err) {
    console.error("ACCEPT ERROR:", err);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}