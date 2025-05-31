import { useState, useRef, useCallback } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import Konva from 'konva';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import { 
  Pen, 
  Eraser, 
  Square, 
  Circle, 
  Download, 
  Trash2,
  Undo,
  Redo,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingLine {
  tool: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
}

const colorPalette = [
  "#000000", "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#A855F7", "#EC4899", "#6366F1", "#14B8A6"
];

export default function SimpleWhiteboard() {
  const { toast } = useToast();
  const stageRef = useRef<Konva.Stage>(null);
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [history, setHistory] = useState<DrawingLine[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (tool === 'select') return;
    
    setIsDrawing(true);
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const newLine: DrawingLine = {
      tool,
      points: [pos.x, pos.y],
      stroke: tool === 'eraser' ? '#FFFFFF' : currentColor,
      strokeWidth: brushSize,
    };
    
    setLines([...lines, newLine]);
  }, [tool, lines, currentColor, brushSize]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    setLines([...lines.slice(0, -1), lastLine]);
  }, [isDrawing, lines]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    // Save to history
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push([...lines]);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [isDrawing, lines, history, historyStep]);

  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setLines(history[historyStep - 1]);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setLines(history[historyStep + 1]);
    }
  };

  const handleClear = () => {
    setLines([]);
    setHistory([[]]);
    setHistoryStep(0);
    toast({
      title: "Canvas Cleared",
      description: "All drawings have been removed",
    });
  };

  const handleExport = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'whiteboard.png';
      link.href = dataURL;
      link.click();
      toast({
        title: "Export Complete",
        description: "Whiteboard exported as PNG",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Digital Whiteboard
        </h1>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExport} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export PNG
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Tool Panel */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 space-y-6">
          {/* Drawing Tools */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'pen', name: 'Pen', icon: Pen },
                { id: 'eraser', name: 'Eraser', icon: Eraser },
                { id: 'rectangle', name: 'Rectangle', icon: Square },
                { id: 'circle', name: 'Circle', icon: Circle },
              ].map((toolItem) => {
                const IconComponent = toolItem.icon;
                return (
                  <Button
                    key={toolItem.id}
                    variant={tool === toolItem.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTool(toolItem.id)}
                    className="h-12 flex flex-col items-center justify-center"
                  >
                    <IconComponent className="w-4 h-4 mb-1" />
                    <span className="text-xs">{toolItem.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Brush Size */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Brush Size: {brushSize}px
            </h3>
            <Slider
              value={[brushSize]}
              onValueChange={(value) => setBrushSize(value[0])}
              max={50}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {/* Color Palette */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Colors</h3>
            <div className="grid grid-cols-5 gap-2">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "w-8 h-8 rounded border-2",
                    currentColor === color 
                      ? "border-gray-900 dark:border-white scale-110" 
                      : "border-gray-300 dark:border-gray-600"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                />
              ))}
            </div>
            <div className="mt-3">
              <input
                type="color"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                className="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleUndo}
              disabled={historyStep <= 0}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button
              onClick={handleRedo}
              disabled={historyStep >= history.length - 1}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Redo className="w-4 h-4 mr-2" />
              Redo
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Canvas
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-white dark:bg-gray-100">
          <Stage
            ref={stageRef}
            width={window.innerWidth - 256}
            height={window.innerHeight - 64}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            style={{ cursor: tool === 'eraser' ? 'crosshair' : 'crosshair' }}
          >
            <Layer>
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    line.tool === 'eraser' ? 'destination-out' : 'source-over'
                  }
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}