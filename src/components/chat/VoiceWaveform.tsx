import { cn } from "@/lib/utils";

type VoiceWaveformProps = {
  isActive: boolean;
  variant?: "listening" | "speaking" | "thinking";
  className?: string;
};

const BAR_COUNT = 5;

export function VoiceWaveform({ isActive, variant = "listening", className }: VoiceWaveformProps) {
  const colorClass =
    variant === "listening"
      ? "bg-primary"
      : variant === "speaking"
      ? "bg-accent"
      : "bg-warning";

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-[3px] h-10",
        className
      )}
      aria-hidden
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-[4px] rounded-full transition-all duration-150",
            colorClass,
            isActive ? "animate-waveform" : "h-1 opacity-40"
          )}
          style={
            isActive
              ? { animationDelay: `${i * 120}ms` }
              : undefined
          }
        />
      ))}
    </div>
  );
}
