import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; url: string }>;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const username = localStorage.getItem('username') || 'Guest';
  const userRole = localStorage.getItem('userRole') || 'guest';
  const userId = localStorage.getItem('userId');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!username) {
      navigate('/');
    }
    if (userRole !== 'guest' && userId) {
      loadChatHistory();
      checkAdminRole();
    }
  }, [username, userRole, userId, navigate]);

  const checkAdminRole = async () => {
    if (!userId) return;

    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!error && roleData) {
      setIsAdmin(true);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    if (!userId) return;
    
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setChatHistory(data);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await api.sendChatMessage(input, username);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || 'No response received',
        sources: data.sources || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (userRole !== 'guest' && userId) {
        await supabase.from('chat_history').insert({
          user_id: userId,
          message: input,
          response: assistantMessage.content,
          sources: assistantMessage.sources
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const suggestedQuestions = [
    "What are the latest trends in terror financing?",
    "Tell me about cryptocurrency and terrorism",
    "How do organizations track terror funding?"
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
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
        {(
          <Tabs value={location.pathname} className="px-6">
            <TabsList>
              <TabsTrigger value="/chat" onClick={() => navigate('/chat')}>
                Chat
              </TabsTrigger>
              <TabsTrigger value="/submit" onClick={() => navigate('/submit')}>
                Submit Source
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="/review" onClick={() => navigate('/review')}>
                  Review Submissions
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">

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
            <div key={msg.id} className={`mb-6 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card className={`p-4 max-w-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                <div className="markdown-content">
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="markdown-link"
                        />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
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

        <div className="border-t border-border p-4 bg-card">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask anything about terror financing research..."
              disabled={isLoading}
            />
            <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
