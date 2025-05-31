import { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Text, Rect, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  Type,
  Image as ImageIcon,
  Menu,
  Palette,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingLine {
  tool: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
}

interface BackgroundImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const colorPalette = [
  "#000000", "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#A855F7", "#EC4899", "#6366F1", "#14B8A6"
];

// Sample background images
const sampleBackgrounds = [
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1464822759844-d150baec0494?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
];

export default function SimpleWhiteboard() {
  const { toast } = useToast();
  const stageRef = useRef<Konva.Stage>(null);
  const [tool, setTool] = useState('pen');
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [fontSize, setFontSize] = useState(24);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [history, setHistory] = useState<DrawingLine[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [selectedBackground, setSelectedBackground] = useState('');
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setStageSize({
        width: window.innerWidth - (window.innerWidth < 768 ? 0 : 256),
        height: window.innerHeight - 64
      });
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePointerDown = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (tool === 'select') return;
    
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    if (tool === 'text') {
      const newText: TextElement = {
        id: `text-${Date.now()}`,
        text: currentText || 'Click to edit',
        x: pos.x,
        y: pos.y,
        fontSize: fontSize,
        fill: currentColor,
      };
      setTextElements([...textElements, newText]);
      setCurrentText('');
      return;
    }
    
    setIsDrawing(true);
    const newLine: DrawingLine = {
      tool,
      points: [pos.x, pos.y],
      stroke: tool === 'eraser' ? '#FFFFFF' : currentColor,
      strokeWidth: brushSize,
    };
    
    setLines([...lines, newLine]);
  }, [tool, lines, textElements, currentColor, brushSize, fontSize, currentText]);

  const handlePointerMove = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    setLines([...lines.slice(0, -1), lastLine]);
  }, [isDrawing, lines]);

  const handlePointerUp = useCallback(() => {
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
    setTextElements([]);
    setBackgroundImages([]);
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

  const handleAddBackground = (imageUrl: string) => {
    const newBackground: BackgroundImage = {
      id: `bg-${Date.now()}`,
      src: imageUrl,
      x: 0,
      y: 0,
      width: stageSize.width,
      height: stageSize.height,
    };
    setBackgroundImages([newBackground]); // Replace existing background
    setSelectedBackground(imageUrl);
    toast({
      title: "Background Added",
      description: "Background image has been set",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        handleAddBackground(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Tool Panel Component for Mobile
  const ToolPanelContent = () => (
    <div className="space-y-6 p-4">
      {/* Drawing Tools */}
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Drawing Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'pen', name: 'Pen', icon: Pen },
            { id: 'eraser', name: 'Eraser', icon: Eraser },
            { id: 'text', name: 'Text', icon: Type },
            { id: 'rectangle', name: 'Rectangle', icon: Square },
          ].map((toolItem) => {
            const IconComponent = toolItem.icon;
            return (
              <Button
                key={toolItem.id}
                variant={tool === toolItem.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTool(toolItem.id);
                  if (isMobile) setShowToolPanel(false);
                }}
                className="h-12 flex flex-col items-center justify-center"
              >
                <IconComponent className="w-4 h-4 mb-1" />
                <span className="text-xs">{toolItem.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Text Input */}
      {tool === 'text' && (
        <div>
          <Label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
            Text Content
          </Label>
          <Input
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Enter text to add"
            className="mb-2"
          />
          <div>
            <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
              Font Size: {fontSize}px
            </Label>
            <Slider
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              max={72}
              min={12}
              step={2}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Brush Size */}
      {(tool === 'pen' || tool === 'eraser') && (
        <div>
          <Label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
            Brush Size: {brushSize}px
          </Label>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            max={50}
            min={1}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* Color Palette */}
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Colors</h3>
        <div className="grid grid-cols-5 gap-2 mb-3">
          {colorPalette.map((color) => (
            <button
              key={color}
              className={cn(
                "w-8 h-8 rounded border-2 transition-transform",
                currentColor === color 
                  ? "border-gray-900 dark:border-white scale-110" 
                  : "border-gray-300 dark:border-gray-600"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setCurrentColor(color)}
            />
          ))}
        </div>
        <Input
          type="color"
          value={currentColor}
          onChange={(e) => setCurrentColor(e.target.value)}
          className="w-full h-10"
        />
      </div>

      {/* Background Gallery */}
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Background Gallery</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {sampleBackgrounds.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => handleAddBackground(imageUrl)}
              className={cn(
                "aspect-video bg-cover bg-center rounded border-2 transition-all",
                selectedBackground === imageUrl 
                  ? "border-primary" 
                  : "border-gray-300 dark:border-gray-600"
              )}
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          ))}
        </div>
        <div>
          <Label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
            Upload Custom Background
          </Label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="w-full"
          />
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleUndo}
            disabled={historyStep <= 0}
            variant="outline"
            size="sm"
          >
            <Undo className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button
            onClick={handleRedo}
            disabled={historyStep >= history.length - 1}
            variant="outline"
            size="sm"
          >
            <Redo className="w-4 h-4 mr-1" />
            Redo
          </Button>
        </div>
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
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <Sheet open={showToolPanel} onOpenChange={setShowToolPanel}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <ToolPanelContent />
              </SheetContent>
            </Sheet>
          )}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Digital Whiteboard
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExport} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Tool Panel */}
        {!isMobile && (
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <ToolPanelContent />
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 bg-white dark:bg-gray-100 relative overflow-hidden">
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handlePointerDown}
            onMousemove={handlePointerMove}
            onMouseup={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            style={{ 
              cursor: tool === 'eraser' ? 'crosshair' : tool === 'text' ? 'text' : 'crosshair',
              touchAction: 'none'
            }}
          >
            <Layer>
              {/* Background Images */}
              {backgroundImages.map((bg, i) => (
                <KonvaImage
                  key={bg.id}
                  x={bg.x}
                  y={bg.y}
                  width={bg.width}
                  height={bg.height}
                  image={(() => {
                    const img = new window.Image();
                    img.crossOrigin = 'anonymous';
                    img.src = bg.src;
                    return img;
                  })()}
                />
              ))}
              
              {/* Drawing Lines */}
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
              
              {/* Text Elements */}
              {textElements.map((textEl) => (
                <Text
                  key={textEl.id}
                  x={textEl.x}
                  y={textEl.y}
                  text={textEl.text}
                  fontSize={textEl.fontSize}
                  fill={textEl.fill}
                  draggable
                  onDblClick={(e) => {
                    const newText = prompt('Edit text:', textEl.text);
                    if (newText !== null) {
                      setTextElements(textElements.map(t => 
                        t.id === textEl.id ? { ...t, text: newText } : t
                      ));
                    }
                  }}
                />
              ))}
            </Layer>
          </Stage>
          
          {/* Mobile Tool Indicator */}
          {isMobile && (
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {tool}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}