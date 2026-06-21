import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const { name, email, password } =
      await req.json();

    const client = await clientPromise;

    const db = client.db(process.env.MONGODB_DB);

    const existingUser = await db
      .collection("users")
      .findOne({
        email,
      });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "User already exists",
        },
        {
          status: 400,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      contacts: [],
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Signup successful",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}