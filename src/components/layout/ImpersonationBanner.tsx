import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Button } from '@/components/ui/button';
import { Shield, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUserEmail, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  const handleStop = () => {
    stopImpersonation();
    navigate('/admin');
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-destructive px-4 py-2 text-destructive-foreground">
      <Shield className="h-4 w-4" />
      <span className="text-sm font-medium">
        Stai visualizzando come: <strong>{impersonatedUserEmail}</strong>
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={handleStop}
        className="h-7 border-destructive-foreground/30 bg-transparent text-destructive-foreground hover:bg-destructive-foreground/10"
      >
        <X className="h-3 w-3 mr-1" />
        Esci
      </Button>
    </div>
  );
}
