"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {

const handleLogout = () => {
	signOut({callbackUrl: "/",});
};

		return (
				<button	onClick={handleLogout}   className="flex-1 bg-red-500 text-white px-1 py-2 sm:py-2 md:py-1 text-sm rounded-xl hover:cursor-pointer hover:bg-red-400">
						Logout
				</button>
		);
}				