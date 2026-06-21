import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const { userId, contactId } = await req.json();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
console.log(userId,contactId);

    const result = await db.collection("messages").updateMany(
      {
        $or: [
          {
            from: new ObjectId(userId),
            to: new ObjectId(contactId),
            seen: false,
          },
          {
            from: new ObjectId(contactId),
            to: new ObjectId(userId),
            seen: false,
          },
        ],
      },
      {
        $set: {
          seen: true,
          seenAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "Messages marked as seen",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { message: "Failed to mark messages" },
      { status: 500 }
    );
  }
}