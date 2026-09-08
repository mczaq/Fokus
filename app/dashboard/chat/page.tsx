"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

interface Thread {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function AdminChatPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "admin" && user.role !== "superuser") {
      router.push("/dashboard");
    }
  }, [user, isAuthenticated, router]);

  // Poll for thread list and active chat stream
  useEffect(() => {
    if (!user) return;

    fetchThreads();
    const threadsInterval = setInterval(() => {
      fetchThreads(true);
    }, 5000);

    return () => clearInterval(threadsInterval);
  }, [user]);

  useEffect(() => {
    if (!user || !selectedThread) return;

    fetchMessages();
    const messagesInterval = setInterval(() => {
      fetchMessages(true);
    }, 5000);

    return () => clearInterval(messagesInterval);
  }, [user, selectedThread]);

  // Scroll to bottom when message list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchThreads = (silent = false) => {
    if (!user) return;
    if (!silent) setLoadingThreads(true);

    fetch(`/api/chat?userId=${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setThreads(data || []);
      })
      .catch((err) => console.error("Error fetching threads:", err))
      .finally(() => {
        if (!silent) setLoadingThreads(false);
      });
  };

  const fetchMessages = (silent = false) => {
    if (!user || !selectedThread) return;
    if (!silent) setLoadingMessages(true);

    fetch(`/api/chat?userId=${user.id}&opponentId=${selectedThread.userId}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data || []);
      })
      .catch((err) => console.error("Error fetching messages:", err))
      .finally(() => {
        if (!silent) setLoadingMessages(false);
      });
  };

  const handleSelectThread = (thread: Thread) => {
    setSelectedThread(thread);
    setMessages([]);
    // Reset unread count locally for instant UI feedback
    setThreads((prev) =>
      prev.map((t) => (t.userId === thread.userId ? { ...t, unreadCount: 0 } : t))
    );
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !user || !selectedThread) return;

    const payload = {
      senderId: user.id,
      receiverId: selectedThread.userId,
      content: replyText.trim()
    };

    setReplyText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        
        // Update last message in threads list
        setThreads((prev) =>
          prev.map((t) =>
            t.userId === selectedThread.userId
              ? { ...t, lastMessage: newMsg.content, lastMessageTime: newMsg.createdAt }
              : t
          )
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "superuser")) return null;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row border border-neutral-200 bg-white font-mono text-xs relative viewfinder-box p-1">
      <div className="viewfinder-corners-bottom"></div>

      {/* Left panel: active threads */}
      <div className="w-full md:w-80 border-r border-neutral-200 flex flex-col bg-[#FAF9F5] shrink-0">
        <div className="p-4 border-b border-neutral-200 bg-white">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Obrolan Pelanggan</h2>
          <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Daftar thread pesan aktif</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
          {loadingThreads && threads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 uppercase text-[9px] tracking-wider">Memuat pesan...</div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 uppercase text-[9px] tracking-widest font-bold">Tidak ada pesan masuk.</div>
          ) : (
            threads.map((t) => {
              const isActive = selectedThread?.userId === t.userId;
              return (
                <button
                  key={t.userId}
                  onClick={() => handleSelectThread(t)}
                  className={`w-full text-left p-4 flex flex-col gap-1 transition-colors select-none cursor-pointer ${
                    isActive ? "bg-neutral-100 border-l-4 border-l-black" : "bg-white hover:bg-neutral-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-serif italic font-bold text-slate-800 text-[11px] truncate max-w-[140px]">
                      {t.userName}
                    </span>
                    <span className="text-[8px] text-slate-400">
                      {new Date(t.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <p className="text-[10px] text-slate-500 truncate max-w-[170px] uppercase tracking-wider">
                      {t.lastMessage}
                    </p>
                    {t.unreadCount > 0 && (
                      <span className="bg-black text-white font-bold text-[8px] w-4 h-4 rounded-none flex items-center justify-center shrink-0">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: message stream */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {selectedThread ? (
          <>
            {/* Header info */}
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center select-none bg-[#FAF9F5]">
              <div>
                <h3 className="font-serif italic font-bold text-slate-900 text-sm">
                  {selectedThread.userName}
                </h3>
                <p className="text-[9px] text-slate-400 tracking-wider uppercase mt-0.5">
                  {selectedThread.userEmail}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
              {loadingMessages && messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 uppercase text-[9px] tracking-wider">
                  Loading message stream...
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
                        className={`max-w-[70%] px-4 py-3 border ${
                          isMe
                            ? "bg-black border-black text-white"
                            : "bg-[#FAF9F5] border-neutral-250 text-slate-800"
                        }`}
                      >
                        <p className="leading-relaxed break-words text-[11px] whitespace-pre-line">{msg.content}</p>
                        <span
                          className={`block text-[8px] mt-1.5 text-right ${
                            isMe ? "text-neutral-300" : "text-slate-400"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-neutral-200 bg-[#FAF9F5] flex gap-3">
              <input
                type="text"
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Balas pesan ${selectedThread.userName}...`}
                className="flex-1 px-4 py-2.5 border border-neutral-300 bg-white text-xs font-mono focus:outline-hidden focus:border-black"
              />
              <button
                type="submit"
                className="bg-neutral-950 hover:bg-neutral-800 text-white font-mono text-[9px] uppercase tracking-widest px-6 py-2.5 transition-colors cursor-pointer shrink-0"
              >
                Kirim Balasan
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#FAF9F5] select-none">
            <div className="w-16 h-16 border border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 font-serif italic text-2xl mb-4">
              F
            </div>
            <span className="text-[10px] font-bold text-slate-800 font-mono uppercase tracking-widest mb-1">
              Pilih Obrolan
            </span>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest max-w-xs">
              Klik salah satu thread pelanggan di panel sebelah kiri untuk melihat pesan dan mulai membalas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
