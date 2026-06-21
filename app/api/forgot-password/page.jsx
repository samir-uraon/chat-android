"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const router= useRouter();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
  const res = await fetch("/api/auth/forgotpassword", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email }),
});

const data = await res.json();

      toast.success(data.message);
      setEmail("");

    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      
      <div className="w-full max-w-sm bg-white shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold text-center mb-6">
          Forgot Password
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
        if (e.key === "Enter" && !isDisabled) {
          e.preventDefault();
        }
      }}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 transition text-white rounded-md p-2 font-medium disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
          <div className="my-4 flex items-center">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-xs text-gray-400 uppercase">
            or
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Go Dashboard Button */}
        <button
          onClick={() => router.push("/")}
          className="w-full rounded-lg border border-gray-300 
                     py-2.5 font-medium text-gray-700 
                     hover:bg-gray-50 active:scale-[0.98] 
                     transition duration-150"
        >
          Go to Login
        </button>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            minHeight: "40px",
            padding: "8px 12px",
            fontSize: "13px",
            borderRadius: "6px",
          },
        }}
      />
    </div>
  );
}