import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mood, NewJournalEntry } from "@/hooks/useJournal";
import { cn } from "@/lib/utils";

type MoodOption = {
  value: Mood;
  emoji: string;
  label: string;
  color: string;
};

const moodOptions: MoodOption[] = [
  { value: "great", emoji: "😄", label: "Great", color: "bg-success/20 border-success text-success" },
  { value: "good", emoji: "🙂", label: "Good", color: "bg-primary/20 border-primary text-primary" },
  { value: "okay", emoji: "😐", label: "Okay", color: "bg-warning/20 border-warning text-warning" },
  { value: "bad", emoji: "😔", label: "Bad", color: "bg-orange-500/20 border-orange-500 text-orange-500" },
  { value: "terrible", emoji: "😢", label: "Terrible", color: "bg-destructive/20 border-destructive text-destructive" },
];

const journalPrompts = [
  "What made you smile today?",
  "What's on your mind right now?",
  "What are you grateful for?",
  "How did you handle stress today?",
  "What's something you learned recently?",
  "What would make tomorrow better?",
];

type JournalEditorProps = {
  onSave: (entry: NewJournalEntry) => Promise<void>;
  onCancel: () => void;
  initialEntry?: NewJournalEntry;
};

export function JournalEditor({ onSave, onCancel, initialEntry }: JournalEditorProps) {
  const [title, setTitle] = useState(initialEntry?.title || "");
  const [content, setContent] = useState(initialEntry?.content || "");
  const [mood, setMood] = useState<Mood>(initialEntry?.mood || "okay");
  const [tags, setTags] = useState<string>(initialEntry?.tags?.join(", ") || "");
  const [isSaving, setIsSaving] = useState(false);

  const randomPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    await onSave({
      title: title.trim() || undefined,
      content: content.trim(),
      mood,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>New Journal Entry</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Selector */}
          <div>
            <label className="text-sm font-medium mb-3 block">How are you feeling?</label>
            <div className="flex gap-2 flex-wrap">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMood(option.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all",
                    mood === option.value
                      ? option.color
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Title (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              What's on your mind?
            </label>
            <p className="text-xs text-muted-foreground mb-2 italic">
              Prompt: {randomPrompt}
            </p>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here..."
              className="min-h-[150px] resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tags (optional)</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="anxiety, work, family (comma separated)"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleSave}
              disabled={!content.trim() || isSaving}
            >
              {isSaving ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
