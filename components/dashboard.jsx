"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { generateToken } from "@/firebase";
import "../app/globals.css";
import LogoutButton from "../components/logoutButton";
import { useSession } from "next-auth/react";



export default function Dashboard() {

  const recognitionRef = useRef(null);
const inputRef = useRef(null);
  const [listening, setListening] = useState(false);

  const router = useRouter();
const { data: session, status } = useSession();


const [currentUser, setCurrentUser] = useState(null);
const [isUserLoading, setIsUserLoading] = useState(true);
const [editName, setEditName] = useState("");
const [editEmail, setEditEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const isDisabled = message.trim() === "";

  const [showInbox, setShowInbox] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
const [hasNewRequests, setHasNewRequests] = useState(false);
 const [loading, setLoading] = useState(false);
 const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfile2, setShowProfile2] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
 
  
  const [lastMessageMap, setLastMessageMap] = useState({});
  
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  

  function startVoice() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech Recognition not supported");
    return;
  }

  // cleanup old instance
  if (recognitionRef.current) {
    recognitionRef.current.stop?.();
  }

  const recognition = new SpeechRecognition();
  recognitionRef.current = recognition;

  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  setListening(true);

  let lastFinalTranscript = "";

  recognition.onresult = (event) => {
    let transcript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;

      // only take final results
      if (event.results[i].isFinal) {
        transcript += text;
      }
    }

    if (!transcript || transcript === lastFinalTranscript) return;

    lastFinalTranscript = transcript;

    setMessage((prev) => {
      const base = prev.trim();
      return base ? `${base} ${transcript.trim()}` : transcript.trim();
    });
  };

  recognition.onerror = () => {
    setListening(false);
  };

  recognition.onend = () => {
    setListening(false);
  };

  recognition.start();
}

function stopVoice() {
  if (recognitionRef.current?.stop) {
    recognitionRef.current.stop();
  }

  recognitionRef.current = null;
  setListening(false);
}



  const [unreadCounts, setUnreadCounts] = useState(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("unreadCounts");
    return saved ? JSON.parse(saved) : {};
  }
  return {};
});


useEffect(() => {
  chatEndRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "end",
  });
}, [chat]);





const apiFetch = async (url, options = {}) => {

  const baseurl=process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch(
    `${baseurl}${url}`,
    {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

async function namefecth() { 
			try {
				const res = await apiFetch("/api/me");
				return res;
			} catch (err) {
				console.error("Error fetching user data:", err);
				return null;
			} 
		}

useEffect(() => {
  if (status === "loading") return;

  if (!session?.user?.id) {
    logout();
    return;
  }

  const loadUser = async () => {
    const dbUser = await namefecth();

    if (!dbUser) {
      logout();
      return;
    }

    const userData = {
      _id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image,
    };

    setCurrentUser(userData);
    setEditName(dbUser.name || "");
    setEditEmail(dbUser.email || "");
    setIsUserLoading(false);
  };

  loadUser();
}, [session, status]);



const CreateToken=async ()=>{
const token = await generateToken();
 
if(!token) return ;
 

try {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:5000"}/api/save-token`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: currentUser?._id,
        token,
        fromname:currentUser.name
      }),
    }
  );
 
} catch (err) {
  console.log("ERROR:", err);
}

}


useEffect(() => {
  if (currentUser?._id) {
    fetchRequests(currentUser._id);
  }
}, [currentUser]);
  
useEffect(()=>{
  if(currentUser){
  CreateToken()
}

},[currentUser])



  /* ---------------- USERS ---------------- */
 useEffect(() => {
  if (status !== "authenticated") return;

  const fetchUsers = async () => {
    try {
      setIsUsersLoading(true);

      const res = await apiFetch("/api/auth/contacts");

      setUsers(res);
    } catch (err) {
      console.error(err);
					setUsers([]);
    } finally {
      setIsUsersLoading(false);
    }
  };

  fetchUsers();
}, [status]);


  
useEffect(() => {
  localStorage.setItem("unreadCounts", JSON.stringify(unreadCounts));
}, [unreadCounts]);





  /* ---------------- FETCH CHAT ---------------- */
  useEffect(() => {
    if (!selectedUser || !currentUser) return;


    let seenTimeout;

const markSeenDebounced = (userId, contactId) => {
  clearTimeout(seenTimeout);

  seenTimeout = setTimeout(() => {
    fetch("/api/auth/message-seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, contactId }),
    });
  }, 800);
};

    const fetchChat = async () => {
      try {
        setIsChatLoading(true);
        const res = await apiFetch(
          `/api/auth/messages?userId=${currentUser._id}&contactId=${selectedUser._id}`
        );
        setChat(res);
        setIsChatLoading(false)
      } catch (err) {
        console.error(err);
        setIsChatLoading(false)
      }
    };

    markSeenDebounced(currentUser._id,selectedUser._id)
    fetchChat();


  }, [selectedUser, currentUser]);


  const handleReject = async (id) => {
  try {
    const res = await apiFetch("/api/friend/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestId: id }),
    });

 
    toast.success(res.message);

    // ✅ remove from UI instantly
    setFriendRequests(prev => prev.filter(req => req._id !== id));

  } catch (err) {
    toast.error("Failed to reject");
  }
};


const formatDateTime = (dateString) => {

  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return `${date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  })} ${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};


const sendMessage = async () => {
  if (!selectedUser || !message) return;

  const payload = {
    from: currentUser._id,
    to: selectedUser._id,
    message,
    type: "text",
    createdAt: new Date().toISOString(),
  };

  try {
    await apiFetch("/api/auth/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    socketRef.current?.emit("private-message", payload);

    setChat((prev) => [...prev, payload]);

    updateLastMessage(payload);

    setMessage("");
  } catch (err) {
    console.error("sendMessage error:", err);
  }
};



  /* ---------------- SOCKET ---------------- */
useEffect(() => {
  if (!currentUser?._id) return;

  socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
    withCredentials: true,
    transports: ["websocket"],
  });

  socketRef.current.emit("register", currentUser._id);

   socketRef.current.on("online-users", (usersArray) => {
    setOnlineUsers(usersArray);
  });

socketRef.current.emit("user-online", {
    userId: currentUser._id,
    name: currentUser.name,
  });

socketRef.current.on("unread-messages", (data) => {
  updateLastMessage({
    senderId: data.from,
    receiverId: currentUser._id,
    createdAt: data.createdAt,
  });

  if (selectedUser && data.from === selectedUser._id) {

    // Add message to chat
    setChat(prev => [...prev, data]);

    // Reset unread count immediately
    setUnreadCounts(prev => ({
      ...prev,
      [data.from]: 0,
    }));

    // Tell backend these messages are seen
    //socketRef.current.emit("mark-seen", { 
    //  userId: currentUser._id, 
    //  contactId: data.from 
    //});
  } else {
    // Increment unread count for other users
    setUnreadCounts(prev => ({
      ...prev,
      [data.from]: (prev[data.from] || 0) + 1,
    }));
  }
});

  socketRef.current.on("receive-message", (data) => {
  // Update last message for sorting
  updateLastMessage({
    senderId: data.from,
    receiverId: currentUser._id,
    createdAt: data.createdAt,
  });

  if (selectedUser && data.from === selectedUser._id) {

    
    // Add message to chat
    setChat((prev) => [...prev, data]);

    // Reset unread count
    setUnreadCounts((prev) => ({
      ...prev,
      [data.from]: 0,
    }));


    // Tell backend these messages are seen
    socketRef.current.emit("mark-seen", {
      userId: currentUser._id,
      contactId: data.from,
    });
  } 
  //else {
      
  //  // Increment unread count for other contacts
  //  setUnreadCounts((prev) => ({
  //    ...prev,
  //    [data.from]: (prev[data.from] || 0) + 1,
  //  }));
  //}
});

  return () => socketRef.current?.disconnect();
}, [currentUser, selectedUser]);


  
 /* ---------------- SORT USERS ---------------- */


const sortedUsers = useMemo(() => {
	if (!Array.isArray(users)) return [];
  return [...users].sort((a, b) => {
    const aUnread = unreadCounts[a._id] || 0;
    const bUnread = unreadCounts[b._id] || 0;

    // 🔥 Step 1: Unread priority
    if (aUnread > 0 && bUnread === 0) return -1;
    if (bUnread > 0 && aUnread === 0) return 1;

    // 🔥 Step 2: Sort by last message timestamp
    const aLast = lastMessageMap[a._id];
    const bLast = lastMessageMap[b._id];

    if (!aLast && !bLast) return 0;
    if (!aLast) return 1;
    if (!bLast) return -1;

    return bLast - aLast;
  });
}, [users, lastMessageMap, unreadCounts]);


const fetchRequests = async (userId) => {
  try {
    const data  = await apiFetch(`/api/friend/requests?userId=${userId}`);

    // ✅ check unseen requests from backend
    const hasUnseen = data.some(req => req.seen === false);

    setHasNewRequests(hasUnseen);
    setFriendRequests(data);

  } catch (err) {
    console.error("Error fetching requests", err);
  }
};


const handleAccept = async (id) => {
  try {
    const  data  = await apiFetch("/api/friend/accept", {
      method: "POST",
      body: JSON.stringify({ requestId: id }),
    });

    toast.success(data.message);
    setLoading(true);
    setFriendRequests(prev => prev.filter(req => req._id !== id));
    

  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to accept");
  }
};


  /* ---------------- LOGOUT ---------------- */
  const logout = async () => {
    socketRef.current?.disconnect();
    await apiFetch("/api/auth/logout", {
      method: "POST",
    });
    localStorage.removeItem("unreadCounts");
    localStorage.removeItem("lastMessageMap");
  
    router.push("/");
  };


  useEffect(() => {
  const stored = localStorage.getItem("lastMessageMap");
  if (stored) {
    setLastMessageMap(JSON.parse(stored));
  }
}, []);
  
 useEffect(() => {
  if (status === "loading") return;

  if (!session?.user) {
    logout();
    return;
  }

  const userData = {
    _id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  setCurrentUser(userData);
  setEditName(userData.name || "");
  setEditEmail(userData.email || "");
  setIsUserLoading(false);
}, [session, status]);

const handleInboxClick = async () => {
setHasNewRequests(false)
  try {
    setLoading(true);

    // 🔥 call backend to mark all as seen
    await apiFetch("/api/friend/mark-seen", {
      method: "POST",
      body: JSON.stringify({
        userId: currentUser._id,
      }),
    });

    // ✅ update UI
    setShowInbox(true);

    const ids = friendRequests.map(r => r._id);
    localStorage.setItem("seenRequestIds", JSON.stringify(ids));

    setHasNewRequests(false);

  } catch (err) {
    console.error(err);
    toast.error("Failed to mark as seen");
  } finally {
    // ✅ ALWAYS stop loading
    setLoading(false);
  }
};

const updateLastMessage = (msg) => {
  const otherUserId =
    msg.senderId === currentUser._id
      ? msg.receiverId
      : msg.senderId;

  const timestamp = msg.createdAt
    ? new Date(msg.createdAt).getTime()
    : Date.now();

  setLastMessageMap((prev) => {
    const updated = {
      ...prev,
      [otherUserId]: timestamp,
    };

    localStorage.setItem(
      "lastMessageMap",
      JSON.stringify(updated)
    );

    return updated;
  });
};



const handleAddContact = async () => {
  try {
    setLoading(true);
    const data=await apiFetch("/api/auth/add-contact", {
      method: "POST",
      body: JSON.stringify({ to:email ,from:currentUser._id,senderName:currentUser.name }),
    });
  
toast.success(data?.message);
    setShowAddModal(false);
    setLoading(false);
    setEmail("");
    

  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to add contact");
    setLoading(false);
    setEmail("");
  }
};


  /* ---------------- SAVE PROFILE ---------------- */
  const saveProfile = async () => {
    try {
      const res = await apiFetch("/api/auth/update-profile", {
        method: "PUT",
        body: JSON.stringify({
          name: editName,
          email: editEmail,
        }),
      });
        toast.success("Profile updated successfully");



      setCurrentUser(prev => ({ ...prev, name: editName}));
      setIsEditing(false);
    } catch (err) {
      console.error(err);
						toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

if (isUserLoading) {
  return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-sm text-gray-500">
        Verifying secure session...
      </p>
    </div>
  );
}



  return (
    <>
      <div className="min-h-screen bg-gray-100 p-3 sm:p-4 md:p-6 
                 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

        {/* LEFT PANEL */}
        <div className={`bg-white rounded-2xl shadow-lg p-4 md:p-5 flex flex-col 
        h-[calc(100vh-24px)] md:h-[calc(100vh-48px)]
        ${selectedUser ? "hidden md:flex" : "flex"}`}>
          <div className="flex justify-between items-center mb-2 shrink-0">
            
            <button
  onClick={() => setShowProfile(true)}
  className="w-10 h-10 md:w-11 md:h-11 hover:cursor-pointer rounded-full bg-blue-500 text-white font-semibold flex items-center justify-center overflow-hidden"
>
  {session?.user?.image ? (
    <img
      src={session.user.image}
      alt="profile"
      className="w-full h-full object-cover"
    />
  ) : (
    currentUser?.name?.charAt(0)?.toUpperCase()
  )}
</button>

            <button
              onClick={() => setShowAddModal(true)}
className="bg-blue-500 text-white px-3 md:px-4 py-2 rounded-lg text-sm hover:cursor-pointer">
              Add
            </button>

          </div>
<div className="py-4 mb-3 w-full">
  <input type="text" name="search" id="search" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
   className="w-full p-2  border focus:outline-2 rounded-lg outline-blue-500"/></div>
          <ul className="space-y-3 overflow-y-auto flex-1 min-h-0 no-scrollbar">
            {isUsersLoading ? (
              <div className="text-center text-gray-400 mt-10">
                Loading contacts...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-400 mt-10">
                No contacts found
              </div>
            ) : (
            sortedUsers.filter((item)=>{return item.name.toLowerCase().includes(searchTerm.toLowerCase())}).map((user) => {
              const isOnline = onlineUsers.includes(user._id);

              return (
                <li
                  key={user._id}
                onClick={() => {
  setSelectedUser(user);

  setUnreadCounts((prev) => ({
    ...prev,
    [user._id]: 0,
  }));
}}
                  className={`p-3 border rounded-xl cursor-pointer ${
                  selectedUser?._id === user._id
                    ? "bg-blue-50 border-blue-400"
                    : "hover:bg-gray-50"
                }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>{user.name}</span>

                      {/* Green Dot */}
                       {unreadCounts[user._id] > 0 && selectedUser?._id !== user._id && (
      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
    )}
  </div>

  {/* Unread Count Badge */}
  {unreadCounts[user._id] > 0 && selectedUser?._id !== user._id && (
    <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
      {unreadCounts[user._id]}
    </span>
                    )}
                  </div>

                  <div className="text-xs mt-1">
                    <span
                      className={
                        isOnline ? "text-green-600" : "text-gray-400"
                      }
                    >
                      ● {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </li>
              );
            })
          )}
        </ul>
       <style jsx>{`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-3px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(5px); }
    }

    .animate-shake {
      animation: shake 0.5s ease-in-out infinite;
    }
  `}</style>

  <button
  onClick={() => {
    handleInboxClick();
    setShowInbox(true);
    setHasNewRequests(false);
  }}

  
  disabled={loading}
  className={`px-3 py-2 mt-2 rounded-lg text-sm text-white transition
  ${hasNewRequests ? "bg-blue-500 animate-shake" : "bg-blue-400"}
  ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
>
  {loading ? "Opening..." : "Inbox"}
</button>
      </div>

        {/* RIGHT PANEL */}
        <div className={`col-span-1 md:col-span-2 bg-white rounded-2xl shadow-lg 
        flex flex-col h-[calc(100vh-24px)] md:h-[calc(100vh-48px)] 
        overflow-hidden
        ${!selectedUser ? "hidden md:flex" : "flex"}`}> 

          {!selectedUser ? (
            <div className="flex items-center justify-center flex-1 text-gray-400">
              Select a contact to start chatting
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
                <div className="flex items-center justify-center gap-5">
                   <button
  onClick={() => setShowProfile2(true)}
  className="w-10 h-10 rounded-full overflow-hidden bg-blue-500 text-white font-semibold flex items-center justify-center hover:cursor-pointer"
>
  {selectedUser?.image ? (
    <img
      src={selectedUser.image}
      alt={selectedUser.name}
      className="w-full h-full object-cover"
    />
  ) : (
    selectedUser?.name?.charAt(0).toUpperCase()
  )}
</button>
<div className="flex flex-col justify-center">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate max-w-35 sm:max-w-none">
                    {selectedUser.name}
                  </h2>
                
                   <span
        className={`text-xs sm:text-sm font-sans ${
          onlineUsers.includes(selectedUser._id)
            ? "text-green-600"
            : "text-gray-400"
        }`}
      >
        {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
      </span>
                
                  </div>
                </div>
 
                <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 text-xl hover:cursor-pointer"
              >
                <span className="md:hidden text-2xl">←</span>
                <span className="hidden md:inline">✕</span>
              </button>


            </div>

              {/* CHAT SCROLL AREA */}
<div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 no-scrollbar">
  {isChatLoading ? (
    <div className="text-center text-gray-400 mt-10">
      Loading Messages...
    </div>
  ) : chat.length === 0 ? (
    <div className="text-center text-gray-400 mt-10">
      No Messages found
    </div>
  ) : (
    chat.map((msg, i) => {
      const isMe = msg.from === currentUser._id;

      return (
        <div
          key={i}
          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[75%] sm:max-w-xs p-3 rounded-xl wrap-break-words ${
              isMe ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {msg.message}

            {/* Footer */}
            <div className="text-[10px] mt-1 flex justify-between items-center opacity-80">

              <span>
                {formatDateTime(msg.createdAt).slice(0, 8)}{" "}
                {formatDateTime(msg.createdAt).slice(8)}
              </span>

            {isMe && (
  <span className="ml-2 text-1xl">
    {msg.seen ? (
      <span className="text-white">seen</span>
    ) : msg.sending||false ? (
      <span className="text-gray-500">receive</span>
    ) : (
      <span className="text-gray-300">sent</span>
    )}
  </span>
)}

            </div>
          </div>
        </div>
      );
    })
  )}

  <div ref={chatEndRef} />
</div>

             

              {/* INPUT */}
          <div className="py-4 px-5 border-t border-gray-300 bg-white">
  <div className="flex items-center gap-4 w-full">

    <input
      type="text"
      ref={inputRef}
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !isDisabled) {
          e.preventDefault();
        }
      }}
      className="flex-1 min-w-0 border rounded-full 
                 px-4 py-2 text-sm
                 focus:outline-none focus:ring-1 focus:ring-blue-500"
      placeholder="Your message..."
    />

<button
  onClick={listening ? stopVoice : startVoice}
  className={`px-2 py-2 rounded-full font-semibold transition ${
    listening
      ? "bg-red-600 text-white animate-pulse"
      : "bg-purple-600 hover:bg-purple-700 text-white"
  }`}
>
  {listening ? "🎤" : "🎤"}
</button>

    <button
  onClick={sendMessage}
  disabled={isDisabled}
  className={`shrink-0 p-2 rounded-full text-white transition
    ${
      isDisabled
        ? "bg-blue-500 opacity-50 cursor-not-allowed"
        : "bg-blue-500 active:scale-95 hover:cursor-pointer"
    }`}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-6 h-6 rotate-[-30deg]"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 12L3 21l18-9L3 3l3 9h7"
    />
  </svg>
</button>

  </div>
</div>
            </>
          )}
        </div>
      </div>

      {/* PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 z-50 font-mono flex items-center justify-center">
          <div
            onClick={() => {
              setShowProfile(false);
              setIsEditing(false);
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative bg-white w-96 max-w-[90%] rounded-2xl shadow-2xl p-8">
            <button
              onClick={() => {
                setShowProfile(false);
                setIsEditing(false);
              }}
              className="absolute top-3 right-6 text-gray-400 hover:text-gray-700 hover:cursor-pointer"
            >
              ✕
            </button>
    
            <div className="flex flex-col items-center space-y-6 text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-linear-to-br from-blue-500 to-indigo-600 text-white text-4xl font-bold flex items-center justify-center shadow-lg">
  {currentUser?.image ? (
    <img
      src={currentUser.image}
      alt={currentUser.name}
      className="w-full h-full object-cover"
    />
  ) : (
    currentUser?.name?.charAt(0)?.toUpperCase()
  )}
</div>
              {!isEditing ? (
                <>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800">
                      {currentUser?.name}
                    </h3>
                    <p className="text-gray-500 mt-1">{currentUser.email}</p>
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setIsEditing(true)}
                     
                      className="flex-1 bg-blue-600 px-1 py-1 sm:py-2 md:py-1 text-sm text-white  rounded-xl hover:cursor-pointer hover:bg-blue-500"
                    >
                      Edit
                    </button>
                    <button
    onClick={() => router.push("/signin")}
    className="flex-1 bg-purple-500 text-white px-1 py-1 sm:py-2 md:py-1 text-sm rounded-xl hover:cursor-pointer hover:bg-purple-400"
  >
    Login
  </button>
                <LogoutButton/>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full space-y-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
        if (e.key === "Enter" && !(editName.length<3)) {
          e.preventDefault();
        }
      }}
                      className="w-full border rounded-xl px-4 py-2"
                    />
                    <input
                      type="email"
                      readOnly
                      
                      value={editEmail}
                        onKeyDown={(e) => {
        if (e.key === "Enter" && !(editName.length<3)) {
          e.preventDefault();
        }
      }}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full border rounded-xl px-4 py-2 bg-gray-200"
                    />
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={saveProfile}
                      className={`flex-1 bg-green-600 text-white py-2 rounded-xl  ${(editName.length<4)?"opacity-40 cursor-not-allowed":"opacity-100 cursor-pointer"}`}
                    disabled={(editName.length<4)}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-400 text-white py-2 rounded-xl hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}


{showInbox && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    
    {/* Overlay */}
    <div
      onClick={() => setShowInbox(false)}
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
    />

    {/* Modal */}
    <div className="relative w-full max-w-md bg-white rounded-2xl p-5 shadow-xl">

      <button
        onClick={() => setShowInbox(false)}
        className="absolute top-3 right-5 text-gray-400 hover:text-gray-700 hover:cursor-pointer"
      >
        ✕
      </button>

      <h2 className="text-lg font-semibold mb-4">Friend Requests</h2>

      {friendRequests.length === 0 ? (
        <p className="text-gray-400 text-center">No requests</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-auto">
          {friendRequests.map((req) => (
            <div
              key={req._id}
              className="flex justify-between items-center border p-3 rounded-lg"
            >
              <span>{req.name}</span>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(req._id)}
                  className="bg-green-700 text-white px-3 py-1 rounded hover:cursor-pointer"
                >
                  Accept
                </button>

                <button
                  onClick={() => handleReject(req._id)}
                  className="bg-red-700 text-white px-3 py-1 rounded hover:cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

{showAddModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
    
    {/* Overlay */}
    <div
      onClick={() => {
        setShowAddModal(false);
        setEmail("");
      }}
      className="absolute inset-0 bg-black/30 backdrop-blur-sm"
    />

    {/* Modal */}
    <div className="relative w-full max-w-sm sm:max-w-md 
                    bg-white rounded-2xl shadow-xl 
                    p-5 sm:p-6">
      
      {/* Close Button */}
      <button
        onClick={() => {
          setShowAddModal(false);
          setEmail("");
        }}
        className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-lg hover:cursor-pointer"
      >
        ✕
      </button>

      <h2 className="font-semibold text-lg mb-4 text-center sm:text-left">
        Add Contact
      </h2>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter Gmail"
          onKeyDown={(e) => {
        if (e.key === "Enter" && !isDisabled) {
          e.preventDefault();
        }
      }}
        className="border w-full px-3 py-2 rounded-md mb-3 
                   text-sm sm:text-base
                   focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

   <button
        onClick={handleAddContact}
      disabled={email.trim() === "" || loading || !email.includes("@gmail.com")}
        className={`w-full py-2 rounded-md text-white transition 
    ${(email.trim() === "" || loading || !email.includes("@gmail.com")) 
      ? "opacity-50 cursor-not-allowed" 
      : "cursor-pointer active:scale-95"
    } 
    bg-blue-600`}
      >
                  {loading ? "Adding..." : "Add"}

      </button>

    </div>
  </div> 
)}


      {showProfile2 && (
        <div className="fixed inset-0 z-50 font-mono flex items-center justify-center">
          <div
            onClick={() => {
              setShowProfile2(false);
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative bg-white  max-w-[60%] min-w-70 rounded-2xl shadow-2xl p-8 ">
            <button
              onClick={() => {
                setShowProfile2(false);
                 
              }}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 hover:cursor-pointer"
            >
              ✕
            </button>
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-linear-to-br from-blue-500 to-indigo-600 text-white text-4xl font-bold flex items-center justify-center shadow-lg">
  {selectedUser?.image ? (
    <img
      src={selectedUser.image}
      alt={selectedUser.name}
      className="w-full h-full object-cover"
    />
  ) : (
    selectedUser?.name?.charAt(0)?.toUpperCase()
  )}
</div>
        
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800">
                      {selectedUser.name}
                    </h3>
                    <p className="text-gray-500 mt-1">{selectedUser.email}</p>
                  </div>
                  
  
              
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
