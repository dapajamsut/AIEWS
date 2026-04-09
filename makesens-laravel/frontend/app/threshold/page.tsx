"use client";

import { useState, useEffect } from "react";
import Layout from "@/app/components/layout/Layout";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { 
  Save, 
  AlertTriangle, 
  Droplet, 
  AlertCircle, 
  AlertOctagon, 
  CheckCircle 
} from "lucide-react";

export default function ThresholdPage() {
  const [thresholds, setThresholds] = useState({
    siaga1: 400,
    siaga2: 300,
    siaga3: 150,
  });

  useEffect(() => {
    const saved = localStorage.getItem("waterLevelThresholds");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThresholds({
          siaga1: parsed.siaga1 ?? 400,
          // Fallback ke siaga2_low kalau sebelumnya user masih nyimpen format lama di local storage
          siaga2: parsed.siaga2 ?? parsed.siaga2_low ?? 300, 
          siaga3: parsed.siaga3 ?? 150,
        });
      } catch (e) {}
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setThresholds((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSave = () => {
    localStorage.setItem("waterLevelThresholds", JSON.stringify(thresholds));
    window.dispatchEvent(new Event("storage")); 
    alert("Threshold berhasil disimpan! Dashboard akan menyesuaikan status SIAGA secara real-time.");
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-xl">
              <Droplet className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Water Level Threshold
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Set the water level thresholds for triggering alerts. Adjust these settings to control the alert levels for river flooding.
          </p>
        </div>

        {/* Threshold Settings Card */}
        <Card className="p-6 md:p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
          <div className="space-y-1">
            {/* SIAGA 1 */}
            <div className="group flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors duration-200 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-950 rounded-lg group-hover:scale-105 transition-transform">
                  <AlertOctagon className="size-5 text-red-600 dark:text-red-400" />
                </div>
                <label className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  SIAGA 1 Threshold
                </label>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="number"
                  name="siaga1"
                  value={thresholds.siaga1}
                  onChange={handleChange}
                  className="w-full sm:w-32 text-center text-lg font-bold text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 focus:ring-red-500"
                />
                <span className="text-gray-500 dark:text-gray-400 font-medium">cm</span>
              </div>
            </div>

            {/* SIAGA 2 */}
            <div className="group flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 rounded-xl hover:bg-yellow-50 dark:hover:bg-yellow-950/20 transition-colors duration-200 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-950 rounded-lg group-hover:scale-105 transition-transform">
                  <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <label className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  SIAGA 2 Threshold
                </label>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="number"
                  name="siaga2"
                  value={thresholds.siaga2}
                  onChange={handleChange}
                  className="w-full sm:w-32 text-center text-lg font-bold text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900 focus:ring-yellow-500"
                />
                <span className="text-gray-500 dark:text-gray-400 font-medium">cm</span>
              </div>
            </div>

            {/* SIAGA 3 */}
            <div className="group flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 rounded-xl hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg group-hover:scale-105 transition-transform">
                  <CheckCircle className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <label className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  SIAGA 3 Threshold
                </label>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="number"
                  name="siaga3"
                  value={thresholds.siaga3}
                  onChange={handleChange}
                  className="w-full sm:w-32 text-center text-lg font-bold text-green-600 dark:text-green-400 border-green-200 dark:border-green-900 focus:ring-green-500"
                />
                <span className="text-gray-500 dark:text-gray-400 font-medium">cm</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
              <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Perubahan akan langsung mempengaruhi status SIAGA di dashboard setelah Anda menyimpan.
              </p>
            </div>
            <Button 
              onClick={handleSave} 
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Save className="size-4" />
              Simpan Threshold
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}