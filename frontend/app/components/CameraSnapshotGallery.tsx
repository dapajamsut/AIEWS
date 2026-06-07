// frontend/app/components/CameraSnapshotGallery.tsx
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Calendar,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  X,
  Download,
  Loader2,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  decompressBase64ToObjectUrl,
  decompressBase64ToDataUrl,
} from "../lib/imageCompression";

interface SnapshotMeta {
  id: number;
  camera_id: string;
  location: string | null;
  siaga_level: string | null;
  water_level: number | null;
  has_bounding_boxes: boolean;
  total_objects: number;
  image_width: number | null;
  image_height: number | null;
  original_size_kb: number | null;
  compressed_size_kb: number | null;
  compression_type: string;
  capture_mode: string;
  created_at: string;
  created_at_wib: string;
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api`;
const HEADERS = { apikey: "pikel2" };

// =====================================================================
// Thumbnail dengan lazy-load: fetch & dekompresi hanya saat masuk viewport.
// Kalau gambar belum terlihat, hanya placeholder yang dirender (hemat).
// =====================================================================
function LazyThumbnail({
  meta,
  onOpen,
  cache,
}: {
  meta: SnapshotMeta;
  onOpen: (m: SnapshotMeta) => void;
  cache: Map<number, string>;
}) {
  const containerRef = useRef<HTMLButtonElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(cache.get(meta.id) || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  // Untuk track apakah url ini di-create di komponen ini (perlu di-revoke).
  const ownsUrlRef = useRef(false);

  useEffect(() => {
    if (imageUrl) return; // sudah ada (mungkin dari cache)
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        if (cancelled) return;

        // Cek lagi cache (mungkin sudah ter-load oleh thumbnail lain dengan id sama)
        const cached = cache.get(meta.id);
        if (cached) {
          setImageUrl(cached);
          return;
        }

        setLoading(true);
        fetch(`${API_BASE}/camera/snapshots/${meta.id}`, {
          cache: "no-store",
          headers: HEADERS,
        })
          .then((res) => res.json())
          .then((json) => {
            if (cancelled) return;
            if (!json.success || !json.data?.image_data) {
              setError(true);
              return;
            }
            const url = decompressBase64ToObjectUrl(json.data.image_data);
            cache.set(meta.id, url);
            ownsUrlRef.current = true;
            setImageUrl(url);
          })
          .catch(() => {
            if (!cancelled) setError(true);
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      },
      { rootMargin: "200px 0px", threshold: 0.05 }
    );

    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
      // NB: object URL di-revoke saat parent unmount (lihat parent).
    };
  }, [meta.id, imageUrl, cache]);

  return (
    <button
      ref={containerRef}
      onClick={() => onOpen(meta)}
      className="group text-left rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white transition-all bg-gray-50 dark:bg-gray-800 cursor-pointer"
    >
      <div className="aspect-video relative bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Snapshot ${meta.id}`}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-red-400 text-[10px] font-medium">
            Gagal memuat
          </div>
        ) : loading ? (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <Loader2 className="size-5 animate-spin opacity-60" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <ImageIcon className="size-8 opacity-30" />
          </div>
        )}

        {/* Overlay info di kanan-bawah thumbnail */}
        {meta.water_level != null && (
          <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
            {meta.water_level} cm
          </span>
        )}
      </div>
      <div className="p-2.5 space-y-1">
        <div className="flex items-center justify-between">
          <span
            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
              meta.siaga_level === "SIAGA 1"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : meta.siaga_level === "SIAGA 2"
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            }`}
          >
            {meta.siaga_level || "-"}
          </span>
          <span
            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
              meta.capture_mode === "auto"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {meta.capture_mode}
          </span>
        </div>
        <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200 truncate">
          {meta.created_at_wib}
        </p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          {meta.compressed_size_kb?.toFixed(1)} KB
        </p>
      </div>
    </button>
  );
}

export default function CameraSnapshotGallery() {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string>("");
  const [siaga, setSiaga] = useState<string>("");
  const [mode, setMode] = useState<string>("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Cache object URL hasil dekompresi (per id).
  // Dipakai bersama oleh thumbnail & modal preview.
  const urlCacheRef = useRef<Map<number, string>>(new Map());

  // Modal preview state
  const [previewMeta, setPreviewMeta] = useState<SnapshotMeta | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "12", page: String(page) });
      if (date) params.set("date", date);
      if (siaga) params.set("siaga", siaga);
      if (mode) params.set("capture_mode", mode);

      const res = await fetch(`${API_BASE}/camera/snapshots?${params}`, {
        cache: "no-store",
        headers: HEADERS,
      });
      const json = await res.json();
      if (json.success) {
        setSnapshots(json.data || []);
        setLastPage(json.meta?.last_page || 1);
        setTotal(json.meta?.total || 0);
      }
    } catch (err) {
      console.error("Fetch snapshots error:", err);
    } finally {
      setLoading(false);
    }
  }, [date, siaga, mode, page]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const openPreview = useCallback(async (meta: SnapshotMeta) => {
    setPreviewMeta(meta);
    setPreviewLoading(true);
    setPreviewUrl(null);

    // Pakai cache kalau sudah pernah didekompresi
    const cached = urlCacheRef.current.get(meta.id);
    if (cached) {
      setPreviewUrl(cached);
      setPreviewLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/camera/snapshots/${meta.id}`, {
        cache: "no-store",
        headers: HEADERS,
      });
      const json = await res.json();
      if (json.success && json.data?.image_data) {
        const url = decompressBase64ToObjectUrl(json.data.image_data);
        urlCacheRef.current.set(meta.id, url);
        setPreviewUrl(url);
      }
    } catch (err) {
      console.error("Decompress preview error:", err);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const closePreview = () => {
    setPreviewMeta(null);
    setPreviewUrl(null);
  };

  const downloadCurrent = async () => {
    if (!previewMeta) return;
    try {
      const res = await fetch(`${API_BASE}/camera/snapshots/${previewMeta.id}`, {
        cache: "no-store",
        headers: HEADERS,
      });
      const json = await res.json();
      if (json.success && json.data?.image_data) {
        const dataUrl = decompressBase64ToDataUrl(json.data.image_data);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `snapshot_${previewMeta.id}_${previewMeta.created_at_wib.replace(
          /[/:\s]/g,
          "-"
        )}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const deleteSnapshot = async (id: number) => {
    if (!confirm("Hapus snapshot ini?")) return;
    try {
      const res = await fetch(`${API_BASE}/camera/snapshots/${id}`, {
        method: "DELETE",
        headers: HEADERS,
      });
      if (res.ok) {
        // Revoke URL cached agar tidak leak
        const cached = urlCacheRef.current.get(id);
        if (cached) {
          URL.revokeObjectURL(cached);
          urlCacheRef.current.delete(id);
        }
        setSnapshots((prev) => prev.filter((s) => s.id !== id));
        setTotal((t) => Math.max(0, t - 1));
        if (previewMeta?.id === id) closePreview();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Cleanup SEMUA object URL saat component unmount
  useEffect(() => {
    const cache = urlCacheRef.current;
    return () => {
      cache.forEach((url) => URL.revokeObjectURL(url));
      cache.clear();
    };
  }, []);

  // Saat filter berubah → page reset, cache tetap (id sama tetap valid).
  // Saat snapshot list berubah, kita TIDAK invalidasi cache (ID tetap unik).

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800/60 shadow-sm bg-white dark:bg-gray-900 rounded-2xl w-full">
      <div className="px-4 py-4 sm:px-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-sm">
              <ImageIcon className="size-4 sm:size-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-tight tracking-tight">
                Galeri Snapshot Tersimpan
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Total {total} snapshot • Tersimpan terkompresi (JPEG + Deflate) di database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 shadow-sm">
              <Calendar className="size-3.5 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
              />
            </div>
            <select
              value={siaga}
              onChange={(e) => {
                setSiaga(e.target.value);
                setPage(1);
              }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-bold rounded-xl px-2.5 py-1.5 cursor-pointer text-gray-700 dark:text-gray-200"
            >
              <option value="">Semua SIAGA</option>
              <option value="SIAGA 1">SIAGA 1</option>
              <option value="SIAGA 2">SIAGA 2</option>
              <option value="SIAGA 3">SIAGA 3</option>
            </select>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setPage(1);
              }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-bold rounded-xl px-2.5 py-1.5 cursor-pointer text-gray-700 dark:text-gray-200"
            >
              <option value="">Semua Mode</option>
              <option value="manual">Manual</option>
              <option value="auto">Otomatis</option>
            </select>
            <Button
              onClick={fetchSnapshots}
              variant="outline"
              size="sm"
              className="gap-1.5 border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold cursor-pointer h-8 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-800 dark:text-gray-200"
              disabled={loading}
            >
              <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Container dengan scroll vertikal */}
      <div className="p-4 sm:p-6">
        {snapshots.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm font-medium">
            {loading ? "Memuat..." : "Belum ada snapshot tersimpan."}
          </div>
        ) : (
          <div
            className="
              max-h-[640px] overflow-y-auto pr-2 -mr-2
              [scrollbar-width:thin]
              [scrollbar-color:#cbd5e1_transparent]
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              [&::-webkit-scrollbar-thumb]:rounded-full
              dark:[&::-webkit-scrollbar-thumb]:bg-gray-700
            "
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {snapshots.map((s) => (
                <LazyThumbnail
                  key={s.id}
                  meta={s}
                  onOpen={openPreview}
                  cache={urlCacheRef.current}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl text-xs"
            >
              Sebelumnya
            </Button>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              {page} / {lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
              className="rounded-xl text-xs"
            >
              Selanjutnya
            </Button>
          </div>
        )}
      </div>

      {/* Modal Preview */}
      {previewMeta && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Snapshot #{previewMeta.id} • {previewMeta.created_at_wib}
                </p>
                <p className="text-[11px] text-gray-500">
                  {previewMeta.image_width}×{previewMeta.image_height} • Asli ~
                  {previewMeta.original_size_kb?.toFixed(1)} KB → Tersimpan{" "}
                  {previewMeta.compressed_size_kb?.toFixed(1)} KB
                  {previewMeta.original_size_kb && previewMeta.compressed_size_kb
                    ? ` (hemat ${(
                        (1 -
                          previewMeta.compressed_size_kb /
                            previewMeta.original_size_kb) *
                        100
                      ).toFixed(1)}%)`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCurrent}
                  className="gap-1.5 rounded-xl text-xs"
                >
                  <Download className="size-3.5" /> JPG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSnapshot(previewMeta.id)}
                  className="gap-1.5 rounded-xl text-xs text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" /> Hapus
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closePreview}
                  className="rounded-xl"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-black flex items-center justify-center min-h-[300px]">
              {previewLoading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              ) : previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={`Snapshot ${previewMeta.id}`}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              ) : (
                <p className="text-white text-sm">Gagal memuat gambar</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
