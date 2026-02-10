import { useState } from "react";
import { Phone, ExternalLink, Shield, X, AlertTriangle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CRISIS_RESOURCES = [
  { name: "National Suicide Prevention Lifeline", number: "988", description: "24/7 crisis support", country: "US" },
  { name: "Crisis Text Line", number: "Text HOME to 741741", description: "Free 24/7 text support", country: "US" },
  { name: "SAMHSA Helpline", number: "1-800-662-4357", description: "Substance abuse & mental health", country: "US" },
  { name: "International Crisis Lines", number: "findahelpline.com", description: "Worldwide crisis support", country: "Global" },
];

const GROUNDING_STEPS = [
  "5 things you can SEE",
  "4 things you can TOUCH",
  "3 things you can HEAR",
  "2 things you can SMELL",
  "1 thing you can TASTE",
];

type CrisisResourcePanelProps = {
  riskLevel: "high" | "medium";
  onDismiss: () => void;
};

export function CrisisResourcePanel({ riskLevel, onDismiss }: CrisisResourcePanelProps) {
  const [showGrounding, setShowGrounding] = useState(false);
  const isHigh = riskLevel === "high";

  return (
    <div className={cn(
      "animate-fade-in border-l-4 rounded-xl p-4 mb-4",
      isHigh
        ? "bg-destructive/5 border-destructive"
        : "bg-warning/5 border-warning"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className={cn("w-5 h-5", isHigh ? "text-destructive" : "text-warning")} />
          <h3 className="font-display font-bold text-sm">
            {isHigh ? "You're not alone — help is available" : "Support resources for you"}
          </h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {isHigh && (
        <p className="text-sm text-muted-foreground mb-3">
          It sounds like you may be going through a really difficult time. Please consider reaching out to one of these resources. ❤️
        </p>
      )}

      <div className="grid gap-2 mb-3">
        {CRISIS_RESOURCES.slice(0, isHigh ? 4 : 2).map((resource) => (
          <div key={resource.name} className="flex items-center justify-between bg-card rounded-lg p-2.5 border border-border">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{resource.name}</p>
              <p className="text-xs text-muted-foreground">{resource.description}</p>
            </div>
            <Badge variant="outline" className="ml-2 shrink-0 text-xs">
              <Phone className="w-3 h-3 mr-1" />
              {resource.number}
            </Badge>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1"
          onClick={() => setShowGrounding(!showGrounding)}
        >
          <Heart className="w-3 h-3" />
          {showGrounding ? "Hide" : "5-4-3-2-1"} Grounding
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1"
          asChild
        >
          <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3" />
            Find Help Near You
          </a>
        </Button>
      </div>

      {showGrounding && (
        <div className="mt-3 p-3 bg-card rounded-lg border border-border animate-fade-in">
          <p className="text-xs font-medium mb-2">5-4-3-2-1 Grounding Exercise:</p>
          {GROUNDING_STEPS.map((step, i) => (
            <p key={i} className="text-xs text-muted-foreground ml-2">
              {step}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
