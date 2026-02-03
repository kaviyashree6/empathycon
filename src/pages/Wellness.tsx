import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyCheckIn } from "@/components/gamification/DailyCheckIn";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";
import { AchievementGrid } from "@/components/gamification/AchievementGrid";
import { CommunityStories } from "@/components/community/CommunityStories";
import { SoundscapePlayer } from "@/components/multimedia/SoundscapePlayer";
import { MoodCanvas } from "@/components/multimedia/MoodCanvas";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, 
  Sparkles, 
  Users, 
  Music, 
  Palette,
  LayoutDashboard 
} from "lucide-react";

export default function Wellness() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/chat">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-display font-bold text-foreground">
              Wellness Hub
            </h1>
          </div>
          {!user && (
            <Button size="sm" asChild>
              <Link to="/auth">Sign in to track progress</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="soundscapes" className="gap-2">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Sounds</span>
            </TabsTrigger>
            <TabsTrigger value="art" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Art</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats */}
            <StreakDisplay />

            {/* Check-in and Achievements */}
            <div className="grid lg:grid-cols-2 gap-6">
              <DailyCheckIn />
              <div className="space-y-6">
                <AchievementGrid />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Community Support
                </h2>
                <p className="text-muted-foreground mt-2">
                  Share your journey anonymously and find strength in others' stories
                </p>
              </div>
              <CommunityStories />
            </div>
          </TabsContent>

          <TabsContent value="soundscapes" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-2">
                  <Music className="w-6 h-6 text-primary" />
                  Relaxation Soundscapes
                </h2>
                <p className="text-muted-foreground mt-2">
                  Immerse yourself in calming nature sounds
                </p>
              </div>
              <SoundscapePlayer />
            </div>
          </TabsContent>

          <TabsContent value="art" className="space-y-6">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-2">
                  <Palette className="w-6 h-6 text-primary" />
                  Art Therapy
                </h2>
                <p className="text-muted-foreground mt-2">
                  Express your emotions through creative art
                </p>
              </div>
              <MoodCanvas />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
