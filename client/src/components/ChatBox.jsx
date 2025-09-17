import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import Message from './Message';
import toast from 'react-hot-toast';

const ChatBox = () => {
  const containerRef = useRef(null);
  const { selectedChat, theme, user, axios, token, setUser } = useAppContext();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('text');
  const [isPublished, setIsPublished] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast('Login to send message');
    if (!prompt.trim()) return;

    const promptCopy = prompt;
    setPrompt('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: promptCopy, timestamp: Date.now(), isImage: false },
    ]);

    try {
      setLoading(true);
      const { data } = await axios.post(
        `/api/message/${mode}`,
        { chatId: selectedChat._id, prompt: promptCopy, isPublished },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setMessages((prev) => [...prev, data.reply]);
        setUser((prev) => ({
          ...prev,
          credits: prev.credits - (mode === 'image' ? 2 : 1),
        }));
      } else {
        toast.error(data.message);
        setPrompt(promptCopy);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Something went wrong');
      setPrompt(promptCopy);
    } finally {
      setLoading(false);
    }
  };

  // Load messages from selected chat
  useEffect(() => {
    if (selectedChat?.messages) {
      setMessages([...selectedChat.messages]);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col justify-between m-5 md:m-10 2xl:pr-40">
      {/* Chat messages */}
      <div ref={containerRef} className="flex-1 mb-5 overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-primary">
            <img
              src={theme === 'dark' ? assets.logo_full : assets.logo_full_dark}
              className="w-full max-w-56 sm:max-w-68"
            />
            <p className="mt-5 text-4xl sm:text-6xl text-center text-gray-400 dark:text-white">
              Ask me anything.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className="w-full">
            <Message message={message} />
            {loading && index === messages.length - 1 && (
              <div className="loader flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"
                  style={{ animationDelay: '200ms' }}
                ></div>
                <div
                  className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-white animate-bounce"
                  style={{ animationDelay: '400ms' }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image publish toggle */}
      {mode === 'image' && (
        <label className="inline-flex items-center gap-2 mb-3 text-sm mx-auto">
          <p className="text-xs">Publish Generated Image to Community</p>
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
        </label>
      )}

      {/* Input form */}
      <form
        onSubmit={onSubmit}
        className="bg-primary/20 dark:bg-[#583C79]/30 border border-primary dark:border-[#80609F]/30 rounded-full w-full max-w-2xl p-3 pl-4 mx-auto flex gap-4 items-center"
      >
        <select
          onChange={(e) => setMode(e.target.value)}
          value={mode}
          className="text-sm pl-3 pr-2 outline-none"
        >
          <option value="text" className="dark:bg-purple-900">
            Text
          </option>
          <option value="image" className="dark:bg-purple-900">
            Image
          </option>
        </select>

        <input
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
          type="text"
          placeholder="Type your prompt here..."
          className="flex-1 w-full text-sm outline-none"
          required
        />

        <button type="submit">
          <img
            src={loading ? assets.stop_icon : assets.send_icon}
            className="w-8 cursor-pointer"
          />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
