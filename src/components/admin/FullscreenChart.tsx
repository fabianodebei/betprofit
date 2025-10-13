import { ReactNode, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2, X } from 'lucide-react';

interface FullscreenChartProps {
  children: ReactNode;
  title: string;
  className?: string;
}

export const FullscreenChart = ({ children, title, className }: FullscreenChartProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsFullscreen(true)}
        className={className}
        title="Espandi a schermo intero"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">{title}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 mt-4">
            <div className="h-full">
              {children}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
