 
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";


export async function POST(req) {
  try {
    const { from, to ,senderName} = await req.json();

    if (!from || !to || !senderName) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Resolve recipient email to _id
    const recipient = await db.collection("users").findOne({ email: to });
    if (!recipient) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const fromId = new ObjectId(from);
    const toId = recipient._id;

    if (fromId.equals(toId)) {
      return NextResponse.json({ message: "Cannot send request to yourself" }, { status: 400 });
    }

    // Check if already friends
    const sender = await db.collection("users").findOne({ _id: fromId });
    if (sender.contacts?.some(c => c.equals(toId))) {
      return NextResponse.json({ message: "Already friends" }, { status: 200 });
    }

    // Check existing pending request
    const existingRequest = await db.collection("friendRequests").findOne({
      from: fromId,
      to: toId,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json({ message: "Request already sent" }, { status: 200 });
    }

    // Create friend request
    const result = await db.collection("friendRequests").insertOne({
      from: fromId,
      to: toId,
      status: "pending",
      seen: false,
      name:senderName,
      createdAt: new Date(),
      updatedAt: new Date(),
    }); 

    return NextResponse.json({
      message: "Request sent",
      requestId: result.insertedId,
    }, { status: 200 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

/**
 * PUT: Accept a friend request
 * body: { requestId, userId } // userId = receiver who accepts
 */
export async function PUT(req) {
  try {
    const { requestId, userId } = await req.json();

    if (!requestId || !userId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Find the friend request
    const request = await db.collection("friendRequests").findOne({
      _id: new ObjectId(requestId),
      to: new ObjectId(userId),
      status: "pending",
    });

    if (!request) {
      return NextResponse.json({ message: "Request not found or already processed" }, { status: 404 });
    }

    // Update request status to accepted
    await db.collection("friendRequests").updateOne(
      { _id: request._id },
      { $set: { status: "accepted", seen: true, updatedAt: new Date() } }
    );

    // Add each other as contacts
    const fromId = request.from;
    const toId = request.to;

    await db.collection("users").updateOne(
      { _id: fromId },
      { $addToSet: { contacts: toId } }
    );

    await db.collection("users").updateOne(
      { _id: toId },
      { $addToSet: { contacts: fromId } }
    );

    return NextResponse.json({ message: "Friend request accepted, contact added" }, { status: 200 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}