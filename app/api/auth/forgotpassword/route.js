import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("chatapp");

    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Email does not exist" },
        { status: 404 }
      );
    }
    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          resetPasswordToken: hashedToken,
          resetPasswordExpire: Date.now() + 60 * 60 * 1000
        }
      }
    );
		
    const su=process.env.SMTP_USER
    const sp=process.env.SMTP_SEC
     

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/reset-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
      //host: "smtp.gmail.com",
      //port: 587,
      //secure: false,
      //service: "gmail",
						service: "gmail",
    auth: {
      user: su,
      pass: sp,
    },
    });
    await transporter.sendMail({
      from: `"Chat App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset.</p>
        <p>Click below link to reset password:</p>
        <a href="${resetUrl}" target="_blank">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    return NextResponse.json(
      { message: "Reset link sent successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}