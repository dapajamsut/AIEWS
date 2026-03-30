"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Dashboard from "@/app/pages/Dashboard";
import Layout from "@/app/components/layout/Layout";

// Konfigurasi koneksi ke Laravel
const api = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true,
});

export default function Home() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fungsi untuk cek session ke Laravel
        const checkAuth = async () => {
            try {
                const response = await api.get("/api/user");
                setUser(response.data); // Simpan data user (nama, email, dll)
                setLoading(false);
            } catch (error) {
                // Kalau error/belum login, tendang ke halaman login
                window.location.href = "/login";
            }
        };

        checkAuth();
    }, []);

    // Tampilan pas lagi loading ngecek database
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600 font-medium">Memuat Dashboard MakeSens...</p>
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">
                    Sistem Monitoring Aktif • User: <strong className="text-blue-900">{user?.name}</strong>
                </span>
                <button 
                    onClick={async () => {
                        await api.post("/api/logout");
                        window.location.href = "/login";
                    }}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-full transition-colors"
                >
                    Log Out
                </button>
            </div>
            
            <Dashboard />
        </Layout>
    );
}