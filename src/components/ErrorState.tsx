import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = 'Algo deu errado', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="h-14 w-14 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <p className="font-heading text-lg text-foreground font-bold">{message}</p>
      <p className="text-sm text-muted-foreground font-body">Verifique sua conexão e tente novamente.</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="font-heading gap-2 tracking-wider">
          <RefreshCcw className="h-4 w-4" /> Tentar novamente
        </Button>
      )}
    </div>
  );
}
