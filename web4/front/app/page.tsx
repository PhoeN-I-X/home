'use client'

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-cyan-100 p-4">
    

      <div className="mb-8">
        <Image
          src="/logo.svg" 
          alt="Chat Illustration"
          style={{ objectFit: 'contain' }}
        />
      </div>

      <button
        className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-semibold text-black transition-colors"
        onClick={() => router.push('/auth')}
      >
        Войти / Зарегистрироваться
      </button>
    </main>
  )
}
