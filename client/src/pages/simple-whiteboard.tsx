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
  Feather,
  Sparkles,
  Brain,
  Wand2,
  Eye,
  MessageSquare
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
  'https://plus.unsplash.com/premium_photo-1674728198545-8fa4796b9297?q=80&w=1036&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
];

// 15 Different Pen Types with Unique Properties
const penTypes = [
  { 
    id: 'regular-pen', 
    name: 'Regular Pen', 
    icon: Pen, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.5, 
    opacity: 1.0, 
    strokeMultiplier: 1.0,
    description: 'Daily writing pen'
  },
  { 
    id: 'fine-pen', 
    name: 'Fine Pen', 
    icon: Pencil, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.8, 
    opacity: 0.9, 
    strokeMultiplier: 0.5,
    description: 'Detailed line work'
  },
  { 
    id: 'brush-pen', 
    name: 'Brush Pen', 
    icon: Brush, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.3, 
    opacity: 0.8, 
    strokeMultiplier: 2.0,
    description: 'Artistic brush strokes'
  },
  { 
    id: 'marker', 
    name: 'Marker', 
    icon: PaintBucket, 
    lineCap: 'butt', 
    lineJoin: 'miter', 
    tension: 0.1, 
    opacity: 1.0, 
    strokeMultiplier: 1.5,
    description: 'Bold presentation lines'
  },
  { 
    id: 'calligraphy', 
    name: 'Calligraphy', 
    icon: Feather, 
    lineCap: 'butt', 
    lineJoin: 'bevel', 
    tension: 0.7, 
    opacity: 1.0, 
    strokeMultiplier: 1.8,
    description: 'Elegant writing style'
  },
  { 
    id: 'highlighter', 
    name: 'Highlighter', 
    icon: Edit3, 
    lineCap: 'butt', 
    lineJoin: 'round', 
    tension: 0.2, 
    opacity: 0.4, 
    strokeMultiplier: 3.0,
    description: 'Highlight important text'
  },
  { 
    id: 'watercolor', 
    name: 'Watercolor', 
    icon: Brush, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.9, 
    opacity: 0.6, 
    strokeMultiplier: 2.5,
    description: 'Painting and shading'
  },
  { 
    id: 'sketch-pen', 
    name: 'Sketch Pen', 
    icon: Pencil, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.6, 
    opacity: 0.8, 
    strokeMultiplier: 1.2,
    description: 'Drawing and sketching'
  },
  { 
    id: 'fountain-pen', 
    name: 'Fountain Pen', 
    icon: Pen, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.4, 
    opacity: 0.9, 
    strokeMultiplier: 1.3,
    description: 'Classic smooth writing'
  },
  { 
    id: 'gel-pen', 
    name: 'Gel Pen', 
    icon: Pen, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.3, 
    opacity: 1.0, 
    strokeMultiplier: 0.8,
    description: 'Smooth stylish writing'
  },
  { 
    id: 'ballpoint', 
    name: 'Ballpoint', 
    icon: Pen, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.2, 
    opacity: 1.0, 
    strokeMultiplier: 0.7,
    description: 'Everyday writing pen'
  },
  { 
    id: 'felt-tip', 
    name: 'Felt Tip', 
    icon: PaintBucket, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.4, 
    opacity: 0.9, 
    strokeMultiplier: 1.6,
    description: 'Vibrant coloring'
  },
  { 
    id: 'charcoal', 
    name: 'Charcoal', 
    icon: Pencil, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.8, 
    opacity: 0.7, 
    strokeMultiplier: 2.2,
    description: 'Artistic shading'
  },
  { 
    id: 'pastels', 
    name: 'Pastels', 
    icon: Brush, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.7, 
    opacity: 0.6, 
    strokeMultiplier: 2.8,
    description: 'Soft artistic strokes'
  },
  { 
    id: 'digital-pen', 
    name: 'Digital Pen', 
    icon: Pen, 
    lineCap: 'round', 
    lineJoin: 'round', 
    tension: 0.1, 
    opacity: 1.0, 
    strokeMultiplier: 1.0,
    description: 'Precise digital drawing'
  }
];

// 5 Different Eraser Types with Unique Properties
const eraserTypes = [
  { 
    id: 'soft-eraser', 
    name: 'Soft Eraser', 
    icon: Eraser, 
    operation: 'destination-out',
    opacity: 0.6,
    strokeMultiplier: 1.5,
    description: 'Gentle erasing for pencil marks'
  },
  { 
    id: 'hard-eraser', 
    name: 'Hard Eraser', 
    icon: Eraser, 
    operation: 'destination-out',
    opacity: 1.0,
    strokeMultiplier: 1.0,
    description: 'Strong erasing for tough marks'
  },
  { 
    id: 'precision-eraser', 
    name: 'Precision Eraser', 
    icon: Eraser, 
    operation: 'destination-out',
    opacity: 1.0,
    strokeMultiplier: 0.5,
    description: 'Small detailed erasing'
  },
  { 
    id: 'background-eraser', 
    name: 'Background Eraser', 
    icon: Eraser, 
    operation: 'destination-out',
    opacity: 1.0,
    strokeMultiplier: 2.0,
    description: 'Can erase background images',
    canEraseBackground: true
  },
  { 
    id: 'magic-eraser', 
    name: 'Magic Eraser', 
    icon: Eraser, 
    operation: 'destination-out',
    opacity: 0.8,
    strokeMultiplier: 3.0,
    description: 'Large area quick erasing'
  }
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
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiResults, setAiResults] = useState<string>('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);

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
    
    // Calculate actual stroke width based on pen/eraser type
    let actualStrokeWidth = brushSize;
    let actualOpacity = 1;
    
    if (tool === 'pen') {
      actualStrokeWidth = brushSize * selectedPen.strokeMultiplier;
      actualOpacity = selectedPen.opacity;
    } else if (tool === 'eraser') {
      actualStrokeWidth = brushSize * selectedEraser.strokeMultiplier;
      actualOpacity = selectedEraser.opacity;
    }

    const newLine: DrawingLine = {
      tool,
      points: [pos.x, pos.y],
      stroke: strokeColor,
      strokeWidth: actualStrokeWidth,
      penType: tool === 'pen' ? selectedPenType : undefined,
      eraserType: tool === 'eraser' ? selectedEraserType : undefined,
      lineCap: tool === 'pen' ? selectedPen.lineCap as any : 'round',
      lineJoin: tool === 'pen' ? selectedPen.lineJoin as any : 'round',
      tension: tool === 'pen' ? selectedPen.tension : 0.5,
      opacity: actualOpacity,
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

  // AI Functions
  const analyzeHandwriting = async () => {
    if (!stageRef.current) return;
    
    setIsAIProcessing(true);
    try {
      const dataURL = stageRef.current.toDataURL();
      
      const response = await fetch('/api/ai/analyze-handwriting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: dataURL,
          prompt: "Analyze the handwriting in this image and provide the text content with any suggested corrections."
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiResults(data.result);
        setShowAIPanel(true);
        toast({
          title: "AI Analysis Complete",
          description: "Handwriting analysis results are ready!",
        });
      } else {
        toast({
          title: "AI Analysis Failed",
          description: data.error || "Failed to analyze handwriting",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to AI service",
        variant: "destructive",
      });
    } finally {
      setIsAIProcessing(false);
    }
  };

  const getSmartSuggestions = async () => {
    setIsAIProcessing(true);
    try {
      const textContent = textElements.map(t => t.text).join(' ');
      const context = "creative brainstorming and content enhancement";
      
      const response = await fetch('/api/ai/smart-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: textContent || "whiteboard drawing and sketches",
          context: context
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiResults(data.suggestions);
        setShowAIPanel(true);
        toast({
          title: "Smart Suggestions Ready",
          description: "AI has generated creative suggestions for your board!",
        });
      } else {
        toast({
          title: "Suggestions Failed",
          description: data.error || "Failed to get AI suggestions",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get smart suggestions",
        variant: "destructive",
      });
    } finally {
      setIsAIProcessing(false);
    }
  };

  const improveSketch = async () => {
    if (!stageRef.current) return;
    
    setIsAIProcessing(true);
    try {
      const dataURL = stageRef.current.toDataURL();
      
      const response = await fetch('/api/ai/improve-sketch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: dataURL,
          improvements: "artistic quality, proportions, and overall composition"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiResults(data.improvements);
        setShowAIPanel(true);
        toast({
          title: "Sketch Analysis Complete",
          description: "AI has analyzed your sketch and provided improvement suggestions!",
        });
      } else {
        toast({
          title: "Sketch Analysis Failed",
          description: data.error || "Failed to analyze sketch",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze sketch",
        variant: "destructive",
      });
    } finally {
      setIsAIProcessing(false);
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
                  title={`${penType.name} - ${penType.description}`}
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
                  title={`${eraserType.name} - ${eraserType.description}`}
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

      {/* AI Features */}
      <div>
        <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Features
        </h3>
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeHandwriting}
            disabled={isAIProcessing}
            className="h-10 flex items-center justify-start px-3"
          >
            <Eye className="w-4 h-4 mr-2" />
            <span className="text-xs">Analyze Handwriting</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={getSmartSuggestions}
            disabled={isAIProcessing}
            className="h-10 flex items-center justify-start px-3"
          >
            <Brain className="w-4 h-4 mr-2" />
            <span className="text-xs">Smart Suggestions</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={improveSketch}
            disabled={isAIProcessing}
            className="h-10 flex items-center justify-start px-3"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            <span className="text-xs">Improve Sketch</span>
          </Button>
        </div>
        {isAIProcessing && (
          <div className="mt-2 flex items-center text-sm text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            AI Processing...
          </div>
        )}
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
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2 flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {tool}
                </span>
              </div>
              {tool === 'pen' && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {penTypes.find(p => p.id === selectedPenType)?.name}
                </div>
              )}
              {tool === 'eraser' && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {eraserTypes.find(e => e.id === selectedEraserType)?.name}
                </div>
              )}
            </div>
          )}

          {/* Pen/Eraser Properties Indicator - Desktop */}
          {!isMobile && tool !== 'text' && (
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-3 max-w-xs">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-gray-300" 
                    style={{ 
                      backgroundColor: tool === 'eraser' ? '#ff6b6b' : currentColor,
                      width: `${Math.max(8, Math.min(20, brushSize / 2))}px`,
                      height: `${Math.max(8, Math.min(20, brushSize / 2))}px`
                    }}
                  ></div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {tool === 'pen' 
                        ? penTypes.find(p => p.id === selectedPenType)?.name
                        : eraserTypes.find(e => e.id === selectedEraserType)?.name
                      }
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {tool === 'pen' 
                        ? penTypes.find(p => p.id === selectedPenType)?.description
                        : eraserTypes.find(e => e.id === selectedEraserType)?.description
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Results Panel */}
          {showAIPanel && (
            <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 z-50 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI Analysis Results</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIPanel(false)}
                  className="p-1 h-8 w-8"
                >
                  ×
                </Button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                    {aiResults}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(aiResults);
                    toast({
                      title: "Copied to Clipboard",
                      description: "AI results have been copied to clipboard",
                    });
                  }}
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Copy Results
                </Button>
              </div>
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