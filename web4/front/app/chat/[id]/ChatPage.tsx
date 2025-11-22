'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import ChatForm from "@/components/ChatForm";
import Image from 'next/image';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface User {
  id: number;
  username: string;
}

export interface ChatUser {
  user: User;
}

export interface Message {
  id: number;
  chatId: number;
  userId: number;
  text: string;
  attachment?: string;
  createdAt: string; 
  user: User;
}

export interface ChatResponse {
  id: number;
  createdAt: string; 
  messages: Message[];
  users: ChatUser[];
}

export default function ChatPage( { chatId }: { chatId: string } ) {

  const [messages, setMessages] = useState<Message[]>([]);
  const [peerUsername, setPeerUsername] = useState("Unknown");
  const [attachments, setAttachments] = useState<Record<number, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  let currentUser="unknown"
  const fetchChatInfo = async () => {
    try {
      
      
      
      const res = await fetch(`${API_URL}/chats/${chatId}`, { credentials:'include', cache: "no-store" });
      if (!res.ok) {
        return router.push("/chats");
      }
      const data = await res.json();
      currentUser = data.user.username;
      setMessages(data.chat.messages || []);

      if (Array.isArray(data.chat.users)) {
        const peer = data.chat.users[0]?.user
        setPeerUsername(peer ? peer.username : "Unknown");
      } else {
        setPeerUsername("Unknown");
      }
      const newAttachments: Record<number, string> = {};
      for (const msg of data.chat.messages) {
        if (msg.attachment) {
          const imgRes = await fetch(`${API_URL}/chats/${chatId}/attachment/${msg.attachment}`, {
            credentials:'include',
          });
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            const objectUrl = URL.createObjectURL(blob);
            newAttachments[msg.id] = JSON.stringify({
              url: objectUrl,
              isImage: blob.type.startsWith("image/")
            });
          }
        }
      }
      setAttachments(newAttachments);
    } catch (err) {
      console.error("Failed to fetch chat info", err);
    }
  };

  useEffect(() => {
    fetchChatInfo();
    const interval = setInterval(fetchChatInfo, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewMessage = () => fetchChatInfo();
  return (
     <div className="flex flex-col h-screen bg-gray-900 text-cyan-100">

      <header className="p-4 border-b border-cyan-800 text-xl font-semibold mx-auto max-w-xl flex items-center justify-between w-full">
       
          <button
            className="text-cyan-400 hover:text-cyan-200 font-medium"
            onClick={() => router.push("/chats")}
          >
            ← Чаты
          </button>

          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            {peerUsername}
          </div>

         
      </header>
    
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-xl mx-auto space-y-4">
        {messages.map((msg: Message, i) => (
          <div
            key={i}
            className={`flex ${
              msg.user.username !== peerUsername ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                msg.user.username === peerUsername
                  ? "bg-cyan-500/30 border border-cyan-400"
                  : "bg-gray-700/60 border border-gray-600"
              }`}
            >
              <p className="text-sm text-cyan-400 mb-1">{msg.user.username}</p>
              <p>{msg.text}</p>
              {msg.attachment && attachments[msg.id] && (() => {
                const file = JSON.parse(attachments[msg.id]);

                if (file.isImage) {
                  return (
                    <Image
                      src={file.url}
                      alt="Битый файл"
                      width={500}
                      height={300}
                      style={{ objectFit: "contain" }}
                    />
                  );
                }

                return (
                  <a
                    href={file.url}
                    download={msg.attachment}
                    className="text-cyan-300 underline block mt-2"
                  >
                    📎 Скачать файл ({msg.attachment})
                  </a>
                );
              })()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="border-t border-cyan-800 p-4 bg-black/60 sticky bottom-0">
        <ChatForm chatId={chatId} onSent={handleNewMessage} />
      </footer>
      </div>

  );
}
