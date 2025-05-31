import { useRef, useCallback } from 'react';
import Konva from 'konva';
import type { DrawingEvent } from '@shared/schema';
import type { DrawingState } from '@/types/whiteboard';

interface UseDrawingProps {
  stageRef: React.RefObject<Konva.Stage>;
  layerRef: React.RefObject<Konva.Layer>;
  drawingState: DrawingState;
  onDrawingEvent: (event: DrawingEvent) => void;
}

export function useDrawing({
  stageRef,
  layerRef,
  drawingState,
  onDrawingEvent,
}: UseDrawingProps) {
  const isDrawing = useRef(false);
  const currentPath = useRef<number[]>([]);

  const startDrawing = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (drawingState.currentTool === 'select') return;

    isDrawing.current = true;
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;

    currentPath.current = [pos.x, pos.y];

    if (drawingState.currentTool === 'pen' || drawingState.currentTool === 'brush') {
      const line = new Konva.Line({
        stroke: drawingState.currentColor,
        strokeWidth: drawingState.brushSize,
        globalCompositeOperation: 'source-over',
        lineCap: 'round',
        lineJoin: 'round',
        points: currentPath.current,
      });

      layerRef.current?.add(line);
      layerRef.current?.batchDraw();
    } else if (drawingState.currentTool === 'eraser') {
      const eraser = new Konva.Line({
        stroke: '#FFFFFF',
        strokeWidth: drawingState.brushSize,
        globalCompositeOperation: 'destination-out',
        lineCap: 'round',
        lineJoin: 'round',
        points: currentPath.current,
      });

      layerRef.current?.add(eraser);
      layerRef.current?.batchDraw();
    }
  }, [drawingState, stageRef, layerRef]);

  const continueDrawing = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isDrawing.current) return;
    if (drawingState.currentTool === 'select') return;

    const stage = stageRef.current;
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    currentPath.current = currentPath.current.concat([pos.x, pos.y]);

    const layer = layerRef.current;
    const lastLine = layer?.children[layer.children.length - 1] as Konva.Line;
    
    if (lastLine) {
      lastLine.points(currentPath.current);
      layer?.batchDraw();
    }
  }, [drawingState.currentTool, stageRef, layerRef]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;

    isDrawing.current = false;

    if (currentPath.current.length > 0) {
      const points = [];
      for (let i = 0; i < currentPath.current.length; i += 2) {
        points.push({
          x: currentPath.current[i],
          y: currentPath.current[i + 1],
        });
      }

      const drawingEvent: DrawingEvent = {
        type: drawingState.currentTool === 'eraser' ? 'erase' : 'draw',
        tool: drawingState.currentTool,
        points,
        color: drawingState.currentColor,
        size: drawingState.brushSize,
        opacity: drawingState.brushOpacity,
        layerId: drawingState.layers.find(l => l.active)?.id || 'default',
        userId: 1, // TODO: Get from auth context
        timestamp: Date.now(),
      };

      onDrawingEvent(drawingEvent);
    }

    currentPath.current = [];
  }, [drawingState, onDrawingEvent]);

  const applyDrawingEvent = useCallback((event: DrawingEvent) => {
    const layer = layerRef.current;
    if (!layer) return;

    const points = event.points.flatMap(p => [p.x, p.y]);

    if (event.type === 'draw') {
      const line = new Konva.Line({
        stroke: event.color,
        strokeWidth: event.size,
        globalCompositeOperation: 'source-over',
        lineCap: 'round',
        lineJoin: 'round',
        points,
        opacity: event.opacity / 100,
      });

      layer.add(line);
    } else if (event.type === 'erase') {
      const eraser = new Konva.Line({
        stroke: '#FFFFFF',
        strokeWidth: event.size,
        globalCompositeOperation: 'destination-out',
        lineCap: 'round',
        lineJoin: 'round',
        points,
      });

      layer.add(eraser);
    }

    layer.batchDraw();
  }, [layerRef]);

  const clearCanvas = useCallback(() => {
    const layer = layerRef.current;
    if (layer) {
      layer.destroyChildren();
      layer.batchDraw();
    }

    const clearEvent: DrawingEvent = {
      type: 'clear',
      tool: 'clear',
      points: [],
      color: '',
      size: 0,
      opacity: 100,
      layerId: 'all',
      userId: 1,
      timestamp: Date.now(),
    };

    onDrawingEvent(clearEvent);
  }, [layerRef, onDrawingEvent]);

  return {
    startDrawing,
    continueDrawing,
    stopDrawing,
    applyDrawingEvent,
    clearCanvas,
  };
}
