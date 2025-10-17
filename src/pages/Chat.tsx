import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, LogOut, FileText, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; url: string }>;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const username = localStorage.getItem('username') || 'Guest';
  const userRole = localStorage.getItem('userRole') || 'guest';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!username) {
      navigate('/');
    }
    if (userRole !== 'guest' && userId) {
      loadChatHistory();
    }
  }, [username, userRole, userId, navigate]);

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
      const response = await fetch('https://n8n.srv974700.hstgr.cloud/webhook-test/bf4dd093-bb02-472c-9454-7ab9af97bd1d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          username 
        })
      });

      const data = await response.json();
      
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
    <div className="flex h-screen bg-background">
      {userRole !== 'guest' && (
        <div className="w-64 bg-card border-r border-border p-4 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-primary">CENTEF</h2>
            <p className="text-sm text-muted-foreground">{username}</p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Chat History</h3>
              {chatHistory.map((chat) => (
                <Card key={chat.id} className="p-3 hover:bg-accent cursor-pointer">
                  <p className="text-sm truncate">{chat.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(chat.created_at).toLocaleDateString()}
                  </p>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/submit')}>
              <FileText className="w-4 h-4 mr-2" />
              Submit Source
            </Button>
            {userRole === 'admin' && (
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/review')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Review Submissions
              </Button>
            )}
            <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="border-b border-border p-4 flex justify-between items-center bg-card">
          <h1 className="text-xl font-bold">CENTEF Research Assistant</h1>
          {userRole === 'guest' && (
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          )}
        </div>

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
                <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold mb-2">Sources:</p>
                    {msg.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline block"
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                )}
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
