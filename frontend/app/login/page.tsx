"use client";

import { useState } from "react";
import axios from "axios";

// Setup Axios biar bisa ngomong sama Laravel
const api = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true, // Wajib buat Laravel Sanctum
});

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Ambil CSRF Cookie dari Laravel (Wajib Keamanan)
            await api.get("/sanctum/csrf-cookie");
            
            // 2. Kirim data login ke Laravel
            const response = await api.post("/api/login", {
                email: email,
                password: password,
            });

            if (response.status === 204 || response.status === 200) {
                alert("Login Berhasil! Selamat datang Nabiel.");
                window.location.href = "/"; // Tendang ke Dashboard Utama
            }
        } catch (error: any) {
            console.error(error);
            alert("Login Gagal! Cek email & password di PostgreSQL.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
            <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4">
                        <svg className="size-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">MakeSens</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to flood monitoring system</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email Address
                        </label>
                        <input 
                            type="email" 
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="biel@makesens.com"
                            onChange={(e) => setEmail(e.target.value)} 
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <input 
                            type="password" 
                            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="••••••••"
                            onChange={(e) => setPassword(e.target.value)} 
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "Login to Dashboard"}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    PBL Semester 6 - Computer Engineering
                </div>
            </div>
        </div>
    );
}