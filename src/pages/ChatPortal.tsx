import { useState } from "react";
import { Send, Heart, Smile, Frown, Meh, BookOpen, Wind, BarChart3, Menu, X, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  emotion?: "positive" | "negative" | "neutral";
  timestamp: Date;
};

const emotionIcons = {
  positive: Smile,
  negative: Frown,
  neutral: Meh,
};

const mockMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm here to listen and support you. How are you feeling today?",
    emotion: "neutral",
    timestamp: new Date(),
  },
];

const ChatPortal = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      emotion: "neutral",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I hear you, and I want you to know that your feelings are valid. It takes courage to share. Would you like to tell me more about what's on your mind?",
        emotion: "positive",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const EmotionIcon = ({ emotion }: { emotion?: "positive" | "negative" | "neutral" }) => {
    const Icon = emotion ? emotionIcons[emotion] : Meh;
    const colors = {
      positive: "text-success",
      negative: "text-destructive",
      neutral: "text-muted-foreground",
    };
    return <Icon className={`w-4 h-4 ${emotion ? colors[emotion] : colors.neutral}`} />;
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-80 bg-card border-r border-border
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-full flex flex-col p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">EmpathyConnect</span>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Mood Graph Card */}
          <Card variant="calm" className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Weekly Mood
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-20 gap-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full rounded-t bg-primary/30 hover:bg-primary/50 transition-colors"
                      style={{ height: `${[60, 75, 50, 80, 65, 90, 70][i]}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2 mb-4">
            <Button variant="calm" className="w-full justify-start gap-3">
              <BookOpen className="w-4 h-4" />
              My Journal
            </Button>
            <Button variant="calm" className="w-full justify-start gap-3">
              <Wind className="w-4 h-4" />
              Breathing Exercise
            </Button>
          </div>

          {/* Resources */}
          <Card variant="default" className="mt-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                Grounding Techniques
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                Sleep Tips
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                Anxiety Relief
              </Badge>
            </CardContent>
          </Card>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Back to Home</span>
            </Link>
          </div>

          {/* SOS Button */}
          <Button variant="sos" size="sm" className="gap-2">
            <Heart className="w-4 h-4" />
            SOS - Need Help Now
          </Button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div className={`
                max-w-[80%] md:max-w-[60%] rounded-2xl p-4
                ${message.role === "user" 
                  ? "gradient-primary text-primary-foreground rounded-br-md" 
                  : "bg-card shadow-soft border border-border rounded-bl-md"
                }
              `}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <span className={`text-xs ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {message.role === "assistant" && (
                    <EmotionIcon emotion={message.emotion} />
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-card shadow-soft border border-border rounded-2xl rounded-bl-md p-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Share what's on your mind..."
              className="flex-1"
            />
            <Button variant="hero" size="icon" onClick={handleSend} disabled={!input.trim()}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Your messages are encrypted and confidential
          </p>
        </div>
      </main>
    </div>
  );
};

export default ChatPortal;
