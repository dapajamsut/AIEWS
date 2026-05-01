"use client";

import { useEffect, useState } from "react";
import Dashboard from "@/app/pages/Dashboard";
import Layout from "@/app/components/layout/Layout";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

export default function Home() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("auth_token");

            if (!token) {
                window.location.href = "/login";
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/user`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/json",
                    },
                });

                if (!response.ok) {
                    // Token expired / invalid
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("auth_user");
                    window.location.href = "/login";
                    return;
                }

                const data = await response.json();
                setUser(data);
            } catch {
                window.location.href = "/login";
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const handleLogout = async () => {
        const token = localStorage.getItem("auth_token");
        try {
            await fetch(`${BACKEND_URL}/api/logout`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                },
            });
        } catch { /* silent */ } finally {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            window.location.href = "/login";
        }
    };

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
            {/* Header dengan logout */}
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">
                    Sistem Monitoring Aktif • User: <strong className="text-blue-900">{user?.name}</strong>
                </span>
                <button
                    onClick={handleLogout}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1 rounded-full transition-colors"
                >
                    Log Out
                </button>
            </div>

            {/* Langsung render Dashboard */}
            <Dashboard />
        </Layout>
    );
}
