"use client";

import { useState, useEffect, useCallback } from "react";

import Layout from "@/app/components/layout/Layout";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

import {
  LocationSearchBox,
  type LocationResult,
} from "@/app/components/LocationSearchBox";

import {
  Save,
  Droplet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings2,
} from "lucide-react";

export default function ThresholdPage() {

  const [selectedRegion, setSelectedRegion] =
    useState<string>("jakarta_pusat");

  const [pendingRegion, setPendingRegion] =
    useState<LocationResult | null>(null);

  const [activeRegionName, setActiveRegionName] =
    useState<string>("Jakarta Pusat");

  const [savedLabel, setSavedLabel] =
    useState<string>("");

  // SIAGA Thresholds
  const [siagaThresholds, setSiagaThresholds] =
    useState({
      siaga1: { water: 400 },
      siaga2: { water: 300 },
      siaga3: { water: 150 },
    });

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [saveSuccess, setSaveSuccess] =
    useState(false);

  const [isFetching, setIsFetching] =
    useState(true);

  // Physics
  const [physics, setPhysics] =
    useState({
      w: 15,
      s: 0.001,
      n: 0.035,
      a_das: 10000000,
      c: 0.75,
      l_segment: 1000,
    });

  // RESTORE REGION
  useEffect(() => {

    const savedRegion =
      localStorage.getItem("selectedRegion");

    const savedRegionData =
      localStorage.getItem("selectedRegionData");

    if (savedRegion)
      setSelectedRegion(savedRegion);

    if (savedRegionData) {

      try {

        const data =
          JSON.parse(savedRegionData);

        setActiveRegionName(data.name);

        setSavedLabel(data.name);

      } catch (e) {}

    }

  }, []);

  // FETCH THRESHOLD
  const fetchThresholds =
    useCallback(async () => {

      setIsFetching(true);

      try {

        const res =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/thresholds?type=siaga`,
            {
              cache: "no-store",
              headers: {
                apikey: "pikel2",
              },
            }
          );

        if (res.ok) {

          const data =
            await res.json();

          setSiagaThresholds({
            siaga1: {
              water: Number(
                data.siaga1?.water ?? 400
              ),
            },

            siaga2: {
              water: Number(
                data.siaga2?.water ?? 300
              ),
            },

            siaga3: {
              water: Number(
                data.siaga3?.water ?? 150
              ),
            },
          });

        }

        // Physics
        const resPhysics =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/thresholds?type=physics`,
            {
              cache: "no-store",
              headers: {
                apikey: "pikel2",
              },
            }
          );

        if (resPhysics.ok) {

          const data =
            await resPhysics.json();

          setPhysics({
            w: Number(data.w ?? 15),
            s: Number(data.s ?? 0.001),
            n: Number(data.n ?? 0.035),
            a_das: Number(
              data.a_das ?? 10000000
            ),
            c: Number(data.c ?? 0.75),
            l_segment: Number(
              data.l_segment ?? 1000
            ),
          });

        }

      } catch (error) {

        console.error(
          "Fetch thresholds error:",
          error
        );

      } finally {

        setIsFetching(false);

      }

    }, []);

  useEffect(() => {

    fetchThresholds();

  }, [fetchThresholds]);

  const handleLocationSelect =
    (result: LocationResult) => {

      setPendingRegion(result);

    };

  const handleSetRegion = () => {

    if (!pendingRegion) return;

    const fullName = [
      pendingRegion.name,
      pendingRegion.kabupaten,
      pendingRegion.provinsi,
    ]
      .filter(Boolean)
      .join(", ");

    const regionData = {
      id: pendingRegion.id,
      name: fullName,
      lat: pendingRegion.lat,
      lon: pendingRegion.lon,
    };

    setSelectedRegion(
      pendingRegion.id
    );

    localStorage.setItem(
      "selectedRegion",
      pendingRegion.id
    );

    localStorage.setItem(
      "selectedRegionData",
      JSON.stringify(regionData)
    );

    // Beri tahu halaman lain (Dashboard) bahwa region telah berubah, sehingga
    // weather widget & lokasi otomatis sinkron tanpa perlu reload.
    window.dispatchEvent(new Event("regionUpdated"));

    setActiveRegionName(fullName);

    setSavedLabel(fullName);

    setPendingRegion(null);

    alert(
      `Daerah telah diset ke ${fullName}`
    );

  };

  const sanitizeNumberInput =
    (value: string) => {

      const normalized =
        value.replace(/^0+(?=\d)/, "");

      return normalized === ""
        ? "0"
        : normalized;

    };

  // VALIDATE
  const validateAll =
    (
      thresholds = siagaThresholds
    ): string | null => {

      const {
        siaga1,
        siaga2,
        siaga3,
      } = thresholds;

      if (
        siaga1.water <= siaga2.water
      ) {

        return `Nilai SIAGA 1 (${siaga1.water} cm) harus lebih besar dari SIAGA 2 (${siaga2.water} cm).`;

      }

      if (
        siaga2.water <= siaga3.water
      ) {

        return `Nilai SIAGA 2 (${siaga2.water} cm) harus lebih besar dari SIAGA 3 (${siaga3.water} cm).`;

      }

      return null;

    };

  // HANDLE INPUT
  const handleChange =
    (
      level: 1 | 2 | 3,
      value: string
    ) => {

      const levelKey =
        `siaga${level}` as
          | "siaga1"
          | "siaga2"
          | "siaga3";

      const sanitized =
        sanitizeNumberInput(value);

      const newValue =
        parseInt(sanitized, 10) || 0;

      const newThresholds = {
        ...siagaThresholds,

        [levelKey]: {
          water: newValue,
        },
      };

      setSiagaThresholds(
        newThresholds
      );

      const err =
        validateAll(newThresholds);

      setValidationError(err);

    };

  // SAVE
  const handleSaveAll =
    async () => {

      const err = validateAll();

      if (err) {

        setValidationError(err);

        return;

      }

      setValidationError(null);

      setSaving(true);

      setSaveSuccess(false);

      try {

        const saves =
          ([1, 2, 3] as const).map(
            (level) => {

              const levelKey =
                `siaga${level}` as
                  | "siaga1"
                  | "siaga2"
                  | "siaga3";

              return fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/thresholds`,
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",

                    apikey: "pikel2",
                  },

                  body: JSON.stringify({
                    type: "siaga",
                    level,

                    water:
                      siagaThresholds[
                        levelKey
                      ].water,
                  }),
                }
              );

            }
          );

        const savePhysics =
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/thresholds`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                apikey: "pikel2",
              },

              body: JSON.stringify({
                type: "physics",
                ...physics,
              }),
            }
          );

        const results =
          await Promise.all([
            ...saves,
            savePhysics,
          ]);

        const allOk =
          results.every(
            (r) => r.ok
          );

        if (!allOk) {

          const failed =
            results.filter(
              (r) => !r.ok
            );

          const texts =
            await Promise.all(
              failed.map((r) =>
                r.text()
              )
            );

          throw new Error(
            `Gagal menyimpan: ${texts.join(", ")}`
          );

        }

        await fetchThresholds();

        window.dispatchEvent(
          new Event(
            "thresholdsUpdated"
          )
        );

        setSaveSuccess(true);

        setTimeout(
          () =>
            setSaveSuccess(false),
          3000
        );

      } catch (error: any) {

        console.error(error);

        alert(
          "Gagal menyimpan threshold: " +
            error.message
        );

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
      bg: "bg-red-50/40 dark:bg-red-950/10",
      border: "border-red-200 dark:border-red-800/50",
      text: "text-red-700 dark:text-red-400",
      focusRing: "focus:ring-red-500",
    },
    {
      level: 2 as const,
      label: "SIAGA 2",
      desc: "Waspada Kenaikan",
      badge: "bg-amber-500 text-white",
      bg: "bg-amber-50/40 dark:bg-amber-950/10",
      border: "border-amber-200 dark:border-amber-800/50",
      text: "text-amber-700 dark:text-amber-400",
      focusRing: "focus:ring-amber-500",
    },
    {
      level: 3 as const,
      label: "SIAGA 3",
      desc: "Normal / Aman",
      badge: "bg-green-600 text-white",
      bg: "bg-green-50/40 dark:bg-green-950/10",
      border: "border-green-200 dark:border-green-800/50",
      text: "text-green-700 dark:text-green-400",
      focusRing: "focus:ring-green-500",
    },
  ];

  return (

    <Layout>

      <div className="max-w-7xl mx-auto p-4 space-y-6">

        {/* HEADER */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">

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

        {/* TOP GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* REGION */}
          <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-visible shadow-sm rounded-2xl">

            <div className="mb-1">

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Pilih Daerah / Region
              </h2>

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

                <p className="font-semibold text-blue-800 dark:text-blue-200">
                  📍 {pendingRegion.name}
                </p>

                {(pendingRegion.kabupaten ||
                  pendingRegion.provinsi) && (

                  <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">

                    {[
                      pendingRegion.kabupaten,
                      pendingRegion.provinsi,
                    ]
                      .filter(Boolean)
                      .join(" · ")}

                  </p>
                )}

                <p className="text-blue-500 dark:text-blue-500 text-xs mt-0.5">

                  Koordinat:{" "}
                  {Number(
                    pendingRegion.lat
                  ).toFixed(4)}
                  ,
                  {" "}
                  {Number(
                    pendingRegion.lon
                  ).toFixed(4)}

                </p>

              </div>
            )}

            <div className="mt-6 flex flex-col gap-4">

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

                <span className="font-semibold text-gray-900 dark:text-white">

                  {activeRegionName}

                </span>

              </div>

            </div>

          </Card>

          {/* PHYSICS */}
          <Card className="p-6 md:p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">

                <Settings2 className="size-6 text-blue-600 dark:text-blue-400" />

                Parameter Statis Hidrologi (Fisik)

              </h2>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {[
                {
                  label:
                    "Lebar Sungai - w (m)",
                  value: physics.w,
                  key: "w",
                },

                {
                  label:
                    "Kemiringan - S",
                  value: physics.s,
                  key: "s",
                },

                {
                  label:
                    "Manning - n",
                  value: physics.n,
                  key: "n",
                },

                {
                  label:
                    "Luas DAS - A_DAS (m²)",
                  value: physics.a_das,
                  key: "a_das",
                },

                {
                  label:
                    "Koef Limpasan - C",
                  value: physics.c,
                  key: "c",
                },

                {
                  label:
                    "Panjang Segmen - L (m)",
                  value:
                    physics.l_segment,
                  key: "l_segment",
                },
              ].map((item) => (

                <div key={item.key}>

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                    {item.label}

                  </label>

                  <Input
                    type="number"
                    value={item.value}
                    onChange={(e) =>
                      setPhysics({
                        ...physics,

                        [item.key]:
                          Number(
                            e.target.value
                          ),
                      })
                    }
                    className="
                      bg-white
                      dark:bg-gray-900
                      border-gray-200
                      dark:border-gray-700
                      text-gray-900
                      dark:text-white
                      placeholder:text-gray-400
                      dark:placeholder:text-gray-500
                    "
                  />

                </div>
              ))}

            </div>

          </Card>

        </div>

        {/* AMBANG BATAS SIAGA (TINGGI AIR) */}
        <Card className="p-6 md:p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">

              <Droplet className="size-6 text-blue-600 dark:text-blue-400" />

              Ambang Batas SIAGA (Tinggi Air)

            </h2>

            {isFetching && (
              <Loader2 className="size-5 text-blue-500 animate-spin" />
            )}

          </div>

          {/* INFO */}
          <div className="mb-6 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">

            <AlertCircle className="size-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />

            <span>
              Atur ketiga level sekaligus. Nilai harus berurutan secara logis:{" "}
              <strong>
                SIAGA 1 &gt; SIAGA 2 &gt; SIAGA 3
              </strong>
            </span>

          </div>

          {/* INLINE HORIZONTAL GRID LAYOUT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            {levelConfig.map(
              ({
                level,
                label,
                desc,
                badge,
                bg,
                border,
                text,
                focusRing,
              }) => {

                const levelKey =
                  `siaga${level}` as
                    | "siaga1"
                    | "siaga2"
                    | "siaga3";

                const val =
                  siagaThresholds[
                    levelKey
                  ].water;

                return (

                  <div
                    key={level}
                    className={`rounded-2xl border ${border} ${bg} p-5 flex flex-col justify-between shadow-sm transition-all`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge}`}>
                          {label}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium tracking-wide">
                          satuan: cm
                        </span>
                      </div>
                      
                      <p className={`text-xs font-semibold ${text} mb-4`}>
                        {desc}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="relative flex items-center">
                        {/* 🔥 FONT SIZE BOOSTED TO text-5xl font-black FOR PROUD VISUAL IMPACT */}
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          name={`water_siaga${level}`}
                          value={String(val)}
                          onChange={(e) =>
                            handleChange(
                              level,
                              e.target.value
                            )
                          }
                          className={`
                            w-full
                            text-left
                            text-5xl
                            font-black
                            tracking-tight
                            border-gray-200
                            dark:border-gray-700
                            pr-14
                            py-4
                            h-16
                            text-gray-900
                            dark:text-white
                            bg-white
                            dark:bg-gray-900
                            rounded-xl
                            focus:ring-2
                            ${focusRing}
                          `}
                          disabled={
                            isFetching
                          }
                        />
                        <span className="absolute right-4 text-sm font-bold text-gray-400 pointer-events-none select-none">
                          cm
                        </span>
                      </div>

                      <p className="text-[11px] leading-normal text-gray-500 dark:text-gray-400 italic">
                        {level === 1
                          ? `Aktif jika air ≥ ${val} cm`
                          : level === 2
                          ? `Aktif jika air ≥ ${val} cm (dan < ${siagaThresholds.siaga1.water} cm)`
                          : `Aktif jika air ≥ ${val} cm (dan < ${siagaThresholds.siaga2.water} cm)`}
                      </p>
                    </div>
                  </div>
                );
              }
            )}

          </div>

          {/* VALIDATION */}
          {validationError && (

            <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-4 py-3 text-sm flex items-start gap-2">

              <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />

              {validationError}

            </div>
          )}

          {/* SUCCESS */}
          {saveSuccess && (

            <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 text-sm flex items-center gap-2">

              <CheckCircle2 className="size-4 flex-shrink-0" />

              Threshold berhasil disimpan dan diterapkan ke dashboard!

            </div>
          )}

          {/* SAVE */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">

            <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900">

              <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />

              <p className="text-sm text-gray-700 dark:text-gray-300">

                Perubahan akan langsung mempengaruhi status SIAGA di dashboard setelah disimpan.

              </p>

            </div>

            <div className="flex justify-center w-full">
              <Button
                onClick={handleSaveAll}
                disabled={
                  saving ||
                  !!validationError ||
                  isFetching
                }
                className="w-full sm:w-48 gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl shadow-md shadow-blue-200 dark:shadow-blue-900/30 transition-all duration-200 transform hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >

                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Simpan
                  </>
                )}

              </Button>
            </div>

          </div>

        </Card>

        {/* INFO */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">

          <div className="flex items-start gap-3">

            <AlertCircle className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />

            <div>

              <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                Threshold Cuaca Otomatis
              </h3>

              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">

                Weather API mengambil data kondisi cuaca secara real-time.

              </p>

            </div>

          </div>

        </Card>

      </div>

    </Layout>
  );
}