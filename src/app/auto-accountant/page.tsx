'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export default function AutoAccountantPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !session?.user?.id) {
        console.error("User session or ID not found. Cannot send message.");
        setMessages((prev) => [...prev, { sender: 'ai', text: 'Error: Could not find user session. Please try logging in again.'}]);
        return;
    };

    const userId = session.user.id;
    const userMessage: Message = { sender: 'user', text: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedInput, userId: userId }),
      });

      if (!res.ok) {
         const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${res.statusText}`);
      }

      const data = await res.json();
      const aiResponse: Message = {
        sender: 'ai',
        text: data.response || 'Sorry, I received an empty response.',
      };
      setMessages((prev) => [...prev, aiResponse]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorText = error instanceof Error ? error.message : 'Please try again.';
      const errorResponse: Message = {
        sender: 'ai',
        text: `Sorry, I encountered an error: ${errorText}`,
      };
       setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

   // Add a loading/unauthenticated state for the page
   if (!session) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-gray-500 dark:text-gray-400">Loading session...</p>
            </div>
        );
    }
    if (!session.user) {
         return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <p className="text-gray-500 dark:text-gray-400">Please log in to use the Auto Accountant.</p>
            </div>
        );
    }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b dark:border-gray-700 p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-100">Auto Accountant</h1>
      </header>

      {/* Message List */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] lg:max-w-[70%] px-4 py-2 rounded-lg shadow-md ${msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                }`}
            >
              {/* Simple text rendering for now, could add markdown support later */}
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {/* Loading Indicator */}
        {isLoading && (
            <div className="flex justify-start">
                <div className="px-4 py-2 rounded-lg shadow-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none animate-pulse">
                    <span className="italic">Thinking...</span>
                </div>
            </div>
        )}
        {/* Scroll Anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
                // Send on Enter (but not Shift+Enter for potential multi-line input later)
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault(); // Prevent default newline on Enter
                    handleSend();
                }
            }}
            placeholder="Ask about your transactions..."
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out shadow-sm"
            aria-label="Send message"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 