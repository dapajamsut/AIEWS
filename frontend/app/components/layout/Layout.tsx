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
  Settings,
  User,
  ChevronRight,
  Mail,
  Building2,
  IdCard,
  Phone,
  Calendar,
  ShieldCheck,
  AtSign,
  CheckCircle2
} from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);

    // Auth Check for all pages wrapped in Layout
    const token = localStorage.getItem("auth_token");
    const loginTime = localStorage.getItem("login_time");
    const sessionActive = document.cookie.includes("session_active=true");

    if (!token || !loginTime || !sessionActive) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("login_time");
      window.location.href = "/login";
      return;
    }

    if (Date.now() - parseInt(loginTime) > 86400000) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("login_time");
      window.location.href = "/login";
      return;
    }

    // Load cached user info
    try {
      const cached = localStorage.getItem("auth_user");
      if (cached) setUser(JSON.parse(cached));
    } catch { /* silent */ }

    // Refresh user dari server (kalau ada update name/email)
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/user`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      })
      .then((res) => {
        if (res.data) {
          setUser(res.data);
          localStorage.setItem("auth_user", JSON.stringify(res.data));
        }
      })
      .catch(() => { /* silent — pakai cached user */ });
  }, []);

  // Fetch detail profile lengkap saat modal dibuka pertama kali
  useEffect(() => {
    if (!showAccountModal || profile) return;
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    setProfileLoading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      })
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [showAccountModal, profile]);

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
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/logout`,
        {},
        { 
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
            "Accept": "application/json"
          }
        }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("login_time");
      document.cookie = "session_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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

          <div className="mt-auto space-y-3">
            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-between w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all group"
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

            {/* === USER CARD (clickable) === */}
            <button
              onClick={() => setShowAccountModal(true)}
              className="w-full text-left bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl p-3 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
              aria-label="Lihat detail akun"
            >
              <div className="flex items-center gap-3">
                {/* Avatar dengan inisial nama */}
                <div className="size-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-200 dark:shadow-blue-950/50 shrink-0 group-hover:scale-105 transition-transform">
                  {user?.name
                    ? user.name
                        .split(" ")
                        .map((w) => w[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : <User className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                    {user?.name || "Pengguna"}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-medium mt-0.5">
                    {user?.email || "—"}
                  </p>
                </div>
                <ChevronRight className="size-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-blue-200/60 dark:border-blue-900/40">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500"></span>
                  </span>
                  Aktif
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Lihat detail →
                </span>
              </div>
            </button>

            {/* Tombol Logout terpisah di bawah user card */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-4 py-2 rounded-lg transition-colors font-semibold text-xs"
            >
              <LogOut className="size-3.5" />
              <span>Keluar</span>
            </button>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center font-medium">
              MakeSens v1.0.0
            </p>
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

        {/* Global Footer — muncul di semua halaman */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium">
              <span className="font-bold text-gray-700 dark:text-gray-300">MakeSens</span> — Early Warning System
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              PBL Semester 6 — TMJ 6A · © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>

      {/* ===== ACCOUNT DETAIL MODAL ===== */}
      {showAccountModal && (
        <div
          onClick={() => setShowAccountModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "grid",
            placeItems: "center",
            padding: "16px",
            backgroundColor: "rgba(15,23,42,0.65)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 100%)",
              maxHeight: "calc(100dvh - 32px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              minWidth: 0,
            }}
            className="dark:!bg-gray-900"
          >
            {/* Header dengan gradient + avatar */}
            <div className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 px-6 py-7 text-white shrink-0 overflow-hidden">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,.1) 20px, rgba(255,255,255,.1) 40px)",
                }}
              />
              <button
                onClick={() => setShowAccountModal(false)}
                className="absolute top-3 right-3 size-8 rounded-full bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center z-10"
                aria-label="Tutup"
              >
                <X className="size-4" />
              </button>

              <div className="relative flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {user?.name
                    ? user.name
                        .split(" ")
                        .map((w) => w[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : <User className="size-7" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-blue-200 font-semibold mb-1">
                    Detail Akun
                  </p>
                  <h3 className="font-bold text-xl leading-tight">
                    {user?.name || "Pengguna"}
                  </h3>
                  <p className="text-xs text-blue-200 mt-1 truncate">
                    {user?.email || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div
              className="overflow-y-auto overflow-x-hidden flex-1 bg-slate-50/40 dark:bg-gray-900 px-5 sm:px-6 py-5"
              style={{ minWidth: 0, minHeight: 0 }}
            >
              {profileLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="size-8 rounded-full border-[3px] border-slate-200 border-t-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status badge */}
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Akun Terverifikasi & Aktif
                      </span>
                    </div>
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  </div>

                  {/* Section: Informasi Akun */}
                  <div className="bg-white dark:bg-gray-800/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                      <span className="size-1 rounded-full bg-blue-600" />
                      <p className="text-[11px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-300">
                        Informasi Akun
                      </p>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      <ProfileRow icon={<User className="size-4" />} label="Nama Lengkap" value={profile?.name || user?.name} />
                      {profile?.profile?.username && (
                        <ProfileRow icon={<AtSign className="size-4" />} label="Username" value={profile.profile.username} mono />
                      )}
                      <ProfileRow icon={<Mail className="size-4" />} label="Email Login" value={profile?.email || user?.email} mono />
                      <ProfileRow icon={<Calendar className="size-4" />} label="Akun Dibuat" value={profile?.created_at_wib ? `${profile.created_at_wib} WIB` : "—"} />
                    </div>
                  </div>

                  {/* Section: Data Pendaftaran (kalau user daftar via form) */}
                  {profile?.profile && (
                    <div className="bg-white dark:bg-gray-800/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                        <span className="size-1 rounded-full bg-indigo-600" />
                        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-600 dark:text-slate-300">
                          Data Pendaftaran
                        </p>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        <ProfileRow icon={<Building2 className="size-4" />} label="Instansi" value={profile.profile.instansi} />
                        <ProfileRow icon={<IdCard className="size-4" />} label="NIP / ID Pegawai" value={profile.profile.nip} mono />
                        <ProfileRow icon={<Phone className="size-4" />} label="Nomor Telepon" value={profile.profile.phone} mono />
                        {profile.profile.submitted_at_wib && (
                          <ProfileRow icon={<Calendar className="size-4" />} label="Tanggal Daftar" value={`${profile.profile.submitted_at_wib} WIB`} />
                        )}
                        {profile.profile.approved_at_wib && (
                          <ProfileRow icon={<CheckCircle2 className="size-4 text-emerald-600" />} label="Disetujui Pada" value={`${profile.profile.approved_at_wib} WIB`} />
                        )}
                      </div>
                    </div>
                  )}

                  {!profile?.profile && !profileLoading && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                      Akun ini dibuat secara langsung oleh administrator (bukan via formulir
                      pendaftaran), sehingga data instansi & detail tambahan tidak tersedia.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-5 sm:px-6 py-3 flex items-center justify-between gap-2 bg-white dark:bg-gray-900">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Untuk perubahan data, hubungi administrator.
              </p>
              <button
                onClick={() => setShowAccountModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component untuk baris profile
function ProfileRow({
  icon, label, value, mono = false,
}: { icon: React.ReactNode; label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className={`text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5 ${mono ? "font-mono" : ""}`}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}