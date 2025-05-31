import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Eye, EyeOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Layer } from "@/types/whiteboard";

const colorPalette = [
  "#000000", "#666666", "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#A855F7", "#EC4899", "#6366F1", "#14B8A6", "#FFFFFF"
];

interface PropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushOpacity: number;
  onBrushOpacityChange: (opacity: number) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  layers: Layer[];
  onLayerAdd: () => void;
  onLayerToggle: (layerId: string) => void;
  onLayerSelect: (layerId: string) => void;
  onLayerDelete: (layerId: string) => void;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  snapToGrid: boolean;
  onSnapToGridChange: (snap: boolean) => void;
  showRulers: boolean;
  onShowRulersChange: (show: boolean) => void;
}

export function PropertiesPanel({
  isOpen,
  onClose,
  brushSize,
  onBrushSizeChange,
  brushOpacity,
  onBrushOpacityChange,
  currentColor,
  onColorChange,
  layers,
  onLayerAdd,
  onLayerToggle,
  onLayerSelect,
  onLayerDelete,
  showGrid,
  onShowGridChange,
  snapToGrid,
  onSnapToGridChange,
  showRulers,
  onShowRulersChange,
}: PropertiesPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col relative z-40">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Properties</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Tool Settings */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Brush Settings</h4>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                Size: {brushSize}px
              </Label>
              <Slider
                value={[brushSize]}
                onValueChange={(value) => onBrushSizeChange(value[0])}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1px</span>
                <span>50px</span>
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                Opacity: {brushOpacity}%
              </Label>
              <Slider
                value={[brushOpacity]}
                onValueChange={(value) => onBrushOpacityChange(value[0])}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Colors</h4>
          
          <div className="grid grid-cols-6 gap-2 mb-4">
            {colorPalette.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 border-gray-300 dark:border-gray-600",
                  currentColor === color && "ring-2 ring-primary"
                )}
                style={{ backgroundColor: color }}
                onClick={() => onColorChange(color)}
              />
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <Label className="text-sm text-gray-600 dark:text-gray-400">Custom:</Label>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Layer Management */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Layers</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLayerAdd}
              className="p-1 h-auto"
              title="Add Layer"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={cn(
                  "flex items-center space-x-2 p-2 rounded cursor-pointer",
                  layer.active
                    ? "bg-primary bg-opacity-10 border border-primary border-opacity-20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
                onClick={() => onLayerSelect(layer.id)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerToggle(layer.id);
                  }}
                  className="p-1 h-auto"
                >
                  {layer.visible ? (
                    <Eye className="w-3 h-3 text-primary" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-gray-400" />
                  )}
                </Button>
                <span className={cn(
                  "flex-1 text-sm",
                  layer.active ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
                )}>
                  {layer.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerDelete(layer.id);
                  }}
                  className="p-1 h-auto text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas Settings */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Canvas</h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showGrid"
                checked={showGrid}
                onCheckedChange={onShowGridChange}
              />
              <Label htmlFor="showGrid" className="text-sm text-gray-600 dark:text-gray-400">
                Show Grid
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="snapToGrid"
                checked={snapToGrid}
                onCheckedChange={onSnapToGridChange}
              />
              <Label htmlFor="snapToGrid" className="text-sm text-gray-600 dark:text-gray-400">
                Snap to Grid
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showRulers"
                checked={showRulers}
                onCheckedChange={onShowRulersChange}
              />
              <Label htmlFor="showRulers" className="text-sm text-gray-600 dark:text-gray-400">
                Show Rulers
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
