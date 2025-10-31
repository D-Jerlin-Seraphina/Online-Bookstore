import { useState, type KeyboardEvent } from 'react';
import { apiRequest } from '../lib/api.ts';
import { useAuth } from '../hooks/useAuth.ts';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  data?: ChatResponseData;
}

interface ChatResponseData {
  books?: AssistantBook[];
  book?: AssistantBook;
  alreadyListed?: boolean;
  lendingId?: string;
  dueDate?: string | Date;
  error?: string;
}

interface AssistantBook {
  id: string;
  title: string;
  author: string;
  price: number;
  genre: string;
  summary?: string;
  averageRating?: number;
  stock?: number;
}

interface ChatResponse {
  reply: string;
  action: string;
  data?: ChatResponseData;
  requiresAuth?: boolean;
}

const assistantGreeting: ChatMessage = {
  role: 'assistant',
  text: 'Hi! I can help you find books, make recommendations, or update your wishlist. What can I do for you?',
};

export const AssistantChat = () => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([assistantGreeting]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMessage: ChatMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await apiRequest<ChatResponse>('/ai/chat', {
        method: 'POST',
        body: { message: trimmed },
        token: token ?? undefined,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            response.requiresAuth && !user
              ? `${response.reply} (Sign in to let me complete that for you.)`
              : response.reply,
          data: response.data,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `I hit a snag: ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <button
        type="button"
        onClick={toggleOpen}
        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-blue-700"
      >
        {isOpen ? 'Close assistant' : 'Chat with us'}
      </button>
      {isOpen && (
        <div className="mt-3 flex h-[26rem] w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <header className="flex items-center justify-between border-b border-slate-200 bg-blue-600 px-4 py-3 text-sm font-semibold text-white">
            <span>Chapter & Chill Companion</span>
            {user && <span className="text-xs text-blue-100">Hi, {user.name.split(' ')[0]}!</span>}
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  message.role === 'assistant'
                    ? 'bg-slate-100 text-slate-700'
                    : 'ml-auto bg-blue-600 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                {message.data?.books && message.data.books.length > 0 && (
                  <ul className="mt-2 space-y-2 text-xs text-slate-600">
                    {message.data.books.map((book) => (
                      <li key={book.id} className="rounded-md border border-slate-200 bg-white px-2 py-2">
                        <p className="font-medium text-slate-800">{book.title}</p>
                        <p>{book.author}</p>
                        {book.summary && <p className="mt-1 text-slate-500">{book.summary}</p>}
                        <p className="mt-1 text-slate-500">${book.price.toFixed(2)} · {book.genre}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {message.data?.book && (
                  <div className="mt-2 rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">{message.data.book.title}</p>
                    <p>{message.data.book.author}</p>
                    {message.data.alreadyListed && <p className="mt-1 text-green-600">Already on your wishlist.</p>}
                  </div>
                )}
                {message.data?.dueDate && (
                  <p className="mt-2 text-xs text-blue-600">
                    Due date: {new Date(message.data.dueDate).toLocaleDateString()}
                  </p>
                )}
                {message.data?.error && (
                  <p className="mt-2 text-xs text-red-500">{message.data.error}</p>
                )}
              </div>
            ))}
            {loading && <p className="text-xs text-slate-400">Thinking…</p>}
          </div>
          <div className="border-t border-slate-200 p-3">
            <textarea
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to find a sci-fi book or manage your wishlist..."
              className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="mt-2 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
