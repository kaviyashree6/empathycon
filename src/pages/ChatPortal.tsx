import { useState, useEffect, useCallback } from "react";
import { Send, Heart, Menu, ArrowLeft, LogIn, LogOut, User, Mic, MicOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat, Message } from "@/hooks/useChat";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageCode } from "@/lib/voice-api";
import { BrowserVoiceAgent } from "@/components/chat/BrowserVoiceAgent";
import { LanguageSelector } from "@/components/chat/LanguageSelector";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { MessageBubble, TypingIndicator } from "@/components/chat/MessageBubble";
import { CrisisResourcePanel } from "@/components/crisis/CrisisResourcePanel";
import { LiveEmotionMeter } from "@/components/voice/LiveEmotionMeter";
import { CopingStrategyCard } from "@/components/coping/CopingStrategyCard";
import { RiskScoreIndicator } from "@/components/crisis/RiskScoreIndicator";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const RECOGNITION_LANG_MAP: Record<string, string> = {
  en: "en-US", "en-gb": "en-GB", "en-au": "en-AU",
  es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-BR",
  it: "it-IT", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN",
  hi: "hi-IN", ar: "ar-SA", ru: "ru-RU", nl: "nl-NL", pl: "pl-PL",
  ta: "ta-IN",
};

const ChatPortal = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceCallOpen, setVoiceCallOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [showCrisisPanel, setShowCrisisPanel] = useState(false);
  const [crisisRiskLevel, setCrisisRiskLevel] = useState<"high" | "medium">("medium");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const { messages, isTyping, lastEmotion, sendMessage, setMessages, setLanguage: setChatLanguage } = useChat();
  const {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    isLoading: isLoadingHistory,
    createSession,
    loadMessages,
    saveMessage,
    deleteSession,
  } = useChatHistory();

  // Sync language to chat hook
  useEffect(() => {
    setChatLanguage(language);
  }, [language, setChatLanguage]);

  // Show crisis panel when high/medium risk detected
  useEffect(() => {
    if (lastEmotion?.risk_level === "high") {
      setCrisisRiskLevel("high");
      setShowCrisisPanel(true);
    } else if (lastEmotion?.risk_level === "medium" && lastEmotion.intensity >= 7) {
      setCrisisRiskLevel("medium");
      setShowCrisisPanel(true);
    }
  }, [lastEmotion]);

  // Create session on first load
  useEffect(() => {
    if (!currentSessionId) {
      createSession(language);
    }
  }, [currentSessionId, createSession, language]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId && user) {
      loadMessages(currentSessionId).then((loadedMessages) => {
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
        }
      });
    }
  }, [currentSessionId, user, loadMessages, setMessages]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = overrideText || input.trim();
    if (!text || isTyping) return;

    if (!overrideText) setInput("");

    if (currentSessionId) {
      saveMessage(currentSessionId, { role: "user", content: text });
    }

    await sendMessage(text);
  }, [input, isTyping, currentSessionId, saveMessage, sendMessage]);

  // Voice input using SpeechRecognition directly
  const handleVoiceInput = useCallback(async () => {
    if (isRecording) return; // already recording

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("Your browser doesn't support voice input. Please use Chrome or Edge.");
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone access denied. Please allow microphone access.");
      return;
    }

    setIsRecording(true);

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = RECOGNITION_LANG_MAP[language] || "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setIsProcessingVoice(true);
        setIsRecording(false);
        // Send directly to chat
        handleSend(transcript);
        setIsProcessingVoice(false);
      } else {
        setIsRecording(false);
        toast.info("No speech detected. Please try again.");
      }
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      if (event.error === "no-speech") {
        toast.info("No speech detected. Please try again.");
      } else if (event.error === "not-allowed") {
        toast.error("Microphone access denied.");
      } else {
        console.warn("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  }, [isRecording, language, handleSend]);

  const handleNewSession = useCallback(async () => {
    const newSessionId = await createSession(language);
    if (newSessionId) {
      setShowCrisisPanel(false);
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! I'm here to listen and support you. How are you feeling today?",
          emotion: { emotion: "neutral", intensity: 5, risk_level: "low", primary_feeling: "welcoming" },
          timestamp: new Date(),
        },
      ]);
    }
  }, [createSession, language, setMessages]);

  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      setCurrentSessionId(sessionId);
      setShowCrisisPanel(false);
      const loadedMessages = await loadMessages(sessionId);
      if (loadedMessages.length > 0) {
        setMessages(loadedMessages);
      }
    },
    [setCurrentSessionId, loadMessages, setMessages]
  );

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
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
      <aside
        className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-80 bg-card border-r border-border
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <ChatSidebar 
          lastEmotion={lastEmotion}
          messages={messages}
          onClose={() => setSidebarOpen(false)} 
          onStartVoiceCall={() => setVoiceCallOpen(true)}
        />
      </aside>

      {/* Voice Call Modal */}
      {voiceCallOpen && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <BrowserVoiceAgent 
            language={language}
            onClose={() => setVoiceCallOpen(false)} 
          />
        </div>
      )}

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

          {/* Center controls */}
          <div className="flex items-center gap-2">
            <LiveEmotionMeter emotion={lastEmotion} isRecording={isRecording} className="hidden md:flex" />
            <LanguageSelector value={language} onChange={setLanguage} />
            {user && (
              <ChatHistory
                sessions={sessions}
                currentSessionId={currentSessionId}
                isLoading={isLoadingHistory}
                onSelectSession={handleSelectSession}
                onNewSession={handleNewSession}
                onDeleteSession={deleteSession}
              />
            )}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <RiskScoreIndicator emotion={lastEmotion} className="hidden sm:flex" />

            <Button variant="sos" size="sm" className="gap-2 hidden sm:flex" onClick={() => {
              setCrisisRiskLevel("high");
              setShowCrisisPanel(true);
            }}>
              <Heart className="w-4 h-4" />
              SOS
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user ? (
                  <>
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => navigate("/auth")}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showCrisisPanel && (
            <CrisisResourcePanel
              riskLevel={crisisRiskLevel}
              onDismiss={() => setShowCrisisPanel(false)}
            />
          )}

          <LiveEmotionMeter emotion={lastEmotion} isRecording={isRecording} className="md:hidden" />

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              emotion={message.emotion}
              language={language}
            />
          ))}

          {isTyping && <TypingIndicator />}

          {!isTyping && lastEmotion && (lastEmotion.emotion === "negative" || lastEmotion.risk_level !== "low") && (
            <CopingStrategyCard emotion={lastEmotion} />
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            {/* Voice input button */}
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={handleVoiceInput}
              disabled={isTyping || isProcessingVoice}
              className={cn(
                "relative transition-all",
                isRecording && "animate-pulse ring-2 ring-destructive ring-offset-2"
              )}
              title={isRecording ? "Listening..." : "Voice input"}
            >
              {isProcessingVoice ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {isRecording && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
              )}
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={isRecording ? "Listening..." : "Share what's on your mind..."}
              className="flex-1"
              disabled={isTyping || isRecording}
            />

            <Button variant="hero" size="icon" onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {user
              ? "Your messages are saved and encrypted • Powered by Lovable AI"
              : "Sign in to save your chat history • Powered by Lovable AI"}
          </p>
        </div>
      </main>
    </div>
  );
};

export default ChatPortal;
