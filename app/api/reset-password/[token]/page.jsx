"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import toast, { Toaster } from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      return toast.error("Password must be at least 8 characters.");
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    setLoading(true);

    try {
      const { data } = await fetch("/api/auth/reset", {
        method:"POST",
        token,
        newPassword: password,
      });

      toast.success(data.message);
      setTimeout(() => router.push("/"), 2000);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            required
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            required
            minLength={8}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md text-white font-semibold cursor-pointer ${
              loading ? "bg-green-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            } transition-colors`}
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-4 text-sm">
          Remembered your password?{" "}
          <span
            className="text-green-600 font-semibold cursor-pointer hover:underline"
            onClick={() => router.push("/")}
          >
            Login
          </span>
        </p>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: "14px",
            minHeight: "40px",
            padding: "8px 12px",
          },
        }}
      />
    </div>
  );
}