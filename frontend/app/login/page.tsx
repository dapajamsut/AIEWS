"use client";

import { useRef, useState, useEffect } from "react";
import axios from "axios";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  Droplets,
  AlertTriangle,
  User,
  Building2,
  Phone,
  IdCard,
  FileText,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Info,
  X,
} from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";

const ADMIN_WA_PHONE = "6285717085498";

type View = "login" | "register" | "register-success";

export default function LoginPage() {
  // ===== View =====
  const [view, setView] = useState<View>("login");

  // ===== Login state =====
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState<number>(0);

  // Check localStorage on mount
  useEffect(() => {
    const expiresStr = localStorage.getItem("login_lockout_expires");
    if (expiresStr) {
      const expiresAt = parseInt(expiresStr, 10);
      const now = Date.now();
      if (expiresAt > now) {
        setLockoutTimeRemaining(Math.ceil((expiresAt - now) / 1000));
      } else {
        localStorage.removeItem("login_lockout_expires");
      }
    }
  }, []);

  // Handle countdown timer
  useEffect(() => {
    if (lockoutTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockoutTimeRemaining((prev) => {
        if (prev <= 1) {
          localStorage.removeItem("login_lockout_expires");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutTimeRemaining]);

  // ===== Register state =====
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regInstansi, setRegInstansi] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regNIP, setRegNIP] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regFile, setRegFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BACKEND_URL = "http://localhost:8000";

  // -------------------------------------------------------------------
  // LOGIN — pakai EMAIL (sesuai backend Laravel)
  // -------------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!email.trim() || !password.trim()) {
      setLoginError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/login`,
        { email, password },
        { headers: { Accept: "application/json", "Content-Type": "application/json" } }
      );
      if (response.status === 200) {
        localStorage.setItem("auth_token", response.data.token);
        localStorage.setItem("auth_user", JSON.stringify(response.data.user));
        localStorage.setItem("login_time", Date.now().toString());
        document.cookie = "session_active=true; path=/";
        window.location.href = "/";
      }
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.is_locked_out && data?.retry_after) {
        const seconds = parseInt(data.retry_after, 10);
        setLockoutTimeRemaining(seconds);
        localStorage.setItem("login_lockout_expires", (Date.now() + seconds * 1000).toString());
      }
      const msg =
        data?.message ||
        data?.errors?.email?.[0] ||
        error.message ||
        "Login gagal. Periksa email dan password Anda.";
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleContactAdmin = () => {
    const message = "Halo, saya butuh bantuan akses untuk MakeSens Early Warning System.";
    const url = `https://wa.me/${ADMIN_WA_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // -------------------------------------------------------------------
  // REGISTER — pakai FormData ke Laravel
  // -------------------------------------------------------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    setSendError("");
    const file = e.target.files?.[0] || null;
    if (!file) {
      setRegFile(null);
      return;
    }

    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setFileError("Ukuran surat permohonan terlalu besar. Maksimal 5 MB.");
      e.target.value = "";
      setRegFile(null);
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setFileError("Format surat harus PDF, JPG, atau PNG.");
      e.target.value = "";
      setRegFile(null);
      return;
    }
    setRegFile(file);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setSendError("");

    const hasEmpty = !regName || !regUsername || !regInstansi || !regEmail || !regNIP || !regPhone;
    if (hasEmpty) return;
    if (!regFile) {
      setFileError("Surat permohonan wajib diunggah.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setSendError("Format email tidak valid.");
      return;
    }
    if (!agreePrivacy) return;

    setIsSending(true);
    try {
      const fd = new FormData();
      fd.append("name",     regName);
      fd.append("username", regUsername);
      fd.append("instansi", regInstansi);
      fd.append("email",    regEmail);
      fd.append("nip",      regNIP);
      fd.append("phone",    regPhone);
      fd.append("letter",   regFile);

      const res = await axios.post(
        `${BACKEND_URL}/api/access-requests`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data", Accept: "application/json" },
          timeout: 60000,
        }
      );
      console.log("✅ Permohonan terkirim:", res.data);

      setRegName(""); setRegUsername(""); setRegInstansi("");
      setRegEmail(""); setRegNIP(""); setRegPhone("");
      setRegFile(null);
      setAgreePrivacy(false);
      setSubmitted(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setView("register-success");

      if (!res.data?.email_sent) {
        console.warn("⚠️ Email ke admin gagal dikirim:", res.data?.email_error);
      }
    } catch (err: any) {
      console.error("❌ Register error:", err);
      let detail = "";
      if (err?.response?.data) {
        const d = err.response.data;
        if (d?.errors) {
          const first = Object.values(d.errors)[0] as any;
          detail = Array.isArray(first) ? first[0] : String(first);
        } else {
          detail = d?.message || JSON.stringify(d);
        }
      } else if (err?.message) {
        detail = err.message;
      } else {
        try { detail = JSON.stringify(err); } catch { detail = String(err); }
      }
      setSendError(`Gagal mengirim permohonan: ${detail || "kesalahan tidak diketahui"}.`);
    } finally {
      setIsSending(false);
    }
  };

  // ===================================================================
  // RENDER
  // ===================================================================
  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden flex flex-col md:flex-row">
      {/* ===== LEFT — Visual ===== */}
      <div className="hidden md:flex md:w-1/2 md:h-screen relative bg-gradient-to-br from-blue-900 via-blue-800 to-red-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)",
            }}
          ></div>
        </div>

        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1555899434-94d1368aa7af?auto=format&fit=crop&w=1600&q=80')",
          }}
        ></div>

        <div className="absolute inset-0 bg-blue-900/75"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-transparent to-blue-950/40"></div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white text-center">
          <div
            className="bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl p-6 shadow-2xl mb-10 flex items-center justify-center"
            style={{ width: 120, height: 120 }}
          >
            <Droplets className="w-16 h-16 text-blue-200" strokeWidth={1.5} />
          </div>

          <h1 className="text-4xl xl:text-5xl font-black uppercase tracking-wide leading-tight mb-4">
            MakeSens
            <br />
            Early Warning System
          </h1>

          <p className="text-blue-100 text-base max-w-xs leading-relaxed mb-12">
            Sistem monitoring dan peringatan dini banjir berbasis sensor real-time
          </p>

          <div className="w-16 h-0.5 bg-white/30 mb-6"></div>

          <p className="text-blue-200 text-sm">PBL Semester 6 - TMJ 6A</p>
          <p className="text-blue-300 text-xs mt-1">2026</p>
        </div>
      </div>

      {/* ===== RIGHT — Form Content ===== */}
      <div className="flex-1 md:h-screen md:overflow-y-auto flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="md:hidden mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="bg-blue-100 rounded-xl p-3">
                <Droplets className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MakeSens</h1>
            <p className="text-gray-600 text-sm">Early Warning System</p>
          </div>

          {/* ============== LOGIN ============== */}
          {view === "login" && (
            <>
              <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                      <Lock className="w-10 h-10" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-2">Selamat Datang</h2>
                  <p className="text-center text-blue-100 text-sm">
                    Masuk untuk accessing dashboard sistem
                  </p>
                </div>

                <div className="p-8">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          autoComplete="username"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 pr-4 py-6 bg-gray-50 border-gray-200 rounded-xl"
                          placeholder="nama@instansi.go.id"
                          disabled={loading || lockoutTimeRemaining > 0}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 pr-12 py-6 bg-gray-50 border-gray-200 rounded-xl"
                          placeholder="Masukkan password Anda"
                          disabled={loading || lockoutTimeRemaining > 0}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

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
                      <button
                        type="button"
                        onClick={handleContactAdmin}
                        className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                      >
                        Lupa password?
                      </button>
                    </div>

                    {loginError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs text-red-700">{loginError}</p>
                      </div>
                    )}

                    {lockoutTimeRemaining > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 animate-pulse">
                        <div className="bg-amber-100 rounded-lg p-2 h-9 w-9 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-900">Akses Login Ditangguhkan</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Terlalu banyak percobaan masuk yang salah. Silakan tunggu selama{" "}
                            <strong className="font-bold text-amber-900">
                              {Math.floor(lockoutTimeRemaining / 60)} menit {lockoutTimeRemaining % 60} detik
                            </strong>.
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || lockoutTimeRemaining > 0}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Authenticating...
                        </>
                      ) : lockoutTimeRemaining > 0 ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Terkunci...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" /> Login
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">atau</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setView("register");
                      setSubmitted(false);
                      setSendError("");
                      setFileError("");
                    }}
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 py-6 rounded-xl transition-all"
                  >
                    <User className="w-5 h-5 mr-2" /> Daftar Akses Baru
                  </Button>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 px-8 py-4">
                  <p className="text-center text-sm text-gray-500">PBL Semester 6 - TMJ 6A</p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Butuh bantuan?{" "}
                  <button
                    onClick={handleContactAdmin}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Hubungi Administrator
                  </button>
                </p>
              </div>

              <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
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
            </>
          )}

          {/* ============== REGISTER ============== */}
          {view === "register" && (
            <>
              <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                      <User className="w-10 h-10" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-2">Permohonan Akses</h2>
                  <p className="text-center text-blue-100 text-sm">
                    Isi data lengkap untuk mengajukan akses sistem
                  </p>
                </div>

                <div className="mx-6 mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <Shield className="w-4 h-4 text-amber-600 inline-block align-text-bottom mr-1.5" />
                    Akses sistem hanya diberikan kepada pengguna yang telah diverifikasi oleh
                    administrator. Anda akan menerima email konfirmasi beserta kredensial login
                    setelah permohonan disetujui.
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed pt-2 border-t border-amber-200/60 font-semibold">
                    ⏱ Permohonan akan diproses paling lambat <strong>5 hari kerja</strong> sejak data diterima.
                  </p>
                </div>

                <div className="p-6">
                  <form onSubmit={handleRegister} className="space-y-4" noValidate>
                    {/* Nama Lengkap */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-700 font-medium text-sm">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          name="applicant_name"
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className={`pl-11 bg-gray-50 border-gray-200 rounded-xl ${
                            submitted && !regName ? "border-red-400 focus:ring-red-400" : ""
                          }`}
                          placeholder="Nama sesuai identitas"
                        />
                      </div>
                      {submitted && !regName && (
                        <p className="text-xs text-red-500">Nama lengkap wajib diisi.</p>
                      )}
                    </div>

                    {/* Username */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-700 font-medium text-sm">
                        Username <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                          @
                        </span>
                        <Input
                          name="applicant_username"
                          type="text"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value.replace(/\s/g, ""))}
                          className={`pl-9 bg-gray-50 border-gray-200 rounded-xl ${
                            submitted && !regUsername ? "border-red-400 focus:ring-red-400" : ""
                          }`}
                          placeholder="username_anda"
                        />
                      </div>
                      {submitted && !regUsername ? (
                        <p className="text-xs text-red-500">Username wajib diisi.</p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Username yang Anda usulkan untuk akun login.
                        </p>
                      )}
                    </div>

                    {/* Instansi */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-700 font-medium text-sm">
                        Instansi / Unit Kerja <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          name="applicant_instansi"
                          type="text"
                          value={regInstansi}
                          onChange={(e) => setRegInstansi(e.target.value)}
                          className={`pl-11 bg-gray-50 border-gray-200 rounded-xl ${
                            submitted && !regInstansi ? "border-red-400 focus:ring-red-400" : ""
                          }`}
                          placeholder="Nama instansi atau unit kerja"
                        />
                      </div>
                      {submitted && !regInstansi && (
                        <p className="text-xs text-red-500">Instansi wajib diisi.</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-700 font-medium text-sm">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          name="applicant_email"
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className={`pl-11 bg-gray-50 border-gray-200 rounded-xl ${
                            submitted && !regEmail ? "border-red-400 focus:ring-red-400" : ""
                          }`}
                          placeholder="email@instansi.go.id"
                        />
                      </div>
                      {submitted && !regEmail && (
                        <p className="text-xs text-red-500">Email wajib diisi.</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Kredensial login akan dikirim ke email ini setelah disetujui.
                      </p>
                    </div>

                    {/* NIP */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-700 font-medium text-sm">
                        Nomor ID Pegawai / NIP <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          name="applicant_nip"
                          type="text"
                          value={regNIP}
                          onChange={(e) => setRegNIP(e.target.value)}
                          className={`pl-11 bg-gray-50 border-gray-200 rounded-xl ${
                            submitted && !regNIP ? "border-red-400 focus:ring-red-400" : ""
                          }`}
                          placeholder="Nomor ID pegawai"
                        />
                      </div>
                      {submitted && !regNIP && (
                        <p className="text-xs text-red-500">Nomor ID pegawai wajib diisi.</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-700 font-medium text-sm">
                        Nomor Telepon <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          name="applicant_phone"
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className={`pl-11 bg-gray-50 border-gray-200 rounded-xl ${
                            submitted && !regPhone ? "border-red-400 focus:ring-red-400" : ""
                          }`}
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>
                      {submitted && !regPhone && (
                        <p className="text-xs text-red-500">Nomor telepon wajib diisi.</p>
                      )}
                    </div>

                    {/* Surat Permohonan */}
                    <div className="space-y-1.5">
                      <Label className="text-gray-700 font-medium text-sm">
                        Surat Permohonan Akses <span className="text-red-500">*</span>
                      </Label>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                          Surat resmi dari <b>instansi/unit kerja</b> Anda yang ditujukan
                          kepada pengelola sistem MakeSens dan ditandatangani oleh{" "}
                          <b>atasan/pimpinan instansi</b> (mis. Kepala Seksi/Bidang). Format:
                          PDF, JPG, atau PNG. Maksimal 5 MB.
                        </p>
                      </div>

                      <label
                        className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all ${
                          (submitted && !regFile) || fileError
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                        }`}
                      >
                        <FileText
                          className={`w-8 h-8 mb-2 ${
                            (submitted && !regFile) || fileError ? "text-red-400" : "text-gray-400"
                          }`}
                        />
                        {regFile ? (
                          <span className="text-sm text-blue-700 font-medium break-all text-center">
                            {regFile.name}{" "}
                            <span className="text-gray-500 font-normal">
                              ({(regFile.size / 1024).toFixed(1)} KB)
                            </span>
                          </span>
                        ) : (
                          <>
                            <span className="text-sm text-gray-600 font-medium">
                              Klik untuk upload file
                            </span>
                            <span className="text-xs text-gray-400 mt-1">
                              PDF, JPG, PNG (maks. 5 MB)
                            </span>
                          </>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          onChange={handleFileSelect}
                        />
                      </label>
                      {((submitted && !regFile) || fileError) && (
                        <p className="text-xs text-red-500">
                          {fileError || "Surat permohonan wajib diunggah."}
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 pt-1">
                      Kolom bertanda <span className="text-red-500 font-semibold">*</span> wajib diisi.
                    </p>

                    {/* Privacy Checkbox */}
                    <div
                      className={`rounded-xl border p-4 ${
                        submitted && !agreePrivacy
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={agreePrivacy}
                          onChange={(e) => setAgreePrivacy(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
                        />
                        <span className="flex-1 min-w-0 text-sm text-gray-700 leading-relaxed">
                          Saya telah membaca dan menyetujui{" "}
                          <button
                            type="button"
                            onClick={() => setShowPrivacyModal(true)}
                            className="text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2"
                          >
                            Kebijakan Privasi
                          </button>{" "}
                          sistem ini, termasuk penggunaan data pribadi yang saya berikan.
                        </span>
                      </label>
                      {submitted && !agreePrivacy && (
                        <p className="text-xs text-red-500 mt-2 ml-7">
                          Anda harus menyetujui Kebijakan Privasi untuk melanjutkan.
                        </p>
                      )}
                    </div>

                    {sendError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm text-red-700">{sendError}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSending}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Mengirim Permohonan...
                        </>
                      ) : (
                        "Kirim Permohonan Akses"
                      )}
                    </Button>
                  </form>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 px-8 py-4">
                  <p className="text-center text-sm text-gray-500">PBL Semester 6 - TMJ 6A</p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setView("login")}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali ke halaman login
                </button>
              </div>
            </>
          )}

          {/* ============== REGISTER SUCCESS ============== */}
          {view === "register-success" && (
            <>
              <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden">
                <div className="p-10 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="bg-green-100 rounded-full p-5">
                      <CheckCircle className="w-14 h-14 text-green-500" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Permohonan Terkirim</h2>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    Permohonan akses Anda telah kami terima. Tim administrator akan memverifikasi
                    data yang Anda kirimkan paling lambat dalam <strong className="text-gray-900">5 hari kerja</strong>.
                  </p>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-6">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Jika permohonan disetujui, Anda akan menerima email berisi{" "}
                      <strong>username</strong> dan <strong>password</strong> ke alamat email yang
                      telah didaftarkan. Harap jaga kerahasiaan kredensial Anda dan{" "}
                      <strong>jangan bagikan kepada siapapun</strong>.
                    </p>
                  </div>
                  <Button
                    onClick={() => setView("login")}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 rounded-xl"
                  >
                    Kembali ke Login
                  </Button>
                </div>
                <div className="bg-gray-50 border-t border-gray-100 px-8 py-4">
                  <p className="text-center text-sm text-gray-500">PBL Semester 6 - TMJ 6A</p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Ada pertanyaan?{" "}
                  <button
                    onClick={handleContactAdmin}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Hubungi Administrator
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== PRIVACY MODAL ===== */}
      {showPrivacyModal && (
        <div
          onClick={() => setShowPrivacyModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
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
              width: "min(640px, 100%)",
              maxHeight: "calc(100dvh - 32px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              minWidth: 0,
            }}
          >
            {/* === HEADER === */}
            <div
              style={{ flex: "0 0 auto", position: "relative", overflow: "hidden" }}
              className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 px-5 sm:px-6 py-4 text-white"
            >
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,.1) 20px, rgba(255,255,255,.1) 40px)",
                }}
              />
              <div className="relative flex items-center gap-3" style={{ minWidth: 0 }}>
                <div className="size-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-blue-200 font-semibold mb-0.5">
                    Dokumen Resmi
                  </p>
                  <h3 className="font-bold text-lg leading-tight">Kebijakan Privasi</h3>
                </div>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="size-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center shrink-0"
                  aria-label="Tutup"
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* === META STRIP === */}
            <div
              style={{ flex: "0 0 auto" }}
              className="bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-2 flex items-center justify-between gap-3 text-[11px] text-slate-600 flex-wrap"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">No. Dok</span>
                  <span className="font-semibold text-slate-700">PRV-EWS-001</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">Versi</span>
                  <span className="font-semibold text-slate-700">1.0</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Berlaku</span>
                <span className="font-semibold text-slate-700">26 Mei 2026</span>
              </div>
            </div>

            {/* === BODY === */}
            <div
              style={{
                flex: "1 1 auto",
                overflowY: "auto",
                overflowX: "hidden",
                minHeight: 0,
                minWidth: 0,
                background: "rgba(248,250,252,0.4)",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
              className="px-5 sm:px-6 py-5"
            >
              {/* Pembukaan */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm" style={{ minWidth: 0 }}>
                <p className="text-[13px] text-slate-600 italic leading-relaxed">
                  Dokumen ini menjelaskan bagaimana <strong className="text-slate-900 not-italic">MakeSens Early Warning System</strong> mengumpulkan, menggunakan, dan melindungi data pribadi pemohon akses sistem. Dengan menyetujui kebijakan ini, Anda menyatakan telah membaca dan memahami seluruh ketentuan di bawah.
                </p>
              </div>

              {/* Sections */}
              {[
                {
                  title: "Data yang Kami Kumpulkan",
                  body: (
                    <>
                      <p>Dalam proses pendaftaran akses, kami mengumpulkan data berikut:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 marker:text-blue-500">
                        <li>Nama lengkap dan username yang diajukan</li>
                        <li>Nama instansi atau unit kerja</li>
                        <li>Alamat surat elektronik (email)</li>
                        <li>Nomor Induk Pegawai (NIP) atau ID Pegawai</li>
                        <li>Nomor telepon aktif</li>
                        <li>Surat permohonan resmi dari instansi</li>
                      </ul>
                    </>
                  ),
                },
                {
                  title: "Tujuan Penggunaan Data",
                  body: (
                    <>
                      <p>Data yang Anda berikan digunakan semata-mata untuk:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 marker:text-blue-500">
                        <li>Verifikasi identitas dan kewenangan akses sistem</li>
                        <li>Pengelolaan akun pengguna dalam sistem EWS</li>
                        <li>Komunikasi resmi terkait status permohonan dan informasi sistem</li>
                        <li>Keperluan audit dan keamanan sistem</li>
                      </ul>
                    </>
                  ),
                },
                {
                  title: "Keamanan dan Penyimpanan Data",
                  body: (
                    <p>
                      Data Anda disimpan secara aman pada infrastruktur internal yang hanya dapat diakses oleh administrator sistem yang berwenang. Kami tidak menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga manapun di luar keperluan operasional sistem ini.
                    </p>
                  ),
                },
                {
                  title: "Kerahasiaan Kredensial",
                  body: (
                    <p>
                      Username dan password yang diberikan kepada Anda bersifat rahasia dan menjadi tanggung jawab pribadi Anda. <strong className="text-slate-900">Jangan bagikan kredensial login kepada siapapun</strong>, termasuk sesama rekan kerja. Setiap aktivitas yang dilakukan menggunakan akun Anda menjadi tanggung jawab pribadi pemegang akun.
                    </p>
                  ),
                },
                {
                  title: "Hak Pengguna",
                  body: (
                    <p>
                      Anda berhak meminta pembaruan atau penghapusan data pribadi Anda dengan menghubungi administrator sistem melalui saluran resmi yang tersedia. Pengguna juga berhak menarik persetujuan kapan saja, dengan konsekuensi pencabutan akses sistem.
                    </p>
                  ),
                },
                {
                  title: "Waktu Pemrosesan Permohonan",
                  body: (
                    <p>
                      Permohonan akses akan ditinjau dan diverifikasi oleh administrator paling lambat <strong className="text-slate-900">5 (lima) hari kerja</strong> sejak data diterima melalui formulir pendaftaran. Hasil verifikasi akan dikirimkan ke alamat email yang didaftarkan, baik dalam bentuk persetujuan maupun penolakan.
                    </p>
                  ),
                },
                {
                  title: "Perubahan Kebijakan",
                  body: (
                    <p>
                      Kebijakan ini dapat diperbarui sewaktu-waktu. Pengguna akan diberi tahu melalui email apabila terdapat perubahan yang signifikan terkait pengelolaan data pribadi mereka.
                    </p>
                  ),
                },
              ].map((section, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl p-4 mb-3 last:mb-0 shadow-sm"
                  style={{ minWidth: 0 }}
                >
                  <div className="flex items-center gap-2.5 mb-2" style={{ minWidth: 0 }}>
                    <span className="inline-flex items-center justify-center size-7 rounded-lg bg-blue-600 text-white font-bold text-[11px] shrink-0 shadow-sm">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug" style={{ minWidth: 0 }}>
                      {section.title}
                    </h4>
                  </div>
                  <div className="text-[13px] text-slate-700 leading-relaxed" style={{ minWidth: 0 }}>
                    {section.body}
                  </div>
                </div>
              ))}

              {/* Signature */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex items-end justify-between gap-3 text-[11px] text-slate-500 flex-wrap">
                <div style={{ minWidth: 0 }}>
                  <p className="font-semibold text-slate-700">Tim Administrator</p>
                  <p>MakeSens Early Warning System</p>
                </div>
                <div className="text-right shrink-0">
                  <p>Halaman 1 dari 1</p>
                  <p>PBL Semester 6 — TMJ 6A</p>
                </div>
              </div>
            </div>

            {/* === FOOTER === */}
            <div style={{ flex: "0 0 auto" }} className="border-t border-slate-200 px-5 sm:px-6 py-3 flex items-center gap-2 bg-white">
              <Button
                variant="outline"
                onClick={() => setShowPrivacyModal(false)}
                className="border-slate-200 text-slate-600 rounded-xl px-4 ml-auto"
                type="button"
              >
                Tutup
              </Button>
              <Button
                onClick={() => {
                  setAgreePrivacy(true);
                  setShowPrivacyModal(false);
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl px-5"
                type="button"
              >
                Saya Setuju
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}