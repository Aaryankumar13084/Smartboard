import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Konva from 'konva';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/whiteboard/Header';
import { ToolPanel } from '@/components/whiteboard/ToolPanel';
import { PropertiesPanel } from '@/components/whiteboard/PropertiesPanel';
import { Canvas } from '@/components/whiteboard/Canvas';
import { FloatingActionBar } from '@/components/whiteboard/FloatingActionBar';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiRequest } from '@/lib/queryClient';
import { exportCanvasAsPNG, exportCanvasAsPDF } from '@/lib/canvas-utils';
import type { DrawingEvent, Board } from '@shared/schema';
import type { WhiteboardState, Layer } from '@/types/whiteboard';

const DEMO_BOARD_ID = 1;
const DEMO_USER_ID = 1;

export default function Whiteboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const stageRef = useRef<Konva.Stage>(null);

  const [state, setState] = useState<WhiteboardState>({
    drawing: {
      currentTool: 'pen',
      brushSize: 5,
      brushOpacity: 100,
      currentColor: '#000000',
      layers: [
        { id: 'layer-1', name: 'Layer 1', visible: true, active: false, opacity: 100 },
        { id: 'layer-2', name: 'Layer 2', visible: true, active: false, opacity: 100 },
        { id: 'layer-3', name: 'Layer 3', visible: true, active: true, opacity: 100 },
      ],
      isDrawing: false,
    },
    canvas: {
      zoom: 100,
      panX: 0,
      panY: 0,
      showGrid: false,
      snapToGrid: false,
      showRulers: false,
    },
    collaboration: {
      activeSessions: 0,
      isConnected: false,
      collaborators: [],
    },
    history: [],
    historyIndex: 0,
  });

  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(true);
  const [voiceControlActive, setVoiceControlActive] = useState(false);

  // Fetch board data
  const { data: board } = useQuery<Board>({
    queryKey: ['/api/boards', DEMO_BOARD_ID],
  });

  // WebSocket for real-time collaboration
  const { isConnected, sendDrawingEvent } = useWebSocket({
    boardId: DEMO_BOARD_ID,
    userId: DEMO_USER_ID,
    onDrawingEvent: (event: DrawingEvent) => {
      setState(prev => ({
        ...prev,
        history: [...prev.history, event],
      }));
      // Apply the drawing event to canvas
      if ((window as any).handleRemoteDrawingEvent) {
        (window as any).handleRemoteDrawingEvent(event);
      }
    },
    onUserJoined: (userId: number, activeSessions: number) => {
      setState(prev => ({
        ...prev,
        collaboration: {
          ...prev.collaboration,
          activeSessions,
        },
      }));
      toast({
        title: "User joined",
        description: `User ${userId} joined the board`,
      });
    },
    onUserLeft: (userId: number, activeSessions: number) => {
      setState(prev => ({
        ...prev,
        collaboration: {
          ...prev.collaboration,
          activeSessions,
        },
      }));
      toast({
        title: "User left",
        description: `User ${userId} left the board`,
      });
    },
  });

  // Update collaboration state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      collaboration: {
        ...prev.collaboration,
        isConnected,
      },
    }));
  }, [isConnected]);

  // Save board mutation
  const saveBoard = useMutation({
    mutationFn: async (boardData: Partial<Board>) => {
      const response = await apiRequest('PUT', `/api/boards/${DEMO_BOARD_ID}`, boardData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Board saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/boards', DEMO_BOARD_ID] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save board",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleToolChange = (tool: string) => {
    setState(prev => ({
      ...prev,
      drawing: { ...prev.drawing, currentTool: tool },
    }));
  };

  const handleBrushSizeChange = (size: number) => {
    setState(prev => ({
      ...prev,
      drawing: { ...prev.drawing, brushSize: size },
    }));
  };

  const handleBrushOpacityChange = (opacity: number) => {
    setState(prev => ({
      ...prev,
      drawing: { ...prev.drawing, brushOpacity: opacity },
    }));
  };

  const handleColorChange = (color: string) => {
    setState(prev => ({
      ...prev,
      drawing: { ...prev.drawing, currentColor: color },
    }));
  };

  const handleZoomChange = (zoom: number) => {
    setState(prev => ({
      ...prev,
      canvas: { ...prev.canvas, zoom },
    }));
  };

  const handleDrawingEvent = (event: DrawingEvent) => {
    setState(prev => ({
      ...prev,
      history: [...prev.history, event],
      historyIndex: prev.history.length,
    }));
    sendDrawingEvent(event);
  };

  const handleLayerAdd = () => {
    const newLayer: Layer = {
      id: `layer-${Date.now()}`,
      name: `Layer ${state.drawing.layers.length + 1}`,
      visible: true,
      active: false,
      opacity: 100,
    };
    setState(prev => ({
      ...prev,
      drawing: {
        ...prev.drawing,
        layers: [...prev.drawing.layers, newLayer],
      },
    }));
  };

  const handleLayerToggle = (layerId: string) => {
    setState(prev => ({
      ...prev,
      drawing: {
        ...prev.drawing,
        layers: prev.drawing.layers.map(layer =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        ),
      },
    }));
  };

  const handleLayerSelect = (layerId: string) => {
    setState(prev => ({
      ...prev,
      drawing: {
        ...prev.drawing,
        layers: prev.drawing.layers.map(layer => ({
          ...layer,
          active: layer.id === layerId,
        })),
      },
    }));
  };

  const handleLayerDelete = (layerId: string) => {
    setState(prev => ({
      ...prev,
      drawing: {
        ...prev.drawing,
        layers: prev.drawing.layers.filter(layer => layer.id !== layerId),
      },
    }));
  };

  const handleNewBoard = () => {
    toast({
      title: "New Board",
      description: "Creating a new board...",
    });
  };

  const handleOpenBoard = () => {
    toast({
      title: "Open Board",
      description: "Opening board selection...",
    });
  };

  const handleSaveBoard = () => {
    saveBoard.mutate({
      data: { events: state.history },
    });
  };

  const handleShareBoard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Board Shared",
      description: "Board URL copied to clipboard",
    });
  };

  const handleExportPNG = () => {
    if (stageRef.current) {
      const dataURL = exportCanvasAsPNG(stageRef.current);
      const link = document.createElement('a');
      link.download = 'whiteboard.png';
      link.href = dataURL;
      link.click();
      toast({
        title: "Export Complete",
        description: "Board exported as PNG",
      });
    }
  };

  const handleExportPDF = () => {
    if (stageRef.current) {
      exportCanvasAsPDF(stageRef.current);
      toast({
        title: "Export Complete",
        description: "Board exported as PDF",
      });
    }
  };

  const handleClearCanvas = () => {
    if (stageRef.current) {
      const layer = stageRef.current.findOne('Layer');
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
        userId: DEMO_USER_ID,
        timestamp: Date.now(),
      };
      
      handleDrawingEvent(clearEvent);
      
      toast({
        title: "Canvas Cleared",
        description: "All drawings have been removed",
      });
    }
  };

  const handlePresentationMode = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
    toast({
      title: "Presentation Mode",
      description: "Entering full screen mode",
    });
  };

  const handleToggleVoiceControl = () => {
    setVoiceControlActive(!voiceControlActive);
    if (!voiceControlActive) {
      toast({
        title: "Voice Control",
        description: "Voice control activated",
      });
      setTimeout(() => setVoiceControlActive(false), 5000);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header
        boardName={board?.name || "Untitled Board"}
        activeSessions={state.collaboration.activeSessions}
        isConnected={state.collaboration.isConnected}
        onNewBoard={handleNewBoard}
        onOpenBoard={handleOpenBoard}
        onSaveBoard={handleSaveBoard}
        onShareBoard={handleShareBoard}
      />

      <div className="flex flex-1 overflow-hidden">
        <ToolPanel
          currentTool={state.drawing.currentTool}
          onToolChange={handleToolChange}
          onUndo={() => {}}
          onRedo={() => {}}
          onToggleLayers={() => setPropertiesPanelOpen(!propertiesPanelOpen)}
          voiceControlActive={voiceControlActive}
          onToggleVoiceControl={handleToggleVoiceControl}
          onToggleGestures={() => {}}
        />

        <Canvas
          drawingState={state.drawing}
          showGrid={state.canvas.showGrid}
          zoom={state.canvas.zoom}
          onZoomChange={handleZoomChange}
          onDrawingEvent={handleDrawingEvent}
          onRemoteDrawingEvent={() => {}}
        />

        <PropertiesPanel
          isOpen={propertiesPanelOpen}
          onClose={() => setPropertiesPanelOpen(false)}
          brushSize={state.drawing.brushSize}
          onBrushSizeChange={handleBrushSizeChange}
          brushOpacity={state.drawing.brushOpacity}
          onBrushOpacityChange={handleBrushOpacityChange}
          currentColor={state.drawing.currentColor}
          onColorChange={handleColorChange}
          layers={state.drawing.layers}
          onLayerAdd={handleLayerAdd}
          onLayerToggle={handleLayerToggle}
          onLayerSelect={handleLayerSelect}
          onLayerDelete={handleLayerDelete}
          showGrid={state.canvas.showGrid}
          onShowGridChange={(show) =>
            setState(prev => ({
              ...prev,
              canvas: { ...prev.canvas, showGrid: show },
            }))
          }
          snapToGrid={state.canvas.snapToGrid}
          onSnapToGridChange={(snap) =>
            setState(prev => ({
              ...prev,
              canvas: { ...prev.canvas, snapToGrid: snap },
            }))
          }
          showRulers={state.canvas.showRulers}
          onShowRulersChange={(show) =>
            setState(prev => ({
              ...prev,
              canvas: { ...prev.canvas, showRulers: show },
            }))
          }
        />
      </div>

      <FloatingActionBar
        onPresentationMode={handlePresentationMode}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onClearCanvas={handleClearCanvas}
        onShareBoard={handleShareBoard}
      />

      {/* Voice Control Indicator */}
      {voiceControlActive && (
        <div className="fixed top-1/2 left-4 transform -translate-y-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg animate-pulse z-40">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Listening...</span>
          </div>
        </div>
      )}
    </div>
  );
}
