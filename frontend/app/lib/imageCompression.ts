// app/lib/imageCompression.ts
//
// Utility kompresi & dekompresi snapshot CCTV.
//
// Alur:
//   compressCanvas(canvas) → JPEG (quality 0.6) → pako.deflate → base64
//   decompressBase64(base64) → atob → pako.inflate → Blob → Object URL → <img src=...>
//
// Kenapa JPEG dulu, baru deflate?
//   JPEG sudah lossy compression untuk citra natural (CCTV).
//   Deflate menambah lossless compression di atasnya, lumayan
//   memangkas overhead base64 saat disimpan ke DB.

import pako from "pako";

export interface CompressionResult {
  /** Base64 dari hasil deflate(JPEG bytes). Disimpan ke DB. */
  base64: string;
  /** Perkiraan ukuran sebelum kompresi (canvas → PNG bytes), dalam KB. */
  originalSizeKb: number;
  /** Ukuran final yang dikirim/disimpan (string base64 deflate), dalam KB. */
  compressedSizeKb: number;
  /** Lebar gambar (px) */
  width: number;
  /** Tinggi gambar (px) */
  height: number;
}

/** Konversi Blob → ArrayBuffer (Promise wrapper). */
function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Konversi Uint8Array → string base64 dengan aman utk array besar.
 * Kalau dipakai String.fromCharCode(...arr) langsung, browser bisa stack overflow.
 */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000; // 32KB
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/** Konversi base64 string → Uint8Array */
function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Kompresi canvas → JPEG → deflate → base64.
 *
 * @param canvas Canvas yang sudah di-draw (gambar + bounding box).
 * @param quality Kualitas JPEG (0–1). Default 0.6 (cukup tajam, jauh lebih kecil).
 */
export async function compressCanvas(
  canvas: HTMLCanvasElement,
  quality = 0.6
): Promise<CompressionResult> {
  // 1. Encode canvas ke JPEG blob (lossy compression untuk citra natural).
  const jpegBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob() returned null"))),
      "image/jpeg",
      quality
    );
  });

  // 2. Estimasi "ukuran asli" memakai PNG (representasi lossless raw canvas).
  //    Ini hanya untuk reporting; tidak dikirim ke server.
  const pngBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob(png) returned null"))),
      "image/png"
    );
  });

  // 3. Deflate JPEG bytes → kompresi tambahan lossless.
  const jpegBuffer = await blobToArrayBuffer(jpegBlob);
  const jpegBytes = new Uint8Array(jpegBuffer);
  const deflated = pako.deflate(jpegBytes, { level: 9 });

  // 4. Encode ke base64 supaya bisa disimpan di kolom TEXT/MEDIUMTEXT.
  const base64 = uint8ToBase64(deflated);

  return {
    base64,
    originalSizeKb: +(pngBlob.size / 1024).toFixed(2),
    compressedSizeKb: +(base64.length / 1024).toFixed(2),
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Dekompresi base64 (deflate(JPEG)) → Object URL untuk dipasang ke <img src>.
 * Jangan lupa panggil URL.revokeObjectURL(url) saat sudah tidak dipakai.
 */
export function decompressBase64ToObjectUrl(base64: string): string {
  const deflated = base64ToUint8(base64);
  const jpegBytes = pako.inflate(deflated);
  // Pako bisa return Uint8Array atau ArrayBufferView; pastikan typed array biasa.
  const blob = new Blob([new Uint8Array(jpegBytes)], { type: "image/jpeg" });
  return URL.createObjectURL(blob);
}

/**
 * Dekompresi base64 → data URL (data:image/jpeg;base64,...).
 * Cocok untuk download attribute pada <a>, atau ditampilkan tanpa
 * harus revoke ObjectURL.
 */
export function decompressBase64ToDataUrl(base64: string): string {
  const deflated = base64ToUint8(base64);
  const jpegBytes = pako.inflate(deflated);
  const jpegBase64 = uint8ToBase64(new Uint8Array(jpegBytes));
  return `data:image/jpeg;base64,${jpegBase64}`;
}
