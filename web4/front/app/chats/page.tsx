"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Chat {
  id: number;
  createdAt: string;
  messages: {
    id: number;
    chatId: number;
    userId: number;
    text: string;
    attachment?: string | null;
    createdAt: string;
  }[];
  users: {
    user: {
      id: number;
      username: string;
    };
  }[];
}

export default function ChatsPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [username, setUsername] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  let currentUser = "unknown";

  const fetchChats = async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chats?page=${page}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        router.push("/auth");
        return;
      }

      const data = await res.json();
      currentUser = data.user.username;
      setChats(data.chats || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (username.length < 1) {
      setUserSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingUsers(true);
        const res = await fetch(`${API_URL}/users?search=${username}`, {
          credentials: 'include',
        });

        if (res.ok) {
          const users = await res.json();
          setUserSuggestions(users);
          setShowDropdown(true);
        }
      } catch {
      } finally {
        setLoadingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username]);

  const handleCreateChat = async () => {
    const res = await fetch(`${API_URL}/chats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include',
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (res.ok) {
      fetchChats(currentPage);
      setUsername("");
      setUserSuggestions([]);
      setShowDropdown(false);
    } else {
      alert(data.message || "Не удалось создать чат");
    }
  };

  const handleLogout = async () => {
    const res = await fetch(`${API_URL}/auth/logout`, {
      credentials: 'include'
    });
    if (res.ok) {
      router.push("/auth");
    } else {
      alert("Не удалось выйти");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Кнопка "Назад"
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={loading}
          className="px-3 py-1 border border-cyan-700 rounded hover:bg-cyan-700/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ←
        </button>
      );
    }

    // Первая страница
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          disabled={loading}
          className="px-3 py-1 border border-cyan-700 rounded hover:bg-cyan-700/20 disabled:opacity-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-2 text-gray-400">
            ...
          </span>
        );
      }
    }

    // Страницы
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          disabled={loading}
          className={`px-3 py-1 border rounded ${
            currentPage === i
              ? "bg-cyan-600 text-black border-cyan-600"
              : "border-cyan-700 hover:bg-cyan-700/20"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {i}
        </button>
      );
    }

    // Последняя страница
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-2 text-gray-400">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          disabled={loading}
          className="px-3 py-1 border border-cyan-700 rounded hover:bg-cyan-700/20 disabled:opacity-50"
        >
          {totalPages}
        </button>
      );
    }

    // Кнопка "Вперед"
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={loading}
          className="px-3 py-1 border border-cyan-700 rounded hover:bg-cyan-700/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          →
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-gray-900 p-6 rounded-lg text-cyan-100 relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Чаты</h1>

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
        >
          Выйти
        </button>
      </div>

      <div className="mb-4 relative">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Введите имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => username && setShowDropdown(true)}
            className="flex-1 border p-2 rounded bg-gray-800 text-cyan-100"
          />

          <button
            onClick={handleCreateChat}
            className="bg-cyan-600 text-black px-4 py-2 rounded font-semibold"
          >
            Создать чат
          </button>
        </div>

        {showDropdown && userSuggestions.length > 0 && (
          <ul className="absolute left-0 right-0 mt-1 bg-gray-800 border border-cyan-700 rounded shadow-lg z-20 max-h-48 overflow-y-auto">
            {loadingUsers && (
              <li className="p-2 text-gray-400">Поиск...</li>
            )}

            {!loadingUsers &&
              userSuggestions.map((u) => (
                <li
                  key={u.id}
                  className="p-2 hover:bg-cyan-700/20 cursor-pointer"
                  onClick={() => {
                    setUsername(u.username);
                    setShowDropdown(false);
                  }}
                >
                  {u.username}
                </li>
              ))}
          </ul>
        )}
      </div>

      {loading && (
        <div className="text-center py-4 text-cyan-400">Загрузка чатов...</div>
      )}

      <ul className="space-y-2 mb-6">
        {chats.map((c: Chat) => {
          const otherUser = c.users[0]?.user?.username;

          return (
            <li
              key={c.id}
              className="p-3 border border-cyan-700 rounded cursor-pointer hover:bg-cyan-700/20"
              onClick={() => router.push(`/chat/${c.id}`)}
            >
              Чат с {otherUser || "Unknown"}
              <p className="text-sm text-gray-400">
                Последнее сообщение:{" "}
                {c.messages[c.messages.length - 1]?.text ||
                  c.messages[c.messages.length - 1]?.attachment ||
                  "Пока нет сообщений"}
              </p>
            </li>
          );
        })}
      </ul>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <div className="text-sm text-gray-400 mr-4">
            Страница {currentPage} из {totalPages}
          </div>
          {renderPagination()}
        </div>
      )}

      {/* Информация о количестве чатов */}
      <div className="text-center text-sm text-gray-400 mt-4">
        Всего чатов: {totalCount}
      </div>
    </div>
  );
}