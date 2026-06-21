import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);


    const result = await db.collection("friendRequests").updateMany(
      { to: new ObjectId(userId), seen: false },
      { $set: { seen: true, updatedAt: new Date() } }
    );
console.log(result);

    return NextResponse.json({
      message: "Marked as seen",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("MARK-SEEN ERROR:", err);

    return NextResponse.json(
      { message: "Error updating" },
      { status: 500 }
    );
  }
}