import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Music } from "lucide-react";
import { cn } from "@/lib/utils";

const SOUNDSCAPES = [
  {
    id: "rain",
    name: "Gentle Rain",
    emoji: "🌧️",
    color: "from-blue-500/20 to-cyan-500/20",
    url: "https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3",
  },
  {
    id: "forest",
    name: "Forest Birds",
    emoji: "🌲",
    color: "from-green-500/20 to-emerald-500/20",
    url: "https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3",
  },
  {
    id: "ocean",
    name: "Ocean Waves",
    emoji: "🌊",
    color: "from-blue-400/20 to-indigo-500/20",
    url: "https://assets.mixkit.co/sfx/preview/mixkit-sea-waves-loop-1196.mp3",
  },
  {
    id: "fire",
    name: "Crackling Fire",
    emoji: "🔥",
    color: "from-orange-500/20 to-red-500/20",
    url: "https://assets.mixkit.co/sfx/preview/mixkit-campfire-crackles-1330.mp3",
  },
  {
    id: "wind",
    name: "Soft Wind",
    emoji: "🍃",
    color: "from-teal-500/20 to-green-500/20",
    url: "https://assets.mixkit.co/sfx/preview/mixkit-blizzard-cold-winds-1153.mp3",
  },
  {
    id: "night",
    name: "Night Crickets",
    emoji: "🌙",
    color: "from-purple-500/20 to-indigo-500/20",
    url: "https://assets.mixkit.co/sfx/preview/mixkit-crickets-and-insects-in-the-wild-ambience-39.mp3",
  },
];

export function SoundscapePlayer() {
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playSound = (soundId: string) => {
    const sound = SOUNDSCAPES.find((s) => s.id === soundId);
    if (!sound) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (currentSound === soundId && isPlaying) {
      setIsPlaying(false);
      return;
    }

    audioRef.current = new Audio(sound.url);
    audioRef.current.loop = true;
    audioRef.current.volume = isMuted ? 0 : volume / 100;
    audioRef.current.play();
    setCurrentSound(soundId);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume / 100 : 0;
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className="gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Nature Soundscapes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Soundscape Grid */}
        <div className="grid grid-cols-3 gap-3">
          {SOUNDSCAPES.map((sound) => (
            <button
              key={sound.id}
              onClick={() => playSound(sound.id)}
              className={cn(
                "relative p-4 rounded-xl transition-all duration-300 flex flex-col items-center gap-2",
                "bg-gradient-to-br border border-border/50",
                currentSound === sound.id && isPlaying
                  ? `${sound.color} ring-2 ring-primary shadow-lg`
                  : "hover:bg-muted"
              )}
            >
              <span className="text-3xl">{sound.emoji}</span>
              <span className="text-xs font-medium text-foreground">
                {sound.name}
              </span>
              {currentSound === sound.id && isPlaying && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Controls */}
        {currentSound && (
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              className="shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="shrink-0"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>

            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="flex-1"
            />

            <span className="text-sm text-muted-foreground w-10 text-right">
              {volume}%
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Listen to calming sounds to help you relax and focus
        </p>
      </CardContent>
    </Card>
  );
}
