"use client";


import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";

import { useRouter } from "next/navigation";




export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [bgLoaded, setBgLoaded] = useState(false); // Track background load
  const [loading, setLoading] = useState(false);




  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password) {
      toast.error(
        "Please fill all fields"
      );
      return;
    }

    try {
      setLoading(true);

      const res = await signIn(
        "credentials",
        {
          email: formData.email,
          password: formData.password,
          redirect: false,
          callbackUrl: "/dashboard",
        }
      );

      // Invalid credentials
      if (res?.error) {
        toast.error(
          "Invalid Email or Password"
        );
        return;
      }

      // Success
      toast.success("Login Successful");

      window.location.href =
        "/dashboard";
    } catch (error) {
      console.log(error);

      toast.error(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SIGNUP ----------------

  const handleSignup = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.password
    ) {
      toast.error(
        "Please fill all fields"
      );
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      toast.error(
        "Password must be at least 6 characters"
      );
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "/api/signup",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
          }),
          credentials: "include",
        }
      );

      const data = await res.json();

      // User already exists
      if (res.status === 400) {
        toast.error(
          "User already exists"
        );
        return;
      }

      // Server error
      if (!res.ok) {
        toast.error(
          data.message ||
            "Signup Failed"
        );
        return;
      }

      // Success
      toast.success(
        "Account Created Successfully!"
      );
      setFormData({...formData, password: "" });
      setIsLogin(true);

    
    } catch (error) {
      console.log(error);

      toast.error(
        "Network Error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = "/images/chat-bg.jpg";
    img.onload = () => setBgLoaded(true);
  }, []);

  return (
    <div className="relative w-screen h-screen flex justify-center items-center p-2">
 
      {!bgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

 
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
          bgLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: "url('/images/chat-bg.jpg')" }}
      />

 
      {bgLoaded && (
        
        <div
          className={`relative transition-opacity duration-700 rounded-sm 
          bg-white/10 border border-white/20 shadow-xl backdrop-blur-xl 
          p-9 sm:p-6 md:py-5 md:px-8
          w-50% max-w-xs sm:max-w-sm md:max-w-md`}
        >
          
<div className="flex flex-col text-center justify-center items-center w-full h-full">
              <h1 className="text-2xl font-extrabold font-mono">{isLogin ? "Welcome Back" : "Welcome"}</h1>
            <p className="font-light-200 text-primary">{isLogin ? "Login to continue" : "Sign up now to get started"}</p>
            <form
              onSubmit={isLogin ? handleLogin : handleSignup}
              className="w-full py-8 pb-2 gap-5 flex flex-col text-center justify-center items-center relative"
            >
              {!isLogin && (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="User Name"
                  className="border-b-2 border-black focus:border-blue-500 outline-none px-1 py-0.2 w-55 text-md valid:border-blue-500"
                />
              )}
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Email"
                className="border-b-2 border-black focus:border-blue-500 outline-none px-1 py-0.2 w-55 text-md valid:border-blue-500"
              />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                required
                placeholder="Password"
                className="border-b-2 border-black focus:border-blue-500 outline-none px-1 py-0.2 w-55 text-md valid:border-blue-500"
              /> 
              
               
              {isLogin && (
                <p
                  onClick={() => router.push("/api/forgot-password")}
                  className="absolute right-1 top-[58%] text-xs text-blue-700 cursor-pointer hover:underline hover:text-blue-900"
                >
                  Forgot Password?
                </p>
              )}
    <button
  type="submit"
  className="w-full mt-2 bg-purple-600 hover:bg-purple-800 text-white py-2 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
  disabled={loading}
>
  {loading
    ? (isLogin ? "Logging in..." : "Signing up...")
    : (isLogin ? "Login" : "Sign Up")}
</button>
            </form>
            <p className="text-sm text-white ">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span
                onClick={() => setIsLogin(!isLogin)}
                className="text-purple-600 underline cursor-pointer hover:text-white transition-all duration-300 ease-in-out"
              >
                {isLogin ? "Sign Up" : "Login"}
              </span>
            </p>
          <div className="flex gap-5 justify-center w-full mt-4">

  {/* Google */}
  <button
    disabled={loading}
    onClick={() =>
      signIn("google", {
        callbackUrl: "/dashboard",
      })
    }
    className="w-9 h-9 flex items-center justify-center bg-white hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50 hover:cursor-pointer"
  >
    <img
      src="https://www.svgrepo.com/show/475656/google-color.svg"
      alt="Google"
      className="w-5 h-5"
    />
  </button>

  {/* GitHub */}
  <button
    disabled={loading}
    onClick={() =>
      signIn("github", {
        callbackUrl: "/dashboard",
      })
    }
    className="w-9 h-9 flex items-center justify-center bg-gray-800 hover:bg-gray-900 rounded-xl transition-all disabled:opacity-50 hover:cursor-pointer"
  >
    <img
      src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
      alt="GitHub"
      className="w-6 h-6 invert"
    />
  </button>
</div>
          </div>      
        </div>
        
      )}
      
      
    </div>
  );
}