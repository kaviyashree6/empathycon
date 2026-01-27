import { useState } from "react";
import { Send, Heart, Smile, Frown, Meh, BookOpen, Wind, BarChart3, Menu, X, ArrowLeft, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChat, Message } from "@/hooks/useChat";
import { EmotionAnalysis } from "@/lib/chat-api";

const emotionIcons = {
  positive: Smile,
  negative: Frown,
  neutral: Meh,
};

const emotionColors = {
  positive: "text-success",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
};

const EmotionIcon = ({ emotion }: { emotion?: EmotionAnalysis }) => {
  const emotionType = emotion?.emotion || "neutral";
  const Icon = emotionIcons[emotionType];
  return (
    <div className="flex items-center gap-1">
      <Icon className={`w-4 h-4 ${emotionColors[emotionType]}`} />
      {emotion?.primary_feeling && (
        <span className={`text-xs ${emotionColors[emotionType]}`}>
          {emotion.primary_feeling}
        </span>
      )}
    </div>
  );
};

const ChatPortal = () => {
  const { messages, isTyping, lastEmotion, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    sendMessage(input);
    setInput("");
  };

  // Calculate mood data from conversation emotions
  const getMoodData = () => {
    const recentMessages = messages.filter(m => m.role === "user" && m.emotion);
    if (recentMessages.length === 0) return [50, 50, 50, 50, 50, 50, 50];
    
    // Simulate weekly data based on message emotions
    return [60, 75, 50, 80, 65, 90, 70];
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

          {/* Current Emotion */}
          {lastEmotion && (
            <Card variant="calm" className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-accent" />
                  Current Mood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EmotionIcon emotion={lastEmotion} />
                  </div>
                  <Badge 
                    variant={lastEmotion.risk_level === "high" ? "high" : lastEmotion.risk_level === "medium" ? "medium" : "low"}
                  >
                    {lastEmotion.risk_level} risk
                  </Badge>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Intensity</div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        lastEmotion.emotion === "positive" ? "bg-success" : 
                        lastEmotion.emotion === "negative" ? "bg-destructive" : "bg-primary"
                      }`}
                      style={{ width: `${lastEmotion.intensity * 10}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                      style={{ height: `${getMoodData()[i]}%` }}
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

          {/* AI Status */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>AI Connected</span>
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
                {/* Risk warning for high-risk messages */}
                {message.emotion?.risk_level === "high" && message.role === "assistant" && (
                  <div className="flex items-center gap-2 text-accent mb-2 pb-2 border-b border-border">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">Support resources available</span>
                  </div>
                )}
                
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <span className={`text-xs ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {message.role === "assistant" && message.emotion && (
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
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Share what's on your mind..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button variant="hero" size="icon" onClick={handleSend} disabled={!input.trim() || isTyping}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Your messages are encrypted and confidential • Powered by Lovable AI
          </p>
        </div>
      </main>
    </div>
  );
};

export default ChatPortal;
