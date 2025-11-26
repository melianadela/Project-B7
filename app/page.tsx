"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  /*useEffect(() => {
  const token = localStorage.getItem("btj_login_token");
  if (!token) router.push("/login");
}, []);*/

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #f9fcff 0%, #e8f4fa 40%, #cae7f3 100%)",
        color: "#1D2C8A",
      }}
    >
      {/* === Logo kiri atas === */}
      <div className="absolute top-6 left-6 z-20 flex items-center space-x-3">
        <Image
          src="/companylogo.png"
          alt="Bintang Toedjoe"
          width={200}
          height={200}
          className="object-contain"
          priority
        />
      </div>

      {/* Decorative Background */}
      <div className="absolute -top-32 -left-20 w-[500px] h-[500px] bg-[#d7effb]/40 rounded-full blur-[140px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#b5e0f3]/30 rounded-full blur-[160px]" />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >

        {/* Judul */}
        <h1 className="text-4xl font-bold mb-3 text-[#0f265c]">
          Sistem Dashboard Spare Part PT Bintang Toedjoe
        </h1>

        <p className="text-slate-500 mb-10 text-lg">
          Data spare part PT Bintang Toedjoe Site Pulogadung
        </p>

        {/* Quick Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-5 bg-white shadow-md rounded-xl cursor-pointer border border-slate-200"
            onClick={() => router.push("/dashboard/lifetime/overview")}
          >
            <div className="text-lg font-semibold text-blue-700">Lifetime</div>
            <p className="text-sm text-slate-500">Monitoring Penggantian Spare Part</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-5 bg-white shadow-md rounded-xl cursor-pointer border border-slate-200"
            onClick={() => router.push("/dashboard/kanban/internal")}
          >
            <div className="text-lg font-semibold text-blue-700">
              Kanban Internal
            </div>
            <p className="text-sm text-slate-500">PR • PO • Tracking Internal</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-5 bg-white shadow-md rounded-xl cursor-pointer border border-slate-200"
            onClick={() => router.push("/dashboard/kanban/external")}
          >
            <div className="text-lg font-semibold text-blue-700">
              Kanban Eksternal
            </div>
            <p className="text-sm text-slate-500">PR • PO • Tracking Eksternal</p>
          </motion.div>
        </div>

        {/* Main Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/dashboard/lifetime/overview")}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-blue-500/30 transition-all duration-300 text-white font-medium text-lg"
        >
          Masuk ke Dashboard
        </motion.button>
      </motion.div>

      {/* Footer */}
      <p className="absolute bottom-5 left-1/2 transform -translate-x-1/2 text-sm text-slate-600">
        © {new Date().getFullYear()} | Bintang Toedjoe Squad Batch 4
      </p>
    </div>
  );
}
