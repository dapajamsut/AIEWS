"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Download, FileText, Filter, Calendar, Clock, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Timer } from "lucide-react";
import { Card } from "./ui/card";

// ─── Tipe ─────────────────────────────────────────────────────────────────────
interface SensorValues {
  "ANEMO-01": number | null;
  "TIP-01":   number | null;
  "WATER-01": number | null;
  "BME-TEMP": number | null;
  "BME-HUM":  number | null;
  "BME-PRES": number | null;
}

interface LogSession {
  batch_id:    string | null;
  time:        string;
  created_at:  string;
  siaga_level: string | null;
  region_name: string | null;
  status:      "NORMAL" | "WARNING";
  weather:     { temp?: number; description?: string; main?: string } | null;
  sensors:     SensorValues;
}

interface ExportFile {
  filename: string;
  date:     string;
  size_kb:  number;
  url:      string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const fmtVal = (v: number | null, decimals = 1) =>
  v !== null ? Number(v).toFixed(decimals) : "-";

const siagaStyle = (level: string | null) => {
  if (level === "SIAGA 1") return "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300";
  if (level === "SIAGA 2") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300";
  return "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300";
};

// ─── Komponen ─────────────────────────────────────────────────────────────────
interface LogTableProps {
  /** Interval logging dalam menit (dari settings pencatatan otomatis). 0 = tidak ada auto-refresh. */
  loggingInterval?: number;
  /** Naikkan nilai ini untuk memicu refresh segera (misalnya setelah save manual). */
  refreshTrigger?: number;
}

export function LogTable({ loggingInterval = 0, refreshTrigger = 0 }: LogTableProps) {
  // 🔥 Hitung "today" secara dinamis agar selalu update ketika hari berganti
  const getTodayWIB = () =>
    new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

  const [today, setToday] = useState(getTodayWIB);
  const [date, setDate]       = useState(getTodayWIB);
  const [from, setFrom]       = useState("00:00");
  const [to,   setTo]         = useState("23:59");
  const [sessions, setSessions] = useState<LogSession[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [exports,  setExports]  = useState<ExportFile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  /** Detik tersisa hingga auto-refresh berikutnya. null = tidak ada auto-refresh. */
  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);
  const autoRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSessions = sessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Kembalikan ke page 1 setiap kali data baru dimuat
  useEffect(() => { setCurrentPage(1); }, [sessions]);

  // 🔥 Pantau pergantian hari — update "today" dan reset filter ke hari baru jika user
  // sedang melihat tanggal hari ini (bukan tanggal lama yang dipilih manual).
  useEffect(() => {
    const tick = setInterval(() => {
      const newToday = getTodayWIB();
      setToday(prev => {
        if (newToday !== prev) {
          // Hari sudah berganti — geser filter ke tanggal baru
          setDate(d => d === prev ? newToday : d);
          return newToday;
        }
        return prev;
      });
    }, 60_000); // cek setiap menit
    return () => clearInterval(tick);
  }, []);

  // ── Fetch sesi log ──
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/logs?date=${date}&from=${from}&to=${to}`,
        { headers: { apikey: "pikel2" } }
      );
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
      }
    } catch (err) {
      console.error("Fetch sessions error:", err);
    } finally {
      setLoading(false);
    }
  }, [date, from, to]);

  // ── Fetch daftar ekspor harian ──
  const fetchExports = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/logs/exports`, {
        headers: { apikey: "pikel2" }
      });
      if (res.ok) setExports(await res.json());
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchSessions(); fetchExports(); }, [fetchSessions]);

  // ── Auto-refresh sesuai interval logging ──
  useEffect(() => {
    // Bersihkan timer lama
    if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    if (countdownTimerRef.current)   clearInterval(countdownTimerRef.current);

    if (loggingInterval <= 0) {
      setNextRefreshIn(null);
      return;
    }

    const intervalMs = loggingInterval * 60 * 1000; // menit → ms
    let remaining = loggingInterval * 60;           // detik
    setNextRefreshIn(remaining);

    // Countdown setiap detik
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setNextRefreshIn(remaining);
      if (remaining <= 0) remaining = loggingInterval * 60; // reset countdown
    }, 1000);

    // Refresh data sesuai interval
    autoRefreshTimerRef.current = setInterval(() => {
      fetchSessions();
      remaining = loggingInterval * 60;
      setNextRefreshIn(remaining);
    }, intervalMs);

    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
      if (countdownTimerRef.current)   clearInterval(countdownTimerRef.current);
    };
  }, [loggingInterval, fetchSessions]);

  // ── Refresh segera saat refreshTrigger berubah (save manual) ──
  useEffect(() => {
    if (refreshTrigger === 0) return; // abaikan nilai awal
    fetchSessions();
    // Reset countdown setelah save manual
    if (loggingInterval > 0) {
      setNextRefreshIn(loggingInterval * 60);
    }
  }, [refreshTrigger]);

  // ── Export CSV dari filter saat ini ──
  const handleExportFiltered = () => {
    if (sessions.length === 0) {
      alert("Tidak ada data untuk diekspor pada rentang waktu ini.");
      return;
    }

    const exportAt = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta", day: "2-digit", month: "2-digit",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const headers = [
      "No", "Waktu", "Level SIAGA", "Lokasi",
      "Suhu Cuaca (°C)", "Kondisi Cuaca",
      "Kec. Angin / ANEMO-01 (m/s)",
      "Curah Hujan / TIP-01 (mm)",
      "Tinggi Air / WATER-01 (cm)",
      "Suhu Udara / BME-TEMP (°C)",
      "Kelembapan / BME-HUM (%)",
      "Tekanan Udara / BME-PRES (hPa)",
    ];

    const sensorOrder: (keyof SensorValues)[] = [
      "ANEMO-01", "TIP-01", "WATER-01", "BME-TEMP", "BME-HUM", "BME-PRES",
    ];

    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

    const metaLines = [
      ["LOG PENCATATAN SISTEM MONITORING BANJIR"],
      [`Tanggal: ${date}`],
      [`Rentang waktu: ${from} - ${to}`],
      [`Diekspor pada: ${exportAt}`],
      [`Jumlah sesi: ${sessions.length}`],
      [],
    ];

    const dataRows = sessions.map((s, i) => [
      i + 1,
      s.time,
      s.siaga_level ?? "-",
      s.region_name ?? "-",
      s.weather?.temp ?? "-",
      s.weather?.description ?? "-",
      ...sensorOrder.map(c => fmtVal(s.sensors[c])),
    ]);

    const lines = [
      ...metaLines.map(r => r.map(esc).join(",")),
      headers.map(esc).join(","),
      ...dataRows.map(r => r.map(esc).join(",")),
    ];

    const csv  = lines.join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Log_Sensor_${date}_${from.replace(":", "")}-${to.replace(":", "")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-md">
            <FileText className="size-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
              Riwayat Log Sensor
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              1 baris = 1 sesi pencatatan (semua sensor dalam 1 baris)
            </p>
            {/* Info interval & countdown */}
            {loggingInterval > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                  <Timer className="size-3" />
                  Auto-refresh setiap {loggingInterval >= 60
                    ? `${Math.floor(loggingInterval / 60)}j ${loggingInterval % 60 > 0 ? `${loggingInterval % 60}m` : ''}`.trim()
                    : `${loggingInterval} menit`}
                </span>
                {nextRefreshIn !== null && (
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono tabular-nums">
                    (refresh dalam {Math.floor(nextRefreshIn / 60).toString().padStart(2,'0')}:{(nextRefreshIn % 60).toString().padStart(2,'0')})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tombol ekspor */}
        <button
          onClick={handleExportFiltered}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition cursor-pointer"
        >
          <Download className="size-4" />
          Ekspor Filter Ini
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Filter bar ── */}
        <div className="flex flex-wrap items-end gap-3 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-slate-950">
          <div>
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
              <Calendar className="inline size-3 mr-1" />Tanggal
            </label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
              <Clock className="inline size-3 mr-1" />Dari
            </label>
            <input
              type="time"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
              <Clock className="inline size-3 mr-1" />Sampai
            </label>
            <input
              type="time"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-60 cursor-pointer"
          >
            <Filter className="size-4" />
            {loading ? "Memuat..." : "Terapkan"}
          </button>
          <button
            onClick={fetchSessions}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
            title="Perbarui"
          >
            <RefreshCw className={`size-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>

          {sessions.length > 0 && (
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
              <span className="font-bold text-gray-700 dark:text-gray-300">{sessions.length}</span> sesi ditemukan
            </span>
          )}
        </div>

        {/* ── Tabel pivot ── */}
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Header tabel — scroll horizontal */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[860px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-100 dark:border-gray-800">
                  {[
                    { label: "Waktu",      sub: null },
                    { label: "SIAGA",      sub: null },
                    { label: "Status",     sub: null },
                    { label: "Cuaca",      sub: "°C • kondisi" },
                    { label: "Angin",      sub: "ANEMO-01 (m/s)" },
                    { label: "Curah Hujan",sub: "TIP-01 (mm)" },
                    { label: "Tinggi Air", sub: "WATER-01 (cm)" },
                    { label: "Suhu Udara", sub: "BME-TEMP (°C)" },
                    { label: "Kelembapan", sub: "BME-HUM (%)" },
                    { label: "Tekanan",    sub: "BME-PRES (hPa)" },
                  ].map(({ label, sub }) => (
                    <th
                      key={label}
                      className="px-3 py-2.5 text-left font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {label}
                      {sub && <div className="text-[9px] font-normal normal-case text-gray-300 dark:text-gray-600 mt-0.5">{sub}</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <RefreshCw className="size-5 mx-auto mb-2 animate-spin text-blue-400" />
                      <p className="text-gray-400 dark:text-gray-500">Memuat data...</p>
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <FileText className="size-7 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                      <p className="font-medium text-gray-400 dark:text-gray-500">Tidak ada data pada rentang waktu ini</p>
                      <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5">Coba ubah filter atau simpan log terlebih dahulu</p>
                    </td>
                  </tr>
                ) : (
                  currentSessions.map((s, idx) => (
                    <tr
                      key={s.batch_id ?? idx}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        s.status === "WARNING" ? "bg-red-50/30 dark:bg-red-950/10" : ""
                      }`}
                    >
                      {/* Waktu */}
                      <td className="px-3 py-2 font-mono tabular-nums text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {s.time}
                      </td>
                      {/* SIAGA */}
                      <td className="px-3 py-2">
                        {s.siaga_level ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${siagaStyle(s.siaga_level)}`}>
                            {s.siaga_level}
                          </span>
                        ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      {/* Status */}
                      <td className="px-3 py-2">
                        {s.status === "WARNING" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                            <AlertTriangle className="size-2.5" /> Waspada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="size-2.5" /> Normal
                          </span>
                        )}
                      </td>
                      {/* Cuaca */}
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {s.weather?.temp !== undefined ? (
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{s.weather.temp}°C</span>
                        ) : null}
                        {s.weather?.description && (
                          <span className="ml-1 text-[10px] text-gray-400">{s.weather.description}</span>
                        )}
                        {!s.weather?.temp && "—"}
                      </td>
                      {/* Sensor values */}
                      {(["ANEMO-01", "TIP-01", "WATER-01", "BME-TEMP", "BME-HUM", "BME-PRES"] as (keyof SensorValues)[]).map(code => (
                        <td key={code} className="px-3 py-2 text-right tabular-nums font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                          {fmtVal(s.sensors[code])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Navigasi Pagination ── */}
          {sessions.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Menampilkan data <span className="font-semibold text-gray-900 dark:text-white">{startIndex + 1}</span> hingga <span className="font-semibold text-gray-900 dark:text-white">{Math.min(startIndex + ITEMS_PER_PAGE, sessions.length)}</span> dari <span className="font-semibold text-gray-900 dark:text-white">{sessions.length}</span> total
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="size-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="size-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Ekspor harian tersedia ── */}
        {exports.length > 0 && (
          <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/10 p-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
              <Download className="size-4 text-blue-500" />
              Arsip Ekspor Harian
              <span className="ml-1 text-[11px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-semibold">
                {exports.length} file
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {exports.map(f => (
                <a
                  key={f.filename}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-semibold text-blue-700 dark:text-blue-300 transition"
                >
                  <Download className="size-3" />
                  {f.date}
                  <span className="text-[10px] text-gray-400">{f.size_kb} KB</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
