import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    const normalizedEmail = email.toLowerCase().trim();

    const client = await clientPromise;
    const db = client.db("chatapp");

    const user = await db.collection("users").findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ message: "Wrong password" }, { status: 401 });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      {
        message: "Login successful",
        username: user.name,
      },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}