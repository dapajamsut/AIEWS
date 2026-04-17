"use client";

import { useState } from "react";
import axios from "axios";
import { Lock, Mail, Eye, EyeOff, Shield, Droplets, AlertTriangle } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("nabielischak7@gmail.com");
  const [password, setPassword] = useState("pblsem5");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = "http://localhost:8002";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/login`,
        { email, password },
        { headers: { Accept: "application/json", "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        // Simpan token & user ke localStorage
        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("auth_user", JSON.stringify(response.data.user));
        window.location.href = "/";
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.response?.data?.errors?.email?.[0] || error.message || "Login gagal. Periksa email dan password.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Direct WhatsApp - tanpa alert
  const handleContactAdmin = () => {
    const phone = "6285717085498"; // 085717085498 -> 6285717085498
    const message = "Halo, saya butuh bantuan akses untuk MakeSens EWS";
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-900 via-blue-800 to-red-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)'
          }}></div>
        </div>

        {/* Jakarta Cityscape Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1734939248181-4e0b78a25f4f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxKYWthcnRhJTIwY2l0eXNjYXBlJTIwbW9kZXJuJTIwc2t5bGluZXxlbnwxfHx8fDE3NzQ5NzA0NDd8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Jakarta Cityscape"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/50 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Top Logo & Branding */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3">
                <Droplets className="w-8 h-8 text-blue-200" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">MakeSens</h1>
                <p className="text-blue-200 text-sm">Early Warning System</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-2">
                  <AlertTriangle className="w-5 h-5 text-red-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Sistem Peringatan Dini</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Platform monitoring banjir terintegrasi untuk wilayah Politeknik Negeri Jakarta
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle - Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="bg-blue-500/20 rounded-lg p-3">
                <Shield className="w-6 h-6 text-blue-200" />
              </div>
              <div>
                <p className="font-semibold">Keamanan Terjamin</p>
                <p className="text-blue-200 text-sm">Sistem terenkripsi end-to-end</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="bg-blue-500/20 rounded-lg p-3">
                <Droplets className="w-6 h-6 text-blue-200" />
              </div>
              <div>
                <p className="font-semibold">Real-time Monitoring</p>
                <p className="text-blue-200 text-sm">Data aktual setiap saat</p>
              </div>
            </div>
          </div>

          {/* Bottom - Government Branding */}
          <div className="border-t border-white/20 pt-6">
            <div className="flex items-center gap-2 text-sm text-blue-200">
              <div className="w-1 h-1 rounded-full bg-blue-400"></div>
              <p>Politeknik Negeri Jakarta</p>
            </div>
            <p className="text-xs text-blue-300 mt-2">
              Dinas Sumber Daya Air - Sistem PBL Flood Monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="bg-blue-100 rounded-xl p-3">
                <Droplets className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MakeSens</h1>
            <p className="text-gray-600 text-sm">Early Warning System</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden">
            {/* Card Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <Lock className="w-10 h-10" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center mb-2">Selamat Datang</h2>
              <p className="text-center text-blue-100 text-sm">
                PBL Flood Monitoring System
              </p>
            </div>

            {/* Form Content */}
            <div className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 pr-4 py-6 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 py-6 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                      Ingat saya
                    </span>
                  </label>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  {loading ? "Authenticating..." : "Login"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  {/* kosong */}
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">
                      Sistem Aman & Terverifikasi
                    </p>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      Platform ini dilindungi dengan standar keamanan tertinggi untuk menjaga data Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-8 py-4">
              <p className="text-center text-sm text-gray-500">
                PBL Semester 6 - TMJ 6A (Early Warning System)
              </p>
            </div>
          </div>

          {/* Bottom Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Belum punya akses?{' '}
              <button
                onClick={handleContactAdmin}  // ✅ menggunakan direct WA
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Hubungi Administrator
              </button>
            </p>
          </div>

          {/* Emergency Contact */}
          <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-lg p-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Hotline Darurat Banjir</p>
                <p className="text-xs text-red-700">Call Center: 112 (24 Jam)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}