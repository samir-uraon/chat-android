
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    // 1️⃣ Get the userId from query params
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    console.log("userId:", userId);
    
    if (!userId) return NextResponse.json({ message: "userId is required" }, { status: 400 });

    // 2️⃣ Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // 3️⃣ Fetch pending friend requests
    const requests = await db
      .collection("friendRequests")
      .find({ to: new ObjectId(userId), status: "pending" }) // if stored as ObjectId, use: new ObjectId(userId)
      .toArray();

    return NextResponse.json(requests, { status: 200 });
  } catch (err) {
    console.error("Error fetching friend requests:", err);
    return NextResponse.json({ message: "Error fetching requests" }, { status: 500 });
  }
}