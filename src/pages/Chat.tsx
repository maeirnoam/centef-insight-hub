import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import ChatMarkdownLite from "@/components/ui/ChatMarkdownLite";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; url: string }>;
}

/* -------------------- */
type HistoryItem = {
  id: string;
  created_at: string;
  message: string;
  response: string;
  sources?: Array<{ title: string; url: string }>;
};

const USE_MOCK_HISTORY = true;

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "h1",
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    message: "Summarize Hezbollah’s revenue sources in 2024.",
    response:
      "Main sources include state support, donations, commercial activity, and trade-based schemes. See CFT Report 2025 p. 109.",
    sources: [
      {
        title: "CFT Report 2025 – p.109",
        url: "https://drive.google.com/file/d/1eRq4TFEoGo2gCV-pRU3jOVNVLnU1odjo/view#page=109",
      },
    ],
  },
  {
    id: "h2",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    message: "Quote the line about funding from Nasrallah’s speech.",
    response: "“Any resistance needs money.” See the clip at 00:01.",
    sources: [
      {
        title: "Nasrallah speech – 00:01",
        url: "https://drive.google.com/file/d/1fg0WgmDGVUD_MTASZxTdSQeWWgHt7MtD/view?t=1",
      },
    ],
  },
  {
    id: "h3",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    message: "Show a cashflow summary table for 2020–2025.",
    response: `| Year | Cash Balance End | Income Total | Expense Total | Net Income |
|------|------------------|--------------|---------------|------------|
| 2020 | $6,920,000       | $4,800,000   | $2,880,000    | $1,920,000 |
| 2021 | $9,110,000       | $5,240,000   | $3,050,000    | $2,190,000 |
| 2022 | $11,625,000      | $5,790,000   | $3,275,000    | $2,515,000 |
| 2023 | $14,375,000      | $6,240,000   | $3,490,000    | $2,750,000 |
| 2024 | $17,430,000      | $6,680,000   | $3,625,000    | $3,055,000 |
| 2025 | $20,760,000      | $7,120,000   | $3,790,000    | $3,330,000 |`,
  },
];

/* ---------- Utils ---------- */
function fmt(ts?: string) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function preview(s: string, n = 60) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/* ========================================================= */

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const username = localStorage.getItem("username") || "Guest";
  const userRole = localStorage.getItem("userRole") || "guest";
  const userId = localStorage.getItem("userId");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!username) {
      navigate("/");
    }
    if (userRole !== "guest" && userId) {
      loadChatHistory();
      checkAdminRole();
    }
  }, [username, userRole, userId, navigate]);

  const checkAdminRole = async () => {
    if (!userId) return;
    const { data: roleData, error } = await supabase.from("users").select("role").eq("id", userId).maybeSingle();
    if (!error && roleData?.role === "admin") {
      setIsAdmin(true);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("chat_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setChatHistory(data);
    }
  };

  // Fallback to mock history for members/admins when no DB results
  useEffect(() => {
    if (userRole !== "guest" && USE_MOCK_HISTORY && chatHistory.length === 0) {
      setChatHistory(MOCK_HISTORY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, chatHistory.length]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await api.sendChatMessage(input, username);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.message || "No response received",
        sources: data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (userRole !== "guest" && userId) {
        await supabase.from("chat_history").insert({
          user_id: userId,
          message: input,
          response: assistantMessage.content,
          sources: assistantMessage.sources,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const suggestedQuestions = [
    "What are the latest trends in terror financing?",
    "Tell me about cryptocurrency and terrorism",
    "How do organizations track terror funding?",
    "How do terror organizations finance their operations?",
  ];

  // Load a past exchange into the chat area
  function loadHistoryItem(item: HistoryItem) {
    const idBase = Date.now().toString();
    setMessages([
      { id: idBase, role: "user", content: item.message },
      {
        id: (Number(idBase) + 1).toString(),
        role: "assistant",
        content: item.response,
        sources: item.sources || [],
      },
    ]);
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-3">
          <h1 className="text-xl font-bold text-primary">CENTEF Research Assistant</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{username}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        <Tabs value={location.pathname} className="px-6">
          <TabsList>
            <TabsTrigger value="/chat" onClick={() => navigate("/chat")}>
              Chat
            </TabsTrigger>
            <TabsTrigger value="/submit" onClick={() => navigate("/submit")}>
              Submit Source
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="/review" onClick={() => navigate("/review")}>
                Review Submissions
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Main layout: sidebar (members/admins) + chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR — hidden for guests */}
        {userRole !== "guest" && (
          <aside className="hidden md:flex w-80 shrink-0 border-r border-border bg-card flex-col">
            <div className="px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">Recent Chats</h2>
              <p className="text-xs text-muted-foreground">{USE_MOCK_HISTORY ? "Chat History" : "Last 10 exchanges"}</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {chatHistory.length === 0 && <p className="text-xs text-muted-foreground px-2 py-4">No history yet.</p>}
                {chatHistory.map((h: any) => (
                  <button
                    key={h.id}
                    onClick={() => loadHistoryItem(h)}
                    className="w-full text-left rounded-lg border hover:bg-accent/50 transition-colors px-3 py-2"
                    title={h.message}
                  >
                    <div className="text-[11px] text-muted-foreground mb-1">{fmt(h.created_at)}</div>
                    <div className="text-xs font-medium">{preview(h.message || "", 72)}</div>
                    {h.response && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {preview((h.response || "").replace(/\n+/g, " "), 84)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* CHAT COLUMN */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 && (
              <div className="text-center space-y-6 max-w-2xl mx-auto mt-12">
                <h2 className="text-3xl font-bold text-primary">Welcome to CENTEF's AI Assistant</h2>
                <p className="text-muted-foreground">Ask questions about terror financing research</p>
                <div className="grid gap-3 mt-6">
                  {suggestedQuestions.map((question, i) => (
                    <Card
                      key={i}
                      className="p-4 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setInput(question)}
                    >
                      <p className="text-sm">{question}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`mb-6 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`p-4 max-w-2xl ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}
                >
                  <div className="markdown-content">
                    <ChatMarkdownLite content={msg.content} className="prose max-w-none" />
                  </div>
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border p-4 bg-card">
            <div className="flex gap-2 max-w-4xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask anything about terror financing research..."
                disabled={isLoading}
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;
