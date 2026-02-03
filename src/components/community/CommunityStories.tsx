import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCommunity } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, MessageCircle, PenLine, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MOOD_TAGS = [
  { value: "anxiety", label: "Anxiety", color: "bg-warning/20 text-warning" },
  { value: "depression", label: "Depression", color: "bg-secondary text-secondary-foreground" },
  { value: "hope", label: "Hope", color: "bg-success/20 text-success" },
  { value: "grief", label: "Grief", color: "bg-muted text-muted-foreground" },
  { value: "recovery", label: "Recovery", color: "bg-primary/20 text-primary" },
  { value: "support", label: "Support", color: "bg-accent/20 text-accent" },
];

export function CommunityStories() {
  const { user } = useAuth();
  const { stories, isLoading, shareStory, toggleHeart } = useCommunity();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [moodTag, setMoodTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    const result = await shareStory({
      title: title.trim(),
      content: content.trim(),
      mood_tag: moodTag || undefined,
    });

    if (result) {
      setTitle("");
      setContent("");
      setMoodTag("");
      setIsOpen(false);
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="gradient-card shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Community Stories
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <PenLine className="w-4 h-4" />
              Share Your Story
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Share Your Story Anonymously</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your story a title..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Your Story</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your experience, feelings, or journey..."
                  className="mt-1 min-h-[120px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Topic (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOOD_TAGS.map((tag) => (
                    <button
                      key={tag.value}
                      onClick={() =>
                        setMoodTag(moodTag === tag.value ? "" : tag.value)
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        moodTag === tag.value
                          ? "ring-2 ring-primary"
                          : "opacity-70 hover:opacity-100",
                        tag.color
                      )}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !content.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Sharing..." : "Share Anonymously 💜"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Your identity will remain anonymous. A random name will be assigned.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground">No stories yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to share your journey
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {stories.map((story) => {
              const moodTagData = MOOD_TAGS.find((t) => t.value === story.mood_tag);
              return (
                <div
                  key={story.id}
                  className="p-4 bg-muted/30 rounded-xl border border-border/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {story.anonymous_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(story.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        {moodTagData && (
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", moodTagData.color)}
                          >
                            {moodTagData.label}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-foreground">{story.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                        {story.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                    <button
                      onClick={() => toggleHeart(story.id)}
                      disabled={!user}
                      className={cn(
                        "flex items-center gap-1.5 text-sm transition-colors",
                        story.has_hearted
                          ? "text-accent"
                          : "text-muted-foreground hover:text-accent"
                      )}
                    >
                      <Heart
                        className={cn(
                          "w-4 h-4",
                          story.has_hearted && "fill-current"
                        )}
                      />
                      {story.hearts_count}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {story.is_mine && "Your story"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
