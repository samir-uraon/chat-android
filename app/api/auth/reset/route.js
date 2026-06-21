import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("chatapp");

    // 1️⃣ Hash incoming token (because we stored hashed token)
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 2️⃣ Find user with valid token and not expired
    const user = await db.collection("users").findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // 3️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4️⃣ Update password & remove reset fields
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword, passwordcreatedAt: new Date() },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpire: "",
        },
      }
    );

    const response= NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    );
    
  response.cookies.delete("auth-token");
  

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}