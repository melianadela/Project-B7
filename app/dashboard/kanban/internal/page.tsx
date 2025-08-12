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
import { Button } from "@/components/ui/button";
import { CheckIcon, HourglassIcon, Pencil, X } from "lucide-react";
import { ShineBorder } from "@/components/magicui/shine-border";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { METHODS } from "http";

export interface KanbanData {
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

export interface KanbanDataTracking {
  tanggal: string;
  pr: string;
  po: string;
  tipekanban: string;

  kodepart: string;
  part: string;
  untukbulan: string;
  qtyorder: number;
  uom: string;
  satuan: string;

  harga: string;
  supplier: string;

  tanggalpr: string;
  tanggalpo: string;
  leadtimehari: number;
  eta: string;

  tanggalreceipt: string;
  noreceipt: string;

  status: string;
  keterangan: string;
  pic: string;
}

export default function Kanban() {
  const [data, setData] = useState<KanbanData[]>([]);
  const [dataTracking, setDataTracking] = useState<KanbanDataTracking[]>([]);
  const kanbanNotStarted = data.filter((item) => item.deadlinepemesanan !== "");

  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [currentPo, setCurrentPo] = useState('');
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const handleKanbanInternal = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sheets?worksheet=KANBAN_INTERNAL");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }

      const responseTracking = await fetch(
        "/api/sheets?worksheet=KANBAN_TRACKING"
      );
      const resultTracking = await responseTracking.json();
      if (resultTracking.success) {
        setDataTracking(resultTracking.data);
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

  const processPO = async (item: KanbanDataTracking) => {
    const response = await fetch(`/api/sheets/sheets?worksheet=KANBAN_TRACKING?kodepart=${item.kodepart}&po=${currentPo}&tanggalpo=${currentDate?.toISOString().split('T')[0]}&status=PO Process`, {
      method: "PATCH",
    })
    response.json().then((data) => {
      handleKanbanInternal();
      setCurrentPo('');
      setCurrentDate(undefined);
    })
  }

  return (
    <>
      <header className="mx-auto">
        <h1 className="text-4xl font-semibold mb-4">Kanban Internal</h1>
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
              <CardDescription>
                Part yang harus dipesan bulan ini
              </CardDescription>
              <CardAction></CardAction>
            </CardHeader>
            <CardContent>
              <span className="text-2xl">{kanbanNotStarted?.length} item</span>
            </CardContent>
          </Card>
        </div>
      </header>
      {/* Kanban Board */}
      <div className="mt-10 flex items-center justify-around">
        {/* Not Started */}
        <div className="w-1/4 min-h-[50vh] max-h-[50vh] shadow-md rounded-md overflow-y-scroll relative">
          <h2 className="font-semibold text-xl sticky p-5 top-0 backdrop-blur-lg z-10 flex items-center justify-between space-x-3 dark:bg-black/80">
            <span>Not Started</span>
            <X />
          </h2>
          <div className="p-5 space-y-3">
            {kanbanNotStarted.map((item) => (
              <div
                key={item.kodepart}
                className="w-full h-56 border p-5 rounded-lg flex flex-col justify-between bg-red-50 dark:text-secondary relative overflow-hidden"
              >
                <ShineBorder
                  shineColor={["#ef4444", "#f87171", "#fca5a5"]}
                  className="absolute inset-0"
                />
                <div>
                  <h1 className="font-bold">{item.part}</h1>
                  <span className="">{item.kodepart}</span>
                  <p className="text-lg text-red-700">{item.untukbulan}</p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-md">
                      Qty yang harus dipesan: {item.qtyyangdipesan}
                    </p>
                    <p className="text-md">
                      Deadline:{" "}
                      {new Date(item.deadlinepemesanan).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <Button
                    className="hover:cursor-pointer bg-red-200 text-red-800 hover:bg-red-300"
                    onClick={() => {
                      window.location.href = `/form-pr?code=${item.kodepart}&part=${item.part}&month=${item.untukbulan}&vendor=${item.supplier}&quantity=${item.qtyyangdipesan}`;
                    }}
                  >
                    Buat PR
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* In Progress */}
        <div className="w-1/4 min-h-[50vh] max-h-[50vh] shadow-md rounded-md overflow-y-scroll relative">
          <h2 className="font-semibold text-xl sticky p-5 top-0 backdrop-blur-lg z-10 flex items-center justify-between space-x-3 dark:bg-black/80">
            <span>On Process</span>
            <HourglassIcon />
          </h2>
          <div className="p-5 space-y-3">
            {dataTracking
              .filter(
                (item) =>
                  item.tipekanban === "INTERNAL" &&
                  item.status.includes("Process")
              )
              .map((item) => (
                <div
                  key={item.kodepart}
                  className="w-full h-56 border p-5 rounded-lg flex flex-col justify-between bg-yellow-50 dark:text-secondary relative overflow-hidden"
                >
                  <ShineBorder
                    shineColor={["#eab308", "#facc15", "#fde047"]}
                    className="absolute inset-0"
                  />
                  <div>
                    <h1 className="font-bold">{item.part}</h1>
                    <span className="">{item.kodepart}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-md">
                        Qty yang harus dipesan: {item.qtyorder}
                      </p>
                      <p className="text-md underline">{item.status}</p>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button className="hover:cursor-pointer scale-90">
                          <Pencil />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                          <h3 className="text-md mb-2 font-semibold">{item.tanggalpo ? "PO Process" :  "PR Process"}</h3>
                          <Input type="text" id="po" name="po" className="mb-5" placeholder="Nomor PO" value={currentPo} onChange={(e) => setCurrentPo(e.target.value)} />
                          <span className="text-sm mt-10 text-foreground ml-1">Tanggal PO</span>
                          <Calendar
                              mode="single"
                              selected={currentDate}
                              captionLayout="dropdown"
                              onSelect={(date) => {
                                setCurrentDate(date)
                              }}
                            />
                            <Button className="mt-7" onClick={() => processPO(item)}>
                              Save
                            </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ))}
          </div>
        </div>
        {/* Completed */}
        <div className="w-1/4 min-h-[50vh] max-h-[50vh] shadow-md rounded-md overflow-y-scroll relative">
          <h2 className="font-semibold text-xl sticky p-5 top-0 backdrop-blur-lg z-10 flex items-center justify-between space-x-3 dark:bg-black/80">
            <span>Completed</span>
            <CheckIcon />
          </h2>
          <div className="p-5 space-y-3">
            {dataTracking
              .filter((item) => item.status === "Sudah Diterima")
              .map((item) => (
                <div
                  key={item.kodepart}
                  className="w-full h-56 border p-5 rounded-lg flex flex-col justify-between bg-green-50 dark:text-secondary relative overflow-hidden"
                >
                  <ShineBorder
                    shineColor={["#16a34a", "#22c55e", "#4ade80"]}
                    className="absolute inset-0"
                  />
                  <div>
                    <h1 className="font-bold">{item.part}</h1>
                    <span className="">{item.kodepart}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-md">
                        Qty yang harus dipesan: {item.qtyorder}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="my-10 mx-20">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable columns={columns} data={dataTracking} />
        )}
      </div>
    </>
  );
}