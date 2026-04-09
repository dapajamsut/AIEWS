import { Outlet, Link, useLocation } from "react-router";
import { useTheme } from "../context/ThemeContext";
import { 
  LayoutDashboard, 
  Radio, 
  CloudRain, 
  Camera, 
  Sun, 
  Moon,
  Droplets
} from "lucide-react";

export function Layout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/sensors", icon: Radio, label: "Sensors" },
    { path: "/weather-ai", icon: CloudRain, label: "Weather AI" },
    { path: "/camera", icon: Camera, label: "Camera" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <Droplets className="w-8 h-8 text-blue-600 dark:text-blue-500 mr-3" />
          <div>
            <h1 className="font-bold text-xl text-slate-900 dark:text-white">MakeSens</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Flood Monitoring</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center px-4 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-5 h-5 mr-2" />
                <span className="font-medium">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5 mr-2" />
                <span className="font-medium">Light Mode</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
