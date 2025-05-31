import { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Text, Rect, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Share2,
  Camera,
  Mic,
  PaintBucket,
  Brush,
  Pencil,
  Edit3,
  Feather
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawingLine {
  tool: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
  penType?: string;
  eraserType?: string;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'bevel' | 'round' | 'miter';
  tension?: number;
  opacity?: number;
  globalCompositeOperation?: string;
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

// 15 Different Pen Types
const penTypes = [
  { id: 'regular-pen', name: 'Regular Pen', icon: Pen, lineCap: 'round', lineJoin: 'round', tension: 0.5 },
  { id: 'fine-pen', name: 'Fine Pen', icon: Pencil, lineCap: 'round', lineJoin: 'round', tension: 0.8 },
  { id: 'brush-pen', name: 'Brush Pen', icon: Brush, lineCap: 'round', lineJoin: 'round', tension: 0.3 },
  { id: 'marker', name: 'Marker', icon: PaintBucket, lineCap: 'butt', lineJoin: 'miter', tension: 0.1 },
  { id: 'calligraphy', name: 'Calligraphy', icon: Feather, lineCap: 'butt', lineJoin: 'bevel', tension: 0.7 },
  { id: 'highlighter', name: 'Highlighter', icon: Edit3, lineCap: 'butt', lineJoin: 'round', tension: 0.2 },
  { id: 'watercolor', name: 'Watercolor', icon: Brush, lineCap: 'round', lineJoin: 'round', tension: 0.9 },
  { id: 'sketch-pen', name: 'Sketch Pen', icon: Pencil, lineCap: 'round', lineJoin: 'round', tension: 0.6 },
  { id: 'fountain-pen', name: 'Fountain Pen', icon: Pen, lineCap: 'round', lineJoin: 'round', tension: 0.4 },
  { id: 'gel-pen', name: 'Gel Pen', icon: Pen, lineCap: 'round', lineJoin: 'round', tension: 0.3 },
  { id: 'ballpoint', name: 'Ballpoint', icon: Pen, lineCap: 'round', lineJoin: 'round', tension: 0.2 },
  { id: 'felt-tip', name: 'Felt Tip', icon: PaintBucket, lineCap: 'round', lineJoin: 'round', tension: 0.4 },
  { id: 'charcoal', name: 'Charcoal', icon: Pencil, lineCap: 'round', lineJoin: 'round', tension: 0.8 },
  { id: 'pastels', name: 'Pastels', icon: Brush, lineCap: 'round', lineJoin: 'round', tension: 0.7 },
  { id: 'digital-pen', name: 'Digital Pen', icon: Pen, lineCap: 'round', lineJoin: 'round', tension: 0.1 }
];

// 5 Different Eraser Types
const eraserTypes = [
  { id: 'soft-eraser', name: 'Soft Eraser', icon: Eraser, operation: 'destination-out' },
  { id: 'hard-eraser', name: 'Hard Eraser', icon: Eraser, operation: 'destination-out' },
  { id: 'precision-eraser', name: 'Precision Eraser', icon: Eraser, operation: 'destination-out' },
  { id: 'background-eraser', name: 'Background Eraser', icon: Eraser, operation: 'destination-out' },
  { id: 'magic-eraser', name: 'Magic Eraser', icon: Eraser, operation: 'destination-out' }
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
  const [showTextDialog, setShowTextDialog] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedPenType, setSelectedPenType] = useState('regular-pen');
  const [selectedEraserType, setSelectedEraserType] = useState('soft-eraser');

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
      setTextPosition({ x: pos.x, y: pos.y });
      setShowTextDialog(true);
      return;
    }
    
    setIsDrawing(true);
    
    const selectedPen = penTypes.find(p => p.id === selectedPenType) || penTypes[0];
    const selectedEraser = eraserTypes.find(e => e.id === selectedEraserType) || eraserTypes[0];
    
    let strokeColor = currentColor;
    let globalCompositeOperation = 'source-over';
    
    if (tool === 'eraser') {
      if (selectedEraserType === 'background-eraser') {
        globalCompositeOperation = 'destination-out';
        strokeColor = '#FFFFFF';
      } else {
        globalCompositeOperation = 'destination-out';
        strokeColor = '#FFFFFF';
      }
    }
    
    const newLine: DrawingLine = {
      tool,
      points: [pos.x, pos.y],
      stroke: strokeColor,
      strokeWidth: brushSize,
      penType: tool === 'pen' ? selectedPenType : undefined,
      eraserType: tool === 'eraser' ? selectedEraserType : undefined,
      lineCap: tool === 'pen' ? selectedPen.lineCap as any : 'round',
      lineJoin: tool === 'pen' ? selectedPen.lineJoin as any : 'round',
      tension: tool === 'pen' ? selectedPen.tension : 0.5,
      opacity: tool === 'highlighter' ? 0.5 : 1,
      globalCompositeOperation
    };
    
    setLines([...lines, newLine]);
  }, [tool, lines, currentColor, brushSize]);

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

  const handleAddText = () => {
    if (currentText.trim()) {
      const newText: TextElement = {
        id: `text-${Date.now()}`,
        text: currentText,
        x: textPosition.x,
        y: textPosition.y,
        fontSize: fontSize,
        fill: currentColor,
      };
      setTextElements([...textElements, newText]);
      setCurrentText('');
      setShowTextDialog(false);
      toast({
        title: "Text Added",
        description: "Text has been added to the canvas",
      });
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.3);
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleSave = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
      localStorage.setItem('whiteboard-data', JSON.stringify({
        lines,
        textElements,
        backgroundImages,
        timestamp: Date.now()
      }));
      toast({
        title: "Saved Successfully",
        description: "Your whiteboard has been saved locally",
      });
    }
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('whiteboard-data');
    if (saved) {
      const data = JSON.parse(saved);
      setLines(data.lines || []);
      setTextElements(data.textElements || []);
      setBackgroundImages(data.backgroundImages || []);
      toast({
        title: "Loaded Successfully",
        description: "Your whiteboard has been restored",
      });
    }
  };

  const handleShare = async () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 });
      if (navigator.share) {
        try {
          const blob = await fetch(dataURL).then(r => r.blob());
          const file = new File([blob], 'whiteboard.png', { type: 'image/png' });
          await navigator.share({
            title: 'My Whiteboard',
            text: 'Check out my digital whiteboard creation!',
            files: [file]
          });
        } catch (error) {
          navigator.clipboard.writeText(window.location.href);
          toast({
            title: "Link Copied",
            description: "Whiteboard link copied to clipboard",
          });
        }
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Whiteboard link copied to clipboard",
        });
      }
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

      {/* Pen Types */}
      {tool === 'pen' && (
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Pen Types</h3>
          <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto">
            {penTypes.map((penType) => {
              const IconComponent = penType.icon;
              return (
                <Button
                  key={penType.id}
                  variant={selectedPenType === penType.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPenType(penType.id)}
                  className="h-10 flex flex-col items-center justify-center p-1"
                  title={penType.name}
                >
                  <IconComponent className="w-3 h-3 mb-0.5" />
                  <span className="text-xs leading-none">{penType.name.split(' ')[0]}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Eraser Types */}
      {tool === 'eraser' && (
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Eraser Types</h3>
          <div className="grid grid-cols-1 gap-2">
            {eraserTypes.map((eraserType) => {
              const IconComponent = eraserType.icon;
              return (
                <Button
                  key={eraserType.id}
                  variant={selectedEraserType === eraserType.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedEraserType(eraserType.id)}
                  className="h-10 flex items-center justify-start px-3"
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  <span className="text-xs">{eraserType.name}</span>
                </Button>
              );
            })}
          </div>
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-300">
            <strong>Background Eraser:</strong> Can erase background images
          </div>
        </div>
      )}

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

      {/* Zoom Controls */}
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">Zoom & View</h3>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Button onClick={handleZoomIn} variant="outline" size="sm">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button onClick={handleResetZoom} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button onClick={handleZoomOut} variant="outline" size="sm">
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {Math.round(zoom * 100)}%
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
        <Button onClick={handleLoad} variant="outline" size="sm" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Load Saved
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
                <SheetHeader>
                  <SheetTitle>Drawing Tools</SheetTitle>
                </SheetHeader>
                <ToolPanelContent />
              </SheetContent>
            </Sheet>
          )}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Digital Whiteboard
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSave} size="sm" variant="outline">
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          <Button onClick={handleShare} size="sm" variant="outline">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
          <Button onClick={handleExport} size="sm">
            <Download className="w-4 h-4 mr-1" />
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
            scaleX={zoom}
            scaleY={zoom}
            x={dragOffset.x}
            y={dragOffset.y}
            onMouseDown={handlePointerDown}
            onMousemove={handlePointerMove}
            onMouseup={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            draggable={tool === 'select'}
            onDragEnd={(e) => {
              if (tool === 'select') {
                setDragOffset({ x: e.target.x(), y: e.target.y() });
              }
            }}
            style={{ 
              cursor: tool === 'eraser' ? 'crosshair' : tool === 'text' ? 'text' : tool === 'select' ? 'grab' : 'crosshair',
              touchAction: 'none'
            }}
          >
            {/* Background Layer - Protected from normal erasers */}
            <Layer>
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
            </Layer>
            
            {/* Drawing Layer - Only affected by normal erasers */}
            <Layer>
              {lines.filter(line => line.tool !== 'eraser' || line.eraserType !== 'background-eraser').map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  tension={line.tension || 0.5}
                  lineCap={line.lineCap as any || 'round'}
                  lineJoin={line.lineJoin as any || 'round'}
                  opacity={line.opacity || 1}
                  globalCompositeOperation={
                    line.tool === 'eraser' && line.eraserType !== 'background-eraser' 
                      ? 'destination-out' 
                      : (line.globalCompositeOperation as any) || 'source-over'
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
                  onDragEnd={(e) => {
                    setTextElements(textElements.map(t => 
                      t.id === textEl.id ? { ...t, x: e.target.x(), y: e.target.y() } : t
                    ));
                  }}
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
            
            {/* Background Eraser Layer - Only for background erasing */}
            <Layer>
              {lines.filter(line => line.tool === 'eraser' && line.eraserType === 'background-eraser').map((line, i) => (
                <Line
                  key={`bg-erase-${i}`}
                  points={line.points}
                  stroke="#FFFFFF"
                  strokeWidth={line.strokeWidth}
                  tension={line.tension || 0.5}
                  lineCap={line.lineCap as any || 'round'}
                  lineJoin={line.lineJoin as any || 'round'}
                  globalCompositeOperation="destination-out"
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

      {/* Text Input Dialog */}
      <Dialog open={showTextDialog} onOpenChange={setShowTextDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Text to Canvas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-input">Text Content</Label>
              <Input
                id="text-input"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder="Enter your text here..."
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label>Font Size: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                max={72}
                min={12}
                step={2}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowTextDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddText}
                disabled={!currentText.trim()}
              >
                Add Text
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}