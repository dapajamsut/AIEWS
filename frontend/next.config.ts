import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Rewrite /cctv-snapshot → http://cctv.makesens.my.id/snapshot
   *
   * Tujuan:
   * 1. Menghindari Mixed Content: Halaman di-serve via HTTPS, sedangkan
   *    server CCTV hanya punya HTTP. Browser modern memblokir HTTP dari
   *    halaman HTTPS. Dengan rewrite server-side, browser cukup akses
   *    /cctv-snapshot (same-origin HTTPS) dan Next.js yang fetch ke CCTV.
   *
   * 2. Menghindari CORS: Karena request dilakukan server-side (Next.js),
   *    header CORS dari server CCTV tidak relevan.
   *    Canvas tidak akan "tainted" meski crossOrigin dipasang.
   */
  async rewrites() {
    return [
      {
        source: "/cctv-snapshot",
        destination: "http://cctv.makesens.my.id/snapshot",
      },
    ];
  },
};

export default nextConfig;
