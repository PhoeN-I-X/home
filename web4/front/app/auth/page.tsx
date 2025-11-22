"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AuthTabs() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (res.ok) {
      router.push("/chats"); 
    } else {
      alert(data.message || "Registration failed");
    }
  };

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (res.ok) {
       router.push("/chats"); 
  } else {
    alert(data.message || "Login failed");
  }
};


  return (
    <div className="max-w-md mx-auto mt-20 bg-gray-900 p-6 rounded-lg shadow-lg text-cyan-100">
      <div className="flex justify-around mb-6 border-b border-cyan-700">
        <button
          className={`py-2 px-4 font-semibold ${activeTab === "login" ? "border-b-2 border-cyan-400" : ""}`}
          onClick={() => setActiveTab("login")}
        >
          Вход
        </button>
        <button
          className={`py-2 px-4 font-semibold ${activeTab === "register" ? "border-b-2 border-cyan-400" : ""}`}
          onClick={() => setActiveTab("register")}
        >
          Регистрация
        </button>
      </div>

      {activeTab === "register" ? (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 rounded bg-gray-800 text-cyan-100"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded bg-gray-800 text-cyan-100"
          />
          <button type="submit" className="bg-cyan-600 text-black py-2 rounded font-semibold">
            Зарегистрироваться
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 rounded bg-gray-800 text-cyan-100"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded bg-gray-800 text-cyan-100"
          />
          <button type="submit" className="bg-cyan-600 text-black py-2 rounded font-semibold">
            Войти
          </button>
        </form>
      )}
    </div>
  );
}
