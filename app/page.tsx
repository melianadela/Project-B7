"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const [theme, setTheme] = useState<"light" | "dark">("light");

  // load theme dari localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setTheme("dark");
  }, []);

  // apply theme ke html root
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center min-h-screen overflow-hidden
        transition-all duration-500
        ${theme === "light"
          ? "bg-gradient-to-b from-[#f9fcff] via-[#e8f4fa] to-[#cae7f3]"
          : "bg-[#0f172a]"
        }
      `}
    >
      {/* === Toggle Theme === */}
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="absolute top-6 right-6 z-20 p-2 rounded-full bg-white dark:bg-slate-800 shadow-md"
      >
        {theme === "light" ? <Moon size={22} /> : <Sun size={22} className="text-yellow-300" />}
      </button>

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

      {/* Decorative Blobs */}
      {theme === "light" && (
        <>
          <div className="absolute -top-32 -left-20 w-[500px] h-[500px] bg-[#d7effb]/40 rounded-full blur-[140px]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#b5e0f3]/30 rounded-full blur-[160px]" />
        </>
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        {/* Judul */}
        <h1
          className={`
            text-4xl font-bold mb-3 
            ${theme === "light" ? "text-[#0f265c]" : "text-white"}
          `}
        >
          Sistem Dashboard Spare Part PT Bintang Toedjoe
        </h1>

        <p
          className={`
            mb-10 text-lg
            ${theme === "light" ? "text-slate-600" : "text-slate-300"}
          `}
        >
          Data spare part PT Bintang Toedjoe Site Pulogadung
        </p>

        {/* Quick Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <Card
            theme={theme}
            title="Lifetime"
            desc="Monitoring Penggantian Spare Part"
            onClick={() => router.push("/dashboard/lifetime/overview")}
          />
          <Card
            theme={theme}
            title="Kanban Internal"
            desc="PR • PO • Tracking Internal"
            onClick={() => router.push("/dashboard/kanban/internal")}
          />
          <Card
            theme={theme}
            title="Kanban Eksternal"
            desc="PR • PO • Tracking Eksternal"
            onClick={() => router.push("/dashboard/kanban/external")}
          />
        </div>

        {/* Main Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/dashboard/lifetime/overview")}
          className={`
            px-8 py-3 rounded-lg shadow-md transition-all duration-300 text-white font-medium text-lg
            ${theme === "light" ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"}
          `}
        >
          Masuk ke Dashboard
        </motion.button>
      </motion.div>

      {/* Footer */}
      <p
        className={`
          absolute bottom-5 left-1/2 transform -translate-x-1/2 text-sm
          ${theme === "light" ? "text-slate-600" : "text-slate-400"}
        `}
      >
        © {new Date().getFullYear()} | Bintang Toedjoe Squad Batch 4
      </p>
    </div>
  );
}

/* Component kartu menu */
function Card({ title, desc, onClick, theme }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`
        p-5 rounded-xl cursor-pointer border shadow-md transition-all
        ${theme === "light"
          ? "bg-white border-slate-200"
          : "bg-slate-800 border-slate-700 text-white"
        }
      `}
      onClick={onClick}
    >
      <div className="text-lg font-semibold text-blue-700 dark:text-blue-400">
        {title}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-300">{desc}</p>
    </motion.div>
  );
}
