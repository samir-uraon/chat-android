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

    // 🔥 Step 1: find request
    const request = await db.collection("friendRequests").findOne({
      _id: new ObjectId(requestId),
    });

    if (!request) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    // 🔥 Step 2: prevent duplicate action
    if (request.status === "rejected") {
      return NextResponse.json({ message: "Already rejected" });
    }

    if (request.status === "accepted") {
      return NextResponse.json({ message: "Already accepted" });
    }

    // 🔥 Step 3: update status
    await db.collection("friendRequests").updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: "rejected",
          seen: true, // ✅ stops blinking
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "Friend request rejected",
    });

  } catch (err) {
    console.error("REJECT ERROR:", err);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}