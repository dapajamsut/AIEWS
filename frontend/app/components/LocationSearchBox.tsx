"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search, X, Loader2, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface NominatimAddress {
  village?: string;
  suburb?: string;
  city_district?: string;
  municipality?: string;
  town?: string;
  city?: string;
  county?: string;
  state_district?: string;
  state?: string;
  country?: string;
  [key: string]: string | undefined;
}

interface NominatimItem {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
  address: NominatimAddress;
}

export interface LocationResult {
  id: string;
  name: string;        // kecamatan / kelurahan level
  kabupaten?: string;  // kabupaten / kota
  provinsi?: string;   // provinsi
  lat: string;
  lon: string;
}

// ─────────────────────────────────────────────
// Nominatim result → LocationResult
// ─────────────────────────────────────────────
function parseResult(item: NominatimItem): LocationResult {
  const a = item.address;

  // Most specific admin name (kecamatan level)
  const name =
    a.city_district ||   // Kecamatan di DKI / kota besar
    a.municipality  ||   // Kecamatan di beberapa daerah
    a.suburb        ||   // Sub-distrik
    a.village       ||   // Desa / kelurahan
    a.town          ||
    a.city          ||
    item.display_name.split(",")[0].trim();

  // Kabupaten / Kota
  const kabupaten = a.county || a.city || a.state_district;

  // Provinsi
  const provinsi = a.state;

  return {
    id: item.place_id.toString(),
    name,
    kabupaten,
    provinsi,
    lat: item.lat,
    lon: item.lon,
  };
}

// Only keep administrative / settlement-type results
function isRelevant(item: NominatimItem): boolean {
  if (["boundary", "place"].includes(item.class)) return true;
  const irrelevantTypes = [
    "house", "pedestrian", "residential", "service",
    "road", "path", "motorway", "trunk", "shop", "amenity",
  ];
  return !irrelevantTypes.includes(item.type);
}

// ─────────────────────────────────────────────
// Remove duplicate regions by (name + kabupaten)
// ─────────────────────────────────────────────
function deduplicate(results: LocationResult[]): LocationResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.name}|${r.kabupaten ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─────────────────────────────────────────────
// Component props
// ─────────────────────────────────────────────
interface LocationSearchBoxProps {
  initialLabel?: string;          // label shown on first render (e.g. saved region name)
  onSelect: (region: LocationResult) => void;
  placeholder?: string;
  className?: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export function LocationSearchBox({
  initialLabel = "",
  onSelect,
  placeholder = "Cari kecamatan, kota, atau provinsi...",
  className = "",
}: LocationSearchBoxProps) {
  const [query, setQuery]         = useState(initialLabel);
  const [results, setResults]     = useState<LocationResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const [isOpen, setIsOpen]       = useState(false);
  const [committed, setCommitted] = useState(!!initialLabel); // true once user picked
  const containerRef              = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced Nominatim fetch
  useEffect(() => {
    if (committed) return; // don't re-search after selection
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(trimmed)}` +
          `&countrycodes=id` +
          `&format=json` +
          `&addressdetails=1` +
          `&limit=12`;

        const res = await fetch(url, {
          headers: { "Accept-Language": "id" },
          signal: controller.signal,
        });

        if (res.ok) {
          const data: NominatimItem[] = await res.json();
          const filtered  = data.filter(isRelevant);
          const mapped    = filtered.map(parseResult);
          const unique    = deduplicate(mapped);
          setResults(unique.slice(0, 8));
          setIsOpen(unique.length > 0);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Location search error:", err);
      } finally {
        setLoading(false);
      }
    }, 420);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, committed]);

  const handleSelect = (result: LocationResult) => {
    // Build a human-friendly label: "Menteng · Jakarta Pusat · DKI Jakarta"
    const label = [result.name, result.kabupaten, result.provinsi]
      .filter(Boolean)
      .join(" · ");
    setQuery(label);
    setCommitted(true);
    setIsOpen(false);
    setResults([]);
    onSelect(result);
  };

  const handleClear = () => {
    setQuery("");
    setCommitted(false);
    setResults([]);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setCommitted(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ── Input ── */}
      <div className="relative flex items-center group">
        {/* Left icon */}
        <div className="absolute left-4 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="size-4 text-blue-500 animate-spin" />
          ) : (
            <Search className="size-4 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`
            w-full pl-11 pr-10 py-3.5 rounded-xl
            border border-gray-200 dark:border-gray-700
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            font-medium text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200
            shadow-sm
            ${committed ? "text-blue-700 dark:text-blue-300" : ""}
          `}
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {isOpen && results.length > 0 && (
        <div className="
          absolute left-0 right-0 top-full z-[999]
          mt-2 max-h-80 overflow-y-auto
          rounded-2xl
          border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900
          shadow-2xl shadow-gray-200/60 dark:shadow-black/40
          divide-y divide-gray-100 dark:divide-gray-800
        ">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/60 rounded-t-2xl">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Hasil pencarian · Indonesia
            </p>
          </div>

          {results.map((result) => {
            const sub = [result.kabupaten, result.provinsi].filter(Boolean).join(" · ");
            return (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelect(result)}
                className="
                  w-full text-left px-4 py-3
                  hover:bg-blue-50 dark:hover:bg-blue-950/40
                  active:bg-blue-100 dark:active:bg-blue-950/60
                  transition-colors group/item
                "
              >
                <div className="flex items-center gap-3">
                  {/* Pin icon */}
                  <div className="flex-shrink-0 size-8 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center group-hover/item:bg-blue-500 transition-colors">
                    <MapPin className="size-4 text-blue-600 dark:text-blue-400 group-hover/item:text-white transition-colors" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                      {result.name}
                    </p>
                    {sub && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {sub}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="size-4 text-gray-300 dark:text-gray-600 group-hover/item:text-blue-400 transition-colors flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {isOpen && results.length === 0 && !loading && query.length >= 2 && (
        <div className="
          absolute left-0 right-0 top-full z-[999]
          mt-2 rounded-2xl
          border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900
          shadow-xl px-4 py-6 text-center
        ">
          <MapPin className="size-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Lokasi tidak ditemukan
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Coba ketik nama kecamatan atau kota
          </p>
        </div>
      )}
    </div>
  );
}
