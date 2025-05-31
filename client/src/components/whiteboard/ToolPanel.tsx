import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  MousePointer,
  Pen,
  PaintBucket,
  Eraser,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Undo,
  Redo,
  Layers,
  Mic,
  Hand,
} from "lucide-react";

const tools = [
  { id: 'select', name: 'Select', icon: MousePointer },
  { id: 'pen', name: 'Pen', icon: Pen },
  { id: 'brush', name: 'Brush', icon: PaintBucket },
  { id: 'eraser', name: 'Eraser', icon: Eraser },
  { id: 'text', name: 'Text', icon: Type },
];

const shapes = [
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'line', name: 'Line', icon: Minus },
  { id: 'arrow', name: 'Arrow', icon: ArrowRight },
];

interface ToolPanelProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleLayers: () => void;
  voiceControlActive: boolean;
  onToggleVoiceControl: () => void;
  onToggleGestures: () => void;
}

export function ToolPanel({
  currentTool,
  onToolChange,
  onUndo,
  onRedo,
  onToggleLayers,
  voiceControlActive,
  onToggleVoiceControl,
  onToggleGestures,
}: ToolPanelProps) {
  return (
    <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-2 relative z-40">
      {/* Drawing Tools */}
      <div className="space-y-2">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Button
              key={tool.id}
              variant="ghost"
              size="sm"
              className={cn(
                "w-10 h-10 p-0",
                currentTool === tool.id
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white"
              )}
              onClick={() => onToolChange(tool.id)}
              title={tool.name}
            >
              <IconComponent className="w-4 h-4" />
            </Button>
          );
        })}
      </div>

      <Separator className="w-8" />

      {/* Shape Tools */}
      <div className="space-y-2">
        {shapes.map((shape) => {
          const IconComponent = shape.icon;
          return (
            <Button
              key={shape.id}
              variant="ghost"
              size="sm"
              className={cn(
                "w-10 h-10 p-0",
                currentTool === shape.id
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white"
              )}
              onClick={() => onToolChange(shape.id)}
              title={shape.name}
            >
              <IconComponent className="w-4 h-4" />
            </Button>
          );
        })}
      </div>

      <Separator className="w-8" />

      {/* Utility Tools */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white"
          onClick={onUndo}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white"
          onClick={onRedo}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white"
          onClick={onToggleLayers}
          title="Layers"
        >
          <Layers className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1" />

      {/* Voice and Gesture Controls */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-10 h-10 p-0",
            voiceControlActive
              ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 animate-pulse"
              : "bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white"
          )}
          onClick={onToggleVoiceControl}
          title="Voice Control"
        >
          <Mic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white"
          onClick={onToggleGestures}
          title="Gesture Control"
        >
          <Hand className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
