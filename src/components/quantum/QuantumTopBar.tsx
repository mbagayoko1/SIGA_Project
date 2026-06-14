import React from 'react';
import { Home, Star, Flag, Bell, Search } from 'lucide-react';
import { UserProfile } from '../../types';
import QuantumBrand from './QuantumBrand';
import { cn } from '../../lib/utils';

interface QuantumTopBarProps {
  profile: UserProfile | null;
  onHome: () => void;
  notifications?: number;
  showSearch?: boolean;
}

/**
 * White top utility bar from the Quantum portal: brand on the left, a cluster
 * of utility icons + the user avatar on the right.
 */
export default function QuantumTopBar({ profile, onHome, notifications = 7, showSearch = false }: QuantumTopBarProps) {
  const initials = (profile?.displayName || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 shrink-0 bg-white border-b border-card-border flex items-center justify-between px-6 z-40 relative">
      <button onClick={onHome} className="flex items-center hover:opacity-80 transition-opacity">
        <QuantumBrand />
      </button>

      <div className="flex items-center gap-1">
        {showSearch && (
          <IconButton label="Search">
            <Search className="w-[18px] h-[18px]" />
          </IconButton>
        )}
        <IconButton label="Home" onClick={onHome}>
          <Home className="w-[18px] h-[18px]" />
        </IconButton>
        <IconButton label="Favorites">
          <Star className="w-[18px] h-[18px]" />
        </IconButton>
        <IconButton label="Flags">
          <Flag className="w-[18px] h-[18px]" />
        </IconButton>
        <IconButton label="Notifications">
          <div className="relative">
            <Bell className="w-[18px] h-[18px]" />
            {notifications > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-quantum-orange text-white text-[9px] font-black flex items-center justify-center leading-none">
                {notifications}
              </span>
            )}
          </div>
        </IconButton>
        <div className="ml-2 w-9 h-9 rounded-full bg-quantum-blue text-white flex items-center justify-center text-[12px] font-black ring-2 ring-white shadow-sm overflow-hidden">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            initials
          )}
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-quantum-blue hover:bg-quantum-blue-pale transition-colors'
      )}
    >
      {children}
    </button>
  );
}
