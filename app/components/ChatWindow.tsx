"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function ChatWindow() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for messages when chat is open or when user status is loaded
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Fetch messages initially
    fetchMessages();

    // Set polling interval
    const interval = setInterval(() => {
      fetchMessages(true); // silent update
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, isOpen]);

  // Scroll to bottom whenever messages list changes or chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isOpen]);

  const fetchMessages = (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);

    fetch(`/api/chat?userId=${user.id}`)
      .then((res) => {
        if (res.ok) return res.json();
        // Silently ignore non-200 responses (e.g. 400, 500) during polling
        return [];
      })
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {
        // Silently ignore network errors during polling
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !user) return;

    const payload = {
      senderId: user.id,
      content: inputMsg.trim()
    };

    setInputMsg("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
      } else {
        console.error("Gagal mengirim pesan");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Only show for regular users (Admins use the full-screen chat page)
  if (!user || user.role !== "user") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono text-xs">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black hover:bg-neutral-800 text-white px-5 py-3 shadow-xl transition-all border border-black flex items-center gap-2 cursor-pointer select-none rounded-none"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span className="text-[10px] uppercase tracking-widest font-bold">Chat Support</span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 h-[450px] bg-[#FAF9F5] border border-neutral-900 shadow-2xl flex flex-col justify-between relative viewfinder-box">
          <div className="viewfinder-corners-bottom"></div>

          {/* Header */}
          <div className="px-4 py-3 bg-white border-b border-neutral-900 flex justify-between items-center select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-800">Fokus Support</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-800 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF9F5]">
            {loading && messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 uppercase text-[9px] tracking-wider">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Mulai Obrolan</span>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest max-w-[200px]">Tanyakan apa saja seputar booking, studio, atau alat foto di sini.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3.5 py-2.5 border ${
                        isMe
                          ? "bg-black border-black text-white"
                          : "bg-white border-neutral-200 text-slate-800"
                      }`}
                    >
                      <p className="leading-relaxed break-words text-[11px] whitespace-pre-line">{msg.content}</p>
                      <span
                        className={`block text-[8px] mt-1 text-right ${
                          isMe ? "text-neutral-300" : "text-slate-400"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-900 bg-white flex gap-2">
            <input
              type="text"
              required
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-1 px-3 py-2 border border-neutral-250 bg-white text-xs font-mono focus:outline-hidden focus:border-black"
            />
            <button
              type="submit"
              className="bg-neutral-950 hover:bg-neutral-800 text-white font-mono text-[9px] uppercase tracking-widest px-4 py-2 transition-colors cursor-pointer"
            >
              Kirim
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
