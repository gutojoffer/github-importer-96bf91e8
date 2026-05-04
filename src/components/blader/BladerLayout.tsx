import { ReactNode } from 'react';
import { BladerSidebar } from './BladerSidebar';
import { BladerBottomNav } from './BladerBottomNav';
import { BladerMobileTopbar } from './BladerMobileTopbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import AccountRouter from '@/components/AccountRouter';

export default function BladerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AccountRouter>
        <div className="min-h-screen flex w-full" style={{ background: '#060912' }}>
          <BladerSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <BladerMobileTopbar />
            <main className="flex-1 overflow-auto pb-[72px] md:pb-0">
              {children}
            </main>
          </div>
          <BladerBottomNav />
        </div>
      </AccountRouter>
    </ProtectedRoute>
  );
}
