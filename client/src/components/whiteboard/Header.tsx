import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Presentation, 
  Plus, 
  FolderOpen, 
  Save, 
  Share, 
  Moon, 
  Sun,
  Users
} from "lucide-react";
import { useTheme } from "next-themes";

interface HeaderProps {
  boardName: string;
  activeSessions: number;
  isConnected: boolean;
  onNewBoard: () => void;
  onOpenBoard: () => void;
  onSaveBoard: () => void;
  onShareBoard: () => void;
}

export function Header({
  boardName,
  activeSessions,
  isConnected,
  onNewBoard,
  onOpenBoard,
  onSaveBoard,
  onShareBoard,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const collaboratorColors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
  const mockCollaborators = Array.from({ length: Math.min(activeSessions, 3) }, (_, i) => ({
    id: i + 1,
    initials: String.fromCharCode(65 + i),
    color: collaboratorColors[i],
  }));

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between relative z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Presentation className="text-white text-sm" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {boardName || "Digital Board"}
          </h1>
        </div>
        
        <div className="hidden md:flex items-center space-x-2 ml-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewBoard}
            className="text-gray-700 dark:text-gray-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Board
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenBoard}
            className="text-gray-700 dark:text-gray-300"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Open
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveBoard}
            className="text-gray-700 dark:text-gray-300"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Collaboration Indicator */}
        <div className="hidden lg:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1.5">
          <div className="flex -space-x-2">
            {mockCollaborators.map((collaborator) => (
              <Avatar key={collaborator.id} className="w-6 h-6 border-2 border-white dark:border-gray-700">
                <AvatarFallback className={`${collaborator.color} text-white text-xs`}>
                  {collaborator.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {activeSessions > 3 && (
              <Avatar className="w-6 h-6 border-2 border-white dark:border-gray-700">
                <AvatarFallback className="bg-gray-400 text-white text-xs">
                  +{activeSessions - 3}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {activeSessions} online
            </span>
            <Badge 
              variant={isConnected ? "default" : "destructive"}
              className="h-2 w-2 p-0 rounded-full"
            />
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onShareBoard}
          className="text-gray-600 dark:text-gray-400"
        >
          <Share className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-gray-600 dark:text-gray-400"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        <Avatar className="w-8 h-8 bg-primary">
          <AvatarFallback className="text-white font-medium text-sm">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
