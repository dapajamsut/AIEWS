"use client";

import { useState, useEffect, useCallback } from "react";
import Layout from "@/app/components/layout/Layout";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { LocationSearchBox, type LocationResult } from "@/app/components/LocationSearchBox";
import {
  Save,
  Droplet,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function ThresholdPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>("jakarta_pusat");
  const [pendingRegion, setPendingRegion] = useState<LocationResult | null>(null);
  const [activeRegionName, setActiveRegionName] = useState<string>("Jakarta Pusat");
  const [savedLabel, setSavedLabel] = useState<string>("");

  // SIAGA Thresholds State — all 3 in one form
  const [siagaThresholds, setSiagaThresholds] = useState({
    siaga1: { water: 400 },
    siaga2: { water: 300 },
    siaga3: { water: 150 },
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // 🔥 RESTORE SELECTED REGION FROM LOCAL STORAGE
  useEffect(() => {
    const savedRegion = localStorage.getItem("selectedRegion");
    const savedRegionData = localStorage.getItem("selectedRegionData");
    if (savedRegion) setSelectedRegion(savedRegion);
    if (savedRegionData) {
      try {
        const data = JSON.parse(savedRegionData);
        setActiveRegionName(data.name);
        setSavedLabel(data.name);
      } catch (e) {}
    }
  }, []);

  // 🔥 FETCH THRESHOLDS FROM SERVER
  const fetchThresholds = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch("http://localhost:8002/api/thresholds?type=siaga", {
        cache: "no-store",
        headers: { apikey: "pikel2" },
      });
      if (res.ok) {
        const data = await res.json();
        setSiagaThresholds({
          siaga1: { water: Number(data.siaga1?.water ?? 400) },
          siaga2: { water: Number(data.siaga2?.water ?? 300) },
          siaga3: { water: Number(data.siaga3?.water ?? 150) },
        });
      }
    } catch (error) {
      console.error("Fetch thresholds error:", error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchThresholds();
  }, [fetchThresholds]);

  const handleLocationSelect = (result: LocationResult) => {
    setPendingRegion(result);
  };

  const handleSetRegion = () => {
    if (!pendingRegion) return;
    const fullName = [pendingRegion.name, pendingRegion.kabupaten, pendingRegion.provinsi]
      .filter(Boolean)
      .join(", ");
    const regionData = {
      id: pendingRegion.id,
      name: fullName,
      lat: pendingRegion.lat,
      lon: pendingRegion.lon,
    };
    setSelectedRegion(pendingRegion.id);
    localStorage.setItem("selectedRegion", pendingRegion.id);
    localStorage.setItem("selectedRegionData", JSON.stringify(regionData));
    setActiveRegionName(fullName);
    setSavedLabel(fullName);
    setPendingRegion(null);
    alert(`Daerah telah diset ke ${fullName}`);
  };

  const sanitizeNumberInput = (value: string) => {
    const normalized = value.replace(/^0+(?=\d)/, "");
    return normalized === "" ? "0" : normalized;
  };

  // Validate that siaga1 >= siaga2 >= siaga3
  const validateAll = (thresholds = siagaThresholds): string | null => {
    const { siaga1, siaga2, siaga3 } = thresholds;
    if (siaga1.water <= siaga2.water)
      return `Nilai SIAGA 1 (${siaga1.water} cm) harus lebih besar dari SIAGA 2 (${siaga2.water} cm).`;
    if (siaga2.water <= siaga3.water)
      return `Nilai SIAGA 2 (${siaga2.water} cm) harus lebih besar dari SIAGA 3 (${siaga3.water} cm).`;
    return null;
  };

  // Handle input change for any level
  const handleChange = (level: 1 | 2 | 3, value: string) => {
    const levelKey = `siaga${level}` as "siaga1" | "siaga2" | "siaga3";
    const sanitized = sanitizeNumberInput(value);
    const newValue = parseInt(sanitized, 10) || 0;

    const newThresholds = {
      ...siagaThresholds,
      [levelKey]: { water: newValue },
    };
    setSiagaThresholds(newThresholds);

    const err = validateAll(newThresholds);
    setValidationError(err);
  };

  // Save ALL levels in sequence
  const handleSaveAll = async () => {
    const err = validateAll();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setSaving(true);
    setSaveSuccess(false);

    try {
      // Save siaga1, siaga2, siaga3 in parallel
      const saves = ([1, 2, 3] as const).map((level) => {
        const levelKey = `siaga${level}` as "siaga1" | "siaga2" | "siaga3";
        return fetch("http://localhost:8002/api/thresholds", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: "pikel2",
          },
          body: JSON.stringify({
            type: "siaga",
            level,
            water: siagaThresholds[levelKey].water,
          }),
        });
      });

      const results = await Promise.all(saves);
      const allOk = results.every((r) => r.ok);

      if (!allOk) {
        const failed = results.filter((r) => !r.ok);
        const texts = await Promise.all(failed.map((r) => r.text()));
        throw new Error(`Gagal menyimpan: ${texts.join(", ")}`);
      }

      // Re-fetch to confirm server state
      await fetchThresholds();

      // Notify dashboard
      window.dispatchEvent(new Event("thresholdsUpdated"));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error(error);
      alert("Gagal menyimpan threshold: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const levelConfig = [
    {
      level: 1 as const,
      label: "SIAGA 1",
      desc: "Kritis / Bahaya",
      badge: "bg-red-600 text-white",
      ring: "ring-red-200 dark:ring-red-800",
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      dot: "bg-red-500",
      text: "text-red-700 dark:text-red-300",
    },
    {
      level: 2 as const,
      label: "SIAGA 2",
      desc: "Waspada",
      badge: "bg-yellow-400 text-gray-900",
      ring: "ring-yellow-200 dark:ring-yellow-800",
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      border: "border-yellow-200 dark:border-yellow-800",
      dot: "bg-yellow-500",
      text: "text-yellow-700 dark:text-yellow-300",
    },
    {
      level: 3 as const,
      label: "SIAGA 3",
      desc: "Aman / Normal",
      badge: "bg-green-500 text-white",
      ring: "ring-green-200 dark:ring-green-800",
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
      dot: "bg-green-500",
      text: "text-green-700 dark:text-green-300",
    },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6 p-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-xl">
              <Droplet className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Manajemen Threshold
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Atur ambang batas ketinggian air untuk setiap level SIAGA.
          </p>
        </div>

        {/* Region Selector */}
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-visible">
          <div className="mb-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pilih Daerah / Region</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ketik nama kecamatan, kota, atau provinsi untuk mencari lokasi di Indonesia.
            </p>
          </div>

          <div className="mt-4">
            <LocationSearchBox
              initialLabel={savedLabel}
              onSelect={handleLocationSelect}
              placeholder="Cari kecamatan, kota, atau provinsi..."
            />
          </div>

          {pendingRegion && (
            <div className="mt-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-sm">
              <p className="font-semibold text-blue-800 dark:text-blue-200">📍 {pendingRegion.name}</p>
              {(pendingRegion.kabupaten || pendingRegion.provinsi) && (
                <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                  {[pendingRegion.kabupaten, pendingRegion.provinsi].filter(Boolean).join(" · ")}
                </p>
              )}
              <p className="text-blue-500 dark:text-blue-500 text-xs mt-0.5">
                Koordinat: {Number(pendingRegion.lat).toFixed(4)}, {Number(pendingRegion.lon).toFixed(4)}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSetRegion}
              disabled={!pendingRegion}
            >
              Terapkan Lokasi
            </Button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Area aktif:{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{activeRegionName}</span>
            </div>
          </div>
        </Card>

        {/* ─── SINGLE SIAGA THRESHOLD CARD ─── */}
        <Card className="p-6 md:p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Droplet className="size-6 text-blue-600 dark:text-blue-400" />
              Ambang Batas SIAGA (Tinggi Air)
            </h2>
            {isFetching && (
              <Loader2 className="size-5 text-blue-500 animate-spin" />
            )}
          </div>

          {/* Info */}
          <div className="mb-6 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <AlertCircle className="size-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <span>
              Atur ketiga level sekaligus. Nilai harus berurutan:{" "}
              <strong>SIAGA 1 &gt; SIAGA 2 &gt; SIAGA 3</strong>.
            </span>
          </div>

          {/* 3 Level Inputs */}
          <div className="space-y-4 mb-8">
            {levelConfig.map(({ level, label, desc, badge, bg, border, text }) => {
              const levelKey = `siaga${level}` as "siaga1" | "siaga2" | "siaga3";
              const val = siagaThresholds[levelKey].water;
              return (
                <div
                  key={level}
                  className={`rounded-2xl border ${border} ${bg} p-5 transition-all`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${badge}`}>
                        {label}
                      </span>
                      <span className={`text-sm font-medium ${text}`}>{desc}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      satuan: cm
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name={`water_siaga${level}`}
                        value={String(val)}
                        onChange={(e) => handleChange(level, e.target.value)}
                        className="w-full text-center text-3xl font-bold border-gray-200 dark:border-gray-700 focus:ring-blue-500 py-4 h-auto"
                        disabled={isFetching}
                      />
                    </div>
                    <span className="text-2xl font-bold text-gray-400 dark:text-gray-500 min-w-[3rem]">
                      cm
                    </span>
                  </div>
                  <p className={`mt-2 text-xs ${text}`}>
                    {level === 1
                      ? `Sistem masuk SIAGA 1 saat tinggi air ≥ ${val} cm`
                      : level === 2
                      ? `Sistem masuk SIAGA 2 saat tinggi air ≥ ${val} cm (dan < SIAGA 1)`
                      : `Sistem masuk SIAGA 3 saat tinggi air ≥ ${val} cm (dan < SIAGA 2)`}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-4 py-3 text-sm flex items-start gap-2">
              <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />
              {validationError}
            </div>
          )}

          {/* Success Toast */}
          {saveSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 text-sm flex items-center gap-2">
              <CheckCircle2 className="size-4 flex-shrink-0" />
              Threshold berhasil disimpan dan diterapkan ke dashboard!
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900">
              <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Perubahan akan langsung mempengaruhi status SIAGA di dashboard setelah disimpan.
              </p>
            </div>
            <Button
              onClick={handleSaveAll}
              disabled={saving || !!validationError || isFetching}
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all duration-200 transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed text-base"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Simpan Semua Threshold SIAGA
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Info card */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200">Threshold Cuaca Otomatis</h3>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                Threshold untuk setiap kondisi cuaca (kering, normal, berangin, hujan, hujan deras)
                diambil otomatis dari weather API berdasarkan kondisi cuaca real-time. Tidak dapat diubah manual.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}