"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShineBorder } from "./magicui/shine-border";
import { useTheme } from "next-themes";

interface Sparepart {
  mesin: string;
  kodepart: string;
  part: string;
  qty: string;
  category: string;
  penggantianterakhir: string;
  "lifetime(bulan)": string;
  penggantianselanjutnya: string;
  status: string;
  tanggungjawab: string;
}

interface MachineStatsCardsProps {
  worksheet: string;
  machine: string;
}

export function MachineStatsCards({
  worksheet,
  machine,
}: MachineStatsCardsProps) {
  const [stats, setStats] = useState({
    total: 0,
    expiringSoon: 0,
    overdue: 0,
    ok: 0,
  });
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/sheets?worksheet=${worksheet}`);
        const result = await response.json();
        if (result.success) {
          const data: Sparepart[] = result.data.filter(
            (item: Sparepart) => item.mesin === machine
          );
          const total = data.length;
          const expiringSoon = data.filter(
            (item) => item.status === "Segera Jadwalkan Penggantian"
          ).length;
          const overdue = data.filter(
            (item) => item.status === "Melewati Jadwal Penggantian"
          ).length;
          const ok = data.filter(
            (item) =>
              item.status !== "Segera Jadwalkan Penggantian" &&
              item.status !== "Melewati Jadwal Penggantian" &&
              item.status !== ""
          ).length;
          setStats({ total, expiringSoon, overdue, ok });
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [worksheet, machine]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-4 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-4 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-4 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <Skeleton className="h-4 w-24" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="flex flex-col justify-between relative overflow-hidde max-w-[350px] w-full">
        <ShineBorder shineColor={theme.theme === "dark" ? "white" : "black"} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-medium">
            Total Sparepart Terpantau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total} Item</div>
        </CardContent>
      </Card>
      <Card className="flex flex-col justify-between relative overflow-hidde max-w-[350px] w-full">
        <ShineBorder shineColor={theme.theme === "dark" ? "white" : "black"} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-medium">
            Sparepart akan habis umur <br />
            (&lt; 14 hari)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.expiringSoon} Item</div>
        </CardContent>
      </Card>
      <Card className="flex flex-col justify-between relative overflow-hidde max-w-[350px] w-full">
        <ShineBorder shineColor={theme.theme === "dark" ? "white" : "black"} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-medium">
            Sparepart Overdue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.overdue} Item</div>
        </CardContent>
      </Card>
      <Card className="flex flex-col justify-between relative overflow-hidde max-w-[350px] w-full">
        <ShineBorder shineColor={theme.theme === "dark" ? "white" : "black"} />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-medium">Sparepart OK</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.ok} Item</div>
        </CardContent>
      </Card>
    </div>
  );
}
