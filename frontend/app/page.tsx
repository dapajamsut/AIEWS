"use client";

import { useEffect, useState } from "react";
import Dashboard from "@/app/pages/Dashboard";
import Layout from "@/app/components/layout/Layout";

const BACKEND_URL = `${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}`}`;

export default function Home() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("auth_token");
            const loginTime = localStorage.getItem("login_time");
            const sessionActive = document.cookie.includes("session_active=true");

            if (!token || !loginTime || !sessionActive) {
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_user");
                localStorage.removeItem("login_time");
                window.location.href = "/login";
                return;
            }

            // Check if 24 hours have passed (24 * 60 * 60 * 1000 = 86400000 ms)
            if (Date.now() - parseInt(loginTime) > 86400000) {
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_user");
                localStorage.removeItem("login_time");
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
            localStorage.removeItem("login_time");
            document.cookie = "session_active=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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
            <Dashboard />
        </Layout>
    );
}
