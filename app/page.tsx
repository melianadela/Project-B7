"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

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
      <div className="absolute top-2 left-6 z-20 flex items-center space-x-3">
        <Image
          src="/companylogo.png"
          alt="Bintang Toedjoe"
          width={280}
          height={280}
          className="object-contain"
          priority
        />
      </div>

      {/* === Konten utama === */}
      {/* Background blobs */}
      <div className="absolute -top-24 -left-32 w-[500px] h-[500px] bg-[#d7effb]/40 rounded-full blur-[140px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#b5e0f3]/30 rounded-full blur-[160px]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        {/* Judul */}
        <h1 className="text-4xl font-bold mb-3 text-[#0f265c]">
          Selamat Datang di Sistem Dashboard Spare Part
        </h1>

        {/* Subjudul */}
        <p className="text-slate-500 mb-8 text-lg whitespace-nowrap">
          Data spare part PT Bintang Toedjoe Site Pulogadung
        </p>

        {/* Tombol */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/dashboard/lifetime/overview")}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-blue-500/30 transition-all duration-300 text-white font-medium text-lg"
        >
          Masuk ke Dashboard 🚀
        </motion.button>
      </motion.div>

        {/* Footer di tengah bawah */}
        <p className="absolute bottom-5 left-1/2 transform -translate-x-1/2 text-sm text-slate-600">
          © Eli & Nadya | Bintang Toedjoe Squad Batch 4
        </p>
    </div>
  );
}
