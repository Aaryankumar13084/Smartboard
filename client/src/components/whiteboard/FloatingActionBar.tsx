import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Presentation, 
  Download, 
  FileText, 
  Trash2, 
  Share 
} from "lucide-react";

interface FloatingActionBarProps {
  onPresentationMode: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onClearCanvas: () => void;
  onShareBoard: () => void;
}

export function FloatingActionBar({
  onPresentationMode,
  onExportPNG,
  onExportPDF,
  onClearCanvas,
  onShareBoard,
}: FloatingActionBarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center space-x-3 z-50">
      <Button
        variant="ghost"
        size="sm"
        onClick={onPresentationMode}
        className="p-2 text-gray-600 dark:text-gray-400"
        title="Presentation Mode"
      >
        <Presentation className="w-4 h-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onExportPNG}
        className="p-2 text-gray-600 dark:text-gray-400"
        title="Export as PNG"
      >
        <Download className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onExportPDF}
        className="p-2 text-gray-600 dark:text-gray-400"
        title="Export as PDF"
      >
        <FileText className="w-4 h-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearCanvas}
        className="p-2 text-gray-600 dark:text-gray-400"
        title="Clear Canvas"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      
      <Button
        onClick={onShareBoard}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium text-sm"
        title="Share Board"
      >
        <Share className="w-4 h-4 mr-2" />
        Share
      </Button>
    </div>
  );
}
