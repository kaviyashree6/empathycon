import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Palette, Eraser, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLORS = [
  "#3B9B8E", // Primary teal
  "#E07C5B", // Accent coral
  "#6B5B95", // Secondary purple
  "#4CAF50", // Success green
  "#FF9800", // Warning orange
  "#2196F3", // Blue
  "#E91E63", // Pink
  "#9C27B0", // Purple
  "#00BCD4", // Cyan
  "#795548", // Brown
  "#607D8B", // Gray
  "#000000", // Black
];

export function MoodCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const point = getPoint(e);
    lastPointRef.current = point;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const point = getPoint(e);

    ctx.beginPath();
    ctx.strokeStyle = isEraser ? "#FFFFFF" : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (lastPointRef.current) {
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    lastPointRef.current = point;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    toast.success("Canvas cleared!");
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `mood-art-${new Date().toISOString().split("T")[0]}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Artwork saved!");
  };

  return (
    <Card className="gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Art Therapy Canvas
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCanvas}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas */}
        <div className="border border-border rounded-xl overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="w-full h-auto cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
          />
        </div>

        {/* Tools */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Color Palette */}
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                className={cn(
                  "w-6 h-6 rounded-full transition-all",
                  color === c && !isEraser && "ring-2 ring-offset-2 ring-foreground"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Eraser */}
          <Button
            variant={isEraser ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEraser(!isEraser)}
            className="gap-2"
          >
            <Eraser className="w-4 h-4" />
            Eraser
          </Button>

          {/* Brush Size */}
          <div className="flex items-center gap-2 flex-1 min-w-[120px]">
            <span className="text-xs text-muted-foreground">Size</span>
            <Slider
              value={[brushSize]}
              onValueChange={(v) => setBrushSize(v[0])}
              min={1}
              max={30}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-6">{brushSize}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Express your emotions through art. There's no right or wrong way to create.
        </p>
      </CardContent>
    </Card>
  );
}
