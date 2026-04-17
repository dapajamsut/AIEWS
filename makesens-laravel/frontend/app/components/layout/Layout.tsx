// frontend/app/components/layout/Layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import axios from "axios";
import { 
  LayoutDashboard, 
  Radio, 
  Video, 
  Brain, 
  Droplets, 
  Menu, 
  X, 
  LogOut,
  Sun,
  Moon,
  Settings
} from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/sensors", label: "Sensor", icon: Radio },
    { path: "/camera", label: "Camera", icon: Video },
    { path: "/ai-prediction", label: "AI Prediction", icon: Brain },
    { path: "/threshold", label: "Threshold", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:8002/api/logout",
        {},
        { withCredentials: true }
      );
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-blue-600 rounded-lg shadow-blue-200 dark:shadow-blue-900 shadow-lg">
              <Droplets className="text-white size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">MakeSens</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-widest mt-1 uppercase">AIEWS Platform</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900" 
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600"
                  }`}
                >
                  <Icon className="size-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-4">
            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-between w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <Sun className="size-5 text-yellow-500" />
                  ) : (
                    <Moon className="size-5 text-blue-600" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </span>
                </div>
                <div className={`w-8 h-4 rounded-full p-1 transition-colors ${theme === "dark" ? "bg-blue-600" : "bg-gray-300"}`}>
                  <div className={`w-2 h-2 bg-white rounded-full transition-transform ${theme === "dark" ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>
            )}

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Sistem Monitoring Air</p>
              <p className="text-[10px] text-blue-400 dark:text-blue-500 mt-1">Version 1.0.0</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors font-medium text-sm"
            >
              <LogOut className="size-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Navbar */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Droplets className="text-blue-600 size-5" />
            <span className="font-bold text-gray-900 dark:text-white">MakeSens</span>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {isOpen ? <X className="size-5 dark:text-white" /> : <Menu className="size-5 dark:text-white" />}
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}