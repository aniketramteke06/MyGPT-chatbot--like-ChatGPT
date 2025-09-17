import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ✅ Fetch logged-in user
  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/data", {
        headers: { Authorization: `Bearer ${token}` }, // ✅ Fixed space
      });

      if (data.success) {
        setUser(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoadingUser(false);
    }
  };

  // ✅ Create new chat
  const createNewChat = async () => {
    try {
      if (!user) return toast("Login to create a new chat");

      navigate("/");
      await axios.get("/api/chat/create", {
        headers: { Authorization: `Bearer ${token}` }, // ✅ Fixed space
      });
      await fetchUsersChats();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ✅ Fetch user's chats
  const fetchUsersChats = async () => {
    try {
      const { data } = await axios.get("/api/chat/get", {
        headers: { Authorization: `Bearer ${token}` }, // ✅ Fixed space
      });

      if (data.success) {
        setChats(data.chats);

        if (data.chats.length === 0) {
          await createNewChat();
          return fetchUsersChats();
        } else {
          setSelectedChat(data.chats[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // ✅ Handle theme change
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // ✅ Refetch chats when user changes
  useEffect(() => {
    if (user) {
      fetchUsersChats();
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [user]);

  // ✅ Fetch user if token exists
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setUser(null);
      setLoadingUser(false);
    }
  }, [token]);

  const value = {
    navigate,
    user,
    setUser,
    fetchUser,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    theme,
    setTheme,
    createNewChat,
    loadingUser,
    fetchUsersChats,
    token,
    setToken,
    axios,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <Toaster position="top-right" />
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
