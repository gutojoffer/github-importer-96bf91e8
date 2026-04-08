import React from 'react';

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 pb-1">
      <div className="flex items-center gap-4 min-w-0">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/15 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(79,142,247,0.1)]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-[0.08em] text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground font-body mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
