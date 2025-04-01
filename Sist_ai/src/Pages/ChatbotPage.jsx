import { useState, useEffect, useRef } from "react";
import { FiSend, FiTrash2 } from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import supabase from "../supabaseClient";

function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);
  
  // API endpoint - configurable for local vs deployed
  const API_URL = "http://127.0.0.1:5173/api/chat";

  // Check authentication status and get user ID
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchChatHistory(user.id);
      } else {
        // For development, you can set a mock user ID
        const mockUserId = localStorage.getItem('mockUserId') || `mock_${Date.now()}`;
        localStorage.setItem('mockUserId', mockUserId);
        setUserId(mockUserId);
        fetchChatHistory(mockUserId);
      }
    };
    
    checkAuth();
  }, []);

  // Initialize session ID on component mount
  // useEffect(() => {
  //   if (!currentSessionId) {
  //     const newSessionId = `session_${Date.now()}`;
  //     setCurrentSessionId(newSessionId);
  //   }
  // }, [currentSessionId]);
  useEffect(() => {
    if (!currentSessionId) {
      startNewChat(); // Ensures a new chat session starts when needed
    }
  }, []);
  

  // Fetch chat history from Supabase
  const fetchChatHistory = async (uid) => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  // Save current chat to Supabase
  const saveChatToSupabase = async (sessionData) => {
    try {
      if (!sessionData.session_id || !userId) return;

      // Store messages first
      const title = sessionData.messages.find(msg => msg.sender === "user")?.text?.slice(0, 30) || "Chat Session";

      // Check if session already exists to update or insert
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_id', sessionData.session_id)
        .single();
      
      if (existingSession) {
        // Update existing session
        const { error } = await supabase
          .from('chat_sessions')
          .update({
            messages: sessionData.messages,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionData.session_id);
          
        if (error) throw error;
      } else {
        // Insert new session
        const { error } = await supabase
          .from('chat_sessions')
          .insert([{
            user_id: userId,
            session_id: sessionData.session_id,
            title: sessionData.title || `Chat ${new Date().toLocaleString()}`,
            messages: sessionData.messages,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving chat to Supabase:", error);
    }
  };

  // Delete a chat session
  const deleteChatSession = async (sessionId) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('session_id', sessionId);
        
      if (error) throw error;
      
      // Update local state
      setHistory(history.filter(session => session.session_id !== sessionId));
      
      // If current session was deleted, start a new chat
      if (currentSessionId === sessionId) {
        startNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat session:", error);
    }
  };

  // Scroll to the latest message smoothly
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Save messages to Supabase whenever they change
    if (messages.length > 0 && userId && currentSessionId) {
      const firstUserMessage = messages.find(msg => msg.sender === "user")?.text || "";
      const title = firstUserMessage.slice(0, 30) + (firstUserMessage.length > 30 ? "..." : "");
      
      saveChatToSupabase({
        session_id: currentSessionId,
        title: title,
        messages: messages
      });
    }
  }, [messages, userId, currentSessionId]);

  const handleSendMessage = async () => {
    if (input.trim() === "" || isLoading) return;

    const userMessage = { text: input, sender: "user", timestamp: new Date().toISOString() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const botResponse = { 
        text: data.response, 
        sender: "bot", 
        timestamp: new Date().toISOString() 
      };
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = { 
        text: "Sorry, I'm having trouble connecting to the server. Please try again later.", 
        sender: "bot",
        timestamp: new Date().toISOString()
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setInput("");
    }
  };

  const startNewChat = async () => {
    if (messages.length > 0 && userId && currentSessionId) {
      await saveChatToSupabase({
        session_id: currentSessionId,
        title: messages[0]?.text.slice(0, 30) || "Chat Session",
        messages,
      });
    }
    
    setMessages([]);
    setCurrentSessionId(`session_${Date.now()}`);
  };
  

  const loadHistory = async (session) => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('messages')
        .eq('session_id', session.session_id)
        .single();
        
      if (error) throw error;
      
      setMessages(data.messages || []);
      setCurrentSessionId(session.session_id);
    } catch (error) {
      console.error("Error loading chat session:", error);
      setMessages([]);
    }
  };
  useEffect(() => {
    const saveChatBeforeUnload = () => {
      if (messages.length > 0 && userId && currentSessionId) {
        saveChatToSupabase({
          session_id: currentSessionId,
          title: messages[0]?.text.slice(0, 30) || "Chat Session",
          messages,
        });
      }
    };
  
    window.addEventListener("beforeunload", saveChatBeforeUnload);
    return () => window.removeEventListener("beforeunload", saveChatBeforeUnload);
  }, [messages, userId, currentSessionId]);

  // Generate a short preview of the message content
  const getSessionPreview = (session) => {
    if (!session || !session.messages || session.messages.length === 0) {
      return "Empty chat";
    }
    
    const firstMessage = session.messages.find(msg => msg.sender === "user");
    if (!firstMessage) return "No messages";
    
    const preview = firstMessage.text.slice(0, 25);
    return preview + (firstMessage.text.length > 25 ? "..." : "");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for Chat History */}
      <div className="w-80 bg-indigo-900 text-white p-5 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4 text-center">🎓 Sathyabama AI Assistant</h2>
        
        {/* New Chat Button */}
        <button
          onClick={startNewChat}
          className="bg-indigo-600 px-4 py-3 rounded-lg text-white hover:bg-indigo-700 mb-4 flex items-center justify-center gap-2 transition-all duration-200 font-medium"
        >
          <span className="text-xl">+</span> New Chat
        </button>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-indigo-800">
          {history.map((session) => (
            <div key={session.session_id} className="relative group">
              
              {/* Load Chat on Click */}
              <button
                onClick={() => loadHistory(session)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  currentSessionId === session.session_id 
                    ? "bg-indigo-600 shadow-md" 
                    : "bg-indigo-800 hover:bg-indigo-700"
                }`}
              >
                <div className="font-medium truncate">{session.title || "Chat"}</div>
                <div className="text-xs text-indigo-200 mt-1">
                  {new Date(session.created_at).toLocaleString()}
                </div>
              </button>

              {/* Trash Icon to Delete Chat */}
              <button 
                onClick={() => deleteChatSession(session.session_id)}
                className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity duration-200"
                title="Delete chat"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>


      {/* Chat Window */}
      <div className="flex flex-col flex-1 h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {currentSessionId ? "Conversation" : "New Chat"}
          </h2>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4">
              <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-4xl">🎓</span>
              </div>
              <div>
                <p className="text-xl font-semibold mb-2">Welcome to Sathyabama University AI Assistant!</p>
                <p className="max-w-md mx-auto">
                  Ask me anything about admissions, academic programs, campus facilities, or student life.
                </p>
              </div>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-[fadeIn_0.3s_ease-out]`}>
              <div
                className={`p-4 rounded-xl shadow-sm ${
                  msg.sender === "user" 
                    ? "bg-indigo-600 text-white max-w-md" 
                    : "bg-white text-gray-800 border border-gray-100 max-w-2xl"
                }`}
              >
                {msg.sender === "user" ? (
                  <div>{msg.text}</div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={atomDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                              className="rounded-md"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={`${className} bg-gray-100 px-1 py-0.5 rounded text-sm`} {...props}>
                              {children}
                            </code>
                          )
                        },
                        ul({node, ...props}) {
                          return <ul className="list-disc pl-5 space-y-1" {...props} />
                        },
                        ol({node, ...props}) {
                          return <ol className="list-decimal pl-5 space-y-1" {...props} />
                        },
                        li({node, ...props}) {
                          return <li className="mb-1" {...props} />
                        },
                        p({node, ...props}) {
                          return <p className="mb-3 last:mb-0" {...props} />
                        },
                        h1({node, ...props}) {
                          return <h1 className="text-xl font-bold mt-4 mb-2" {...props} />
                        },
                        h2({node, ...props}) {
                          return <h2 className="text-lg font-bold mt-3 mb-2" {...props} />
                        },
                        h3({node, ...props}) {
                          return <h3 className="text-md font-bold mt-2 mb-1" {...props} />
                        },
                        a({node, ...props}) {
                          return <a className="text-indigo-600 underline" {...props} />
                        },
                        blockquote({node, ...props}) {
                          return <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600 my-2" {...props} />
                        },
                        table({node, ...props}) {
                          return <table className="min-w-full border border-gray-200 my-2" {...props} />
                        },
                        thead({node, ...props}) {
                          return <thead className="bg-gray-50" {...props} />
                        },
                        tbody({node, ...props}) {
                          return <tbody className="divide-y divide-gray-200" {...props} />
                        },
                        tr({node, ...props}) {
                          return <tr className="divide-x divide-gray-200" {...props} />
                        },
                        th({node, ...props}) {
                          return <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
                        },
                        td({node, ...props}) {
                          return <td className="px-3 py-2 text-sm text-gray-500" {...props} />
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
                <div className={`text-xs mt-2 ${msg.sender === "user" ? "text-indigo-200" : "text-gray-400"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-4 rounded-xl bg-white text-gray-800 border border-gray-100">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-150"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <textarea
              rows="2"
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              className={`ml-3 p-3 rounded-lg flex items-center justify-center transition-colors ${
                isLoading || input.trim() === "" 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
              disabled={isLoading || input.trim() === ""}
            >
              <FiSend size={20} />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Press Shift+Enter for a new line. Enter to send.
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;