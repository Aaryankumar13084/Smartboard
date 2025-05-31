import { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { useDrawing } from '@/hooks/useDrawing';
import { zoomStage, fitStageToWindow } from '@/lib/canvas-utils';
import type { DrawingEvent } from '@shared/schema';
import type { DrawingState } from '@/types/whiteboard';

interface CanvasProps {
  drawingState: DrawingState;
  showGrid: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onDrawingEvent: (event: DrawingEvent) => void;
  onRemoteDrawingEvent: (event: DrawingEvent) => void;
}

export function Canvas({
  drawingState,
  showGrid,
  zoom,
  onZoomChange,
  onDrawingEvent,
  onRemoteDrawingEvent,
}: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });

  const { startDrawing, continueDrawing, stopDrawing, applyDrawingEvent } = useDrawing({
    stageRef,
    layerRef,
    drawingState,
    onDrawingEvent,
  });

  // Handle remote drawing events
  useEffect(() => {
    if (onRemoteDrawingEvent) {
      const handleRemoteEvent = (event: DrawingEvent) => {
        applyDrawingEvent(event);
      };
      
      // This would be called from the WebSocket hook
      // For now, we'll just expose the function
      (window as any).handleRemoteDrawingEvent = handleRemoteEvent;
    }
  }, [applyDrawingEvent, onRemoteDrawingEvent]);

  // Resize stage to fit container
  useEffect(() => {
    const updateSize = () => {
      if (stageRef.current) {
        const container = stageRef.current.container();
        const containerRect = container.getBoundingClientRect();
        setStageSize({
          width: containerRect.width,
          height: containerRect.height,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle wheel zoom
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    
    let newScale = oldScale;
    if (e.evt.deltaY < 0) {
      newScale = oldScale * scaleBy;
    } else {
      newScale = oldScale / scaleBy;
    }
    
    newScale = Math.max(0.1, Math.min(newScale, 5));
    onZoomChange(Math.round(newScale * 100));
    
    zoomStage(stage, newScale / oldScale);
  };

  // Handle stage drag for panning
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target as Konva.Stage;
    setCanvasPosition({ x: Math.round(stage.x()), y: Math.round(stage.y()) });
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 25, 500);
    onZoomChange(newZoom);
    if (stageRef.current) {
      const scale = newZoom / 100;
      stageRef.current.scale({ x: scale, y: scale });
      stageRef.current.batchDraw();
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 25, 25);
    onZoomChange(newZoom);
    if (stageRef.current) {
      const scale = newZoom / 100;
      stageRef.current.scale({ x: scale, y: scale });
      stageRef.current.batchDraw();
    }
  };

  const handleFitToScreen = () => {
    if (stageRef.current) {
      stageRef.current.scale({ x: 1, y: 1 });
      stageRef.current.position({ x: 0, y: 0 });
      stageRef.current.batchDraw();
      onZoomChange(100);
      setCanvasPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Canvas Container */}
      <div className="w-full h-full bg-white dark:bg-gray-900 relative">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={startDrawing}
          onMousemove={continueDrawing}
          onMouseup={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={continueDrawing}
          onTouchEnd={stopDrawing}
          onWheel={handleWheel}
          draggable={drawingState.currentTool === 'select'}
          onDragEnd={handleDragEnd}
          style={{ cursor: drawingState.currentTool === 'select' ? 'grab' : 'crosshair' }}
        >
          <Layer ref={layerRef} />
        </Stage>
        
        {/* Grid Overlay */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        )}
        
        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex flex-col space-y-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="w-10 h-10 p-0"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-1 min-w-12">
            {zoom}%
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="w-10 h-10 p-0"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFitToScreen}
            className="w-10 h-10 p-0"
            title="Fit to Screen"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>

        {/* Canvas Position Indicator */}
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
          X: {canvasPosition.x}, Y: {canvasPosition.y}
        </div>
      </div>
    </div>
  );
}
