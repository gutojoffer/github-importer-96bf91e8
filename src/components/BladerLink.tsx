import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BladerLinkProps {
  /** Nome do blader (usado para correlação no perfil público) */
  name: string;
  cidade?: string | null;
  /** Se passado, vai para o perfil pelo userId; senão usa o nome */
  userId?: string | null;
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper que transforma qualquer conteúdo (avatar, nome, etc.) em link
 * para o perfil público do blader. Mostra tooltip com nome + cidade.
 *
 * Como players não têm user_id ainda, a rota usa o nome para correlacionar.
 */
export default function BladerLink({ name, cidade, userId, children, className }: BladerLinkProps) {
  if (!name) return <>{children}</>;
  const target = userId
    ? `/blader/perfil/${userId}`
    : `/blader/profile/by-name/${encodeURIComponent(name)}`;

  const tooltipText = cidade ? `${name} · ${cidade}` : name;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={target} className={className} onClick={(e) => e.stopPropagation()}>
            {children}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="font-body text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
