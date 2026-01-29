import { useState } from "react";
import { ArrowLeft, Plus, Smile, Frown, Meh, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useJournal, Mood } from "@/hooks/useJournal";
import { JournalEntryCard } from "./JournalEntryCard";
import { JournalEditor } from "./JournalEditor";

const moodEmoji: Record<Mood, string> = {
  great: "😄",
  good: "🙂",
  okay: "😐",
  bad: "😔",
  terrible: "😢",
};

export function JournalPage() {
  const { user } = useAuth();
  const { entries, isLoading, createEntry, deleteEntry, getMoodStats } = useJournal();
  const [isEditing, setIsEditing] = useState(false);

  const stats = getMoodStats();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-2">Sign in to access your journal</h2>
            <p className="text-muted-foreground mb-4">
              Keep track of your daily emotions and thoughts
            </p>
            <Link to="/auth">
              <Button variant="hero">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/chat" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat</span>
          </Link>
          <h1 className="text-xl font-display font-bold">My Journal</h1>
          <Button
            variant="hero"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Card */}
        {stats && (
          <Card variant="calm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Weekly Mood Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {stats.averageScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl">{moodEmoji[stats.dominantMood]}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {stats.dominantMood}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-accent">
                    {stats.totalEntries}
                  </p>
                  <p className="text-xs text-muted-foreground">Entries</p>
                </div>
              </div>

              {/* Mini chart */}
              <div className="flex items-end justify-between h-16 mt-4 gap-1">
                {stats.dailyScores.reverse().map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary/50 transition-all"
                      style={{ height: `${day.score * 12}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{day.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Editor Modal */}
        {isEditing && (
          <JournalEditor
            onSave={async (entry) => {
              await createEntry(entry);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        )}

        {/* Entries List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold mb-2">No journal entries yet</h3>
              <p className="text-muted-foreground mb-4">
                Start documenting your thoughts and feelings
              </p>
              <Button variant="hero" onClick={() => setIsEditing(true)}>
                Write your first entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
