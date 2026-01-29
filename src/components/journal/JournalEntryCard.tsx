import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JournalEntry, Mood } from "@/hooks/useJournal";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const moodConfig: Record<Mood, { emoji: string; color: string }> = {
  great: { emoji: "😄", color: "text-success" },
  good: { emoji: "🙂", color: "text-primary" },
  okay: { emoji: "😐", color: "text-warning" },
  bad: { emoji: "😔", color: "text-orange-500" },
  terrible: { emoji: "😢", color: "text-destructive" },
};

type JournalEntryCardProps = {
  entry: JournalEntry;
  onDelete: () => void;
};

export function JournalEntryCard({ entry, onDelete }: JournalEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { emoji, color } = moodConfig[entry.mood as Mood] || moodConfig.okay;

  const formattedDate = new Date(entry.created_at).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const shouldTruncate = entry.content.length > 150;
  const displayContent =
    shouldTruncate && !isExpanded
      ? entry.content.slice(0, 150) + "..."
      : entry.content;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl" role="img" aria-label={entry.mood}>
            {emoji}
          </span>
          <div className="min-w-0">
            {entry.title && (
              <h3 className="font-semibold truncate">{entry.title}</h3>
            )}
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete journal entry?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This entry will be permanently
                deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-foreground/80 whitespace-pre-wrap">
          {displayContent}
        </p>

        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {isExpanded ? (
              <>
                Show less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Read more <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {entry.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
