import { cn } from "@/lib/utils";
import { AlertTriangle, Shield, ShieldAlert } from "lucide-react";
import { EmotionAnalysis } from "@/lib/chat-api";

type RiskScoreIndicatorProps = {
  emotion: EmotionAnalysis | null;
  trendScore?: number; // -10 to 10, negative = worsening
  className?: string;
};

export function RiskScoreIndicator({ emotion, trendScore = 0, className }: RiskScoreIndicatorProps) {
  if (!emotion) return null;

  const riskLevel = emotion.risk_level;
  const intensity = emotion.intensity;

  // Calculate overall risk score 0-100
  const baseScore = riskLevel === "high" ? 80 : riskLevel === "medium" ? 50 : 20;
  const riskScore = Math.min(100, Math.max(0, baseScore + (intensity - 5) * 3 + Math.abs(trendScore) * 2));

  const getColor = () => {
    if (riskScore >= 70) return "text-destructive";
    if (riskScore >= 40) return "text-warning";
    return "text-success";
  };

  const getBgColor = () => {
    if (riskScore >= 70) return "bg-destructive/10";
    if (riskScore >= 40) return "bg-warning/10";
    return "bg-success/10";
  };

  const getIcon = () => {
    if (riskScore >= 70) return ShieldAlert;
    if (riskScore >= 40) return AlertTriangle;
    return Shield;
  };

  const Icon = getIcon();

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", getBgColor(), className)}>
      <Icon className={cn("w-4 h-4", getColor())} />
      <div className="flex items-center gap-1.5">
        <span className={cn("text-xs font-semibold", getColor())}>{riskScore}</span>
        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", 
              riskScore >= 70 ? "bg-destructive" : riskScore >= 40 ? "bg-warning" : "bg-success"
            )}
            style={{ width: `${riskScore}%` }}
          />
        </div>
      </div>
      {trendScore !== 0 && (
        <span className={cn("text-[10px]", trendScore < 0 ? "text-destructive" : "text-success")}>
          {trendScore > 0 ? "↑ improving" : "↓ worsening"}
        </span>
      )}
    </div>
  );
}
