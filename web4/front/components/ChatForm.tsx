"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
export default function ChatForm({
  chatId,
  onSent,
}: {
  chatId: string;
  onSent?: () => void;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setMessage("");

    const formData = new FormData();
    formData.append("text", text);
    if (file) formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/chats/${chatId}`, {
        method: "POST",
        body: formData,
        credentials:'include',
      });
      if (res.status == 413) {
        setFile(null);
        setMessage("⚠ Размер файла должен быть не более 1 МБ");
        setIsSending(false);
        return
      }
      if (res.ok) {
        setText("");
        setFile(null);
        setMessage("✅ Сообщение отправлено!");
        onSent?.();
      } else {
        const err = await res.json();
        setFile(null);
        setMessage(`⚠ Ошибка: ${err.message || "Не удалось отправить"}`);
        setIsSending(false);
        return
      }
    } catch {
      setMessage("⚠ Ошибка сети");
    }

    setIsSending(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl mx-auto p-6 rounded-2xl shadow-[0_0_15px_rgba(0,255,255,0.4)] 
      bg-gradient-to-br from-gray-900 via-gray-800 to-black 
      text-cyan-300 border border-cyan-700"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Введите сообщение..."
        className="w-full h-28 p-3 mb-4 bg-black/40 border border-cyan-700 rounded-lg 
        text-cyan-200 placeholder-cyan-600 focus:outline-none focus:ring-2 
        focus:ring-cyan-500 resize-none"
      />

      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="px-3 py-2 rounded-md bg-cyan-800/40 border border-cyan-600 
          hover:bg-cyan-700/60 transition">
            📎 Прикрепить файл
          </span>
          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file && <span className="text-sm text-cyan-400">{file.name}</span>}
        </label>

        <button
          type="submit"
          disabled={isSending}
          className={`px-5 py-2 rounded-lg font-semibold text-black transition
            ${isSending
              ? "bg-cyan-400/50 cursor-not-allowed"
              : "bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.6)]"
            }`}
        >
          {isSending ? "⏳ Отправка..." : "🚀 Отправить"}
        </button>
      </div>

      {message && (
        <p
          className={`text-center text-sm mt-2 ${message.startsWith("✅")
              ? "text-green-400"
              : message.startsWith("⚠")
                ? "text-yellow-400"
                : "text-cyan-300"
            }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
