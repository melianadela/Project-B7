"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { columns } from "./columns";
import { DataTable } from "./data-table";

interface KanbanData {
  category: string;
  deadlinepemesanan: string;
  kodepart: string;
  "leadtime(hari)": string;
  mesin: string;
  onhandinventory: string;
  part: string;
  qtykebutuhanreorder: string;
  qtykebutuhanselanjutnya: string;
  qtyyangdipesan: string;
  reordermax: string;
  reordermin: string;
  status: string;
  supplier: string;
  untukbulan: string;
}

export default function Kanban() {
  const [data, setData] = useState<KanbanData[]>([]);
  const [loading, setLoading] = useState(true);

  const handleKanbanInternal = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sheets?worksheet=KANBAN_INTERNAL");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching kanban data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleKanbanInternal();
  }, [handleKanbanInternal]);

  return (
    <>
      <header className="mb-5">
        <h1 className="text-4xl font-semibold">Kanban Internal</h1>
      </header>
      <div className="flex flex-wrap items-center space-x-4 w-full">
        <Card className="min-w-xs hover:bg-slate-50 hover:cursor-pointer">
          <CardHeader>
            <CardTitle>Total Sparepart</CardTitle>
            <CardDescription>Total Sparepart Kanban Internal</CardDescription>
            <CardAction></CardAction>
          </CardHeader>
          <CardContent>
            <span className="text-2xl">{data?.length} item</span>
          </CardContent>
        </Card>
        <Card className="min-w-xs hover:bg-slate-50 hover:cursor-pointer">
          <CardHeader>
            <CardTitle>Pesan</CardTitle>
            <CardDescription>Part yang harus dipesan bulan ini</CardDescription>
            <CardAction></CardAction>
          </CardHeader>
          <CardContent>
            <span className="text-2xl">3 item</span>
          </CardContent>
        </Card>
      </div>
      {/* Table */}
      <div className="mt-10">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable columns={columns} data={data} />
        )}
      </div>
    </>
  );
}
