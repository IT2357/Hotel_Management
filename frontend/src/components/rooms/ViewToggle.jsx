import { Grid3X3, List } from "lucide-react";
import { Button } from "@/components/rooms/ui/button";

const ViewToggle = ({ view, onViewChange }) => {
  return (
    <div className="flex items-center gap-2 bg-accent-light rounded-lg p-1">
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className={`h-8 w-8 p-0 ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <Grid3X3 className="w-4 h-4" />
      </Button>
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={`h-8 w-8 p-0 ${view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <List className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;
