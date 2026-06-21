import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/* ---------------- GET MESSAGES ---------------- */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");
    const contactId = searchParams.get("contactId");

    if (!userId || !contactId) {
      return NextResponse.json(
        { error: "userId and contactId are required" },
        { status: 400 }
      );
    }

    if (
      !ObjectId.isValid(userId) ||
      !ObjectId.isValid(contactId)
    ) {
      return NextResponse.json(
        { error: "Invalid user id" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const messages = await db
      .collection("messages")
      .find({
        $or: [
          {
            from: new ObjectId(userId),
            to: new ObjectId(contactId),
          },
          {
            from: new ObjectId(contactId),
            to: new ObjectId(userId),
          },
        ],
      })
      .sort({ createdAt: 1 })
      .toArray();

    const formattedMessages = messages.map((msg) => ({
      _id: msg._id.toString(),
      from: msg.from.toString(),
      to: msg.to.toString(),
      message: msg.message,
      type: msg.type || "text",
      seen: msg.seen || false,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/* ---------------- SAVE MESSAGE ---------------- */
export async function POST(req) {
  try {
    const { from, to, message, type } = await req.json();

    if (!from || !to || !message?.trim()) {
      return NextResponse.json(
        { error: "from, to and message are required" },
        { status: 400 }
      );
    }

    if (
      !ObjectId.isValid(from) ||
      !ObjectId.isValid(to)
    ) {
      return NextResponse.json(
        { error: "Invalid user id" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const now = new Date();

    const messageDoc = {
      from: new ObjectId(from),
      to: new ObjectId(to),
      message: message.trim(),
      type: type || "text",
      seen: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection("messages")
      .insertOne(messageDoc);

    return NextResponse.json(
      {
        _id: result.insertedId.toString(),
        from,
        to,
        message: message.trim(),
        type: type || "text",
        seen: false,
        createdAt: now,
        updatedAt: now,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }
}