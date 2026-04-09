import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, LogOut, User, Clock, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Left - Menu Button (Mobile) & Time */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile Menu Button */}
          {onMenuClick && (
            <Button
              variant="outline"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
            <Clock className="w-5 h-5 hidden sm:block" />
            <div>
              <div className="text-base sm:text-lg font-semibold">{formatTime(currentTime)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">{formatDate(currentTime)}</div>
            </div>
          </div>
        </div>

        {/* Right - Theme Toggle & User Menu */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-normal">{user?.email}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-1">{user?.instansi}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}