// components/machine-details.tsx
"use client";

import { Wrench, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShineBorder } from "./magicui/shine-border";
import { useTheme } from "next-themes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead, // TableHead is the cell header element
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { BorderBeam } from "./magicui/border-beam";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";


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
  // callbacks menerima "show" callback agar komponen page bisa tetap mengontrol data
  onTotalClick?: (showWith: (data: Sparepart[]) => void) => void;
  onExpiringClick?: (showWith: (data: Sparepart[]) => void) => void;
  onOverdueClick?: (showWith: (data: Sparepart[]) => void) => void;
  onOkClick?: (showWith: (data: Sparepart[]) => void) => void;
}

interface PieChartData {
  name: string;
  value: number;
  fill?: string;
}

interface OverdueTableProps {
  data: Sparepart[];
  showMachine?: boolean;
}

interface PieChartDistributionProps {
  data: PieChartData[];
}

interface SparepartTableProps {
  data: Sparepart[];
  showMachine?: boolean;
  worksheet: string;
}

/* --- Helper UI Labels --- */
const StatusLabel = ({ status }: { status: string }) => {
  let color = "";
  switch (status) {
    case "Melewati Jadwal Penggantian":
      color = "bg-red-100 text-red-500";
      break;
    case "Segera Jadwalkan Penggantian":
      color = "bg-yellow-100 text-yellow-600";
      break;
    default:
      color = "bg-gray-50 text-black";
  }
  return <span className={`px-3 py-1 rounded-full ${color}`}>{status || "-"}</span>;
};

const CategoryLabel = ({ category }: { category: string }) => {
  let color = "";
  switch (category) {
    case "Vital":
      color = "bg-red-100 text-red-500";
      break;
    case "Desirable":
      color = "bg-green-100 text-green-500";
      break;
    case "Essential":
      color = "bg-yellow-100 text-yellow-500";
      break;
    default:
      color = "";
  }
  return <span className={`px-2 py-1 rounded-full ${color}`}>{category}</span>;
};

const ResponsibilityLabel = ({ responsibility }: { responsibility: string }) => {
  let color = "";
  switch (responsibility) {
    case "PM":
      color = "bg-indigo-500 text-white";
      break;
    case "AM":
      color = "bg-pink-500 text-white";
      break;
    default:
      color = "bg-gray-50 text-black";
  }
  return <span className={`px-2 py-1 rounded-full ${color}`}>{responsibility}</span>;
};

/* --- Simple Modal (self-contained) --- */
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-[95vw] bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-auto max-h-[85vh] p-2">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white bg-slate-800 shadow-md hover:bg-slate-700 hover:shadow-lg active:scale-95 transition transform rounded-md"
          >
            Close
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* --- MachineStatsCards (now manages a modal inside) --- */
export function MachineStatsCards({
  worksheet,
  machine,
  onTotalClick,
  onExpiringClick,
  onOverdueClick,
  onOkClick,
}: MachineStatsCardsProps) {
  const [stats, setStats] = useState({ total: 0, expiringSoon: 0, overdue: 0, ok: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState<Sparepart[]>([]);
  const theme = useTheme();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/sheets?worksheet=${worksheet}`);
        const result = await response.json();

        if (result.success) {
          let data = result.data as Sparepart[];

          // 🔧 Filter mesin yang sesuai
          if (machine && machine !== "ALL") {
            const worksheetUpper = worksheet.toUpperCase().trim();
            const machineUpper = machine.toUpperCase().trim();

            data = data.filter((item) => {
              const itemMachine = (item.mesin || "").toUpperCase().trim();

              // Jika worksheet & machine berbeda (misal MIXING TANK - SILVERSON)
              if (worksheetUpper !== machineUpper) {
                return itemMachine === machineUpper;
              }

              // Jika worksheet & machine sama dasar (misal SUPER MIXER & SUPER MIXER 1)
              return (
                itemMachine === machineUpper ||
                itemMachine === `${machineUpper}` // exact match
              );
            });
          }

          // Hitung statistik
          const total = data.length;
          const expiringSoon = data.filter((item) =>
            item.status?.toLowerCase().includes("segera jadwalkan")
          ).length;
          const overdue = data.filter((item) =>
            item.status?.toLowerCase().includes("melewati jadwal")
          ).length;
          const ok = data.filter(
            (item) =>
              item.status &&
              !item.status.toLowerCase().includes("segera jadwalkan") &&
              !item.status.toLowerCase().includes("melewati jadwal")
          ).length;

          setStats({ total, expiringSoon, overdue, ok });
        }
      } catch (err) {
        console.error("fetch failed", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [worksheet, machine]);

  // Modal handler
  const showModalWith = (
    title: string,
    d: Sparepart[],
    externalCb?: (showWith: (data: Sparepart[]) => void) => void
  ) => {
    setModalTitle(title);
    setModalData(d);
    setModalOpen(true);
    if (externalCb) {
      externalCb((override) => {
        setModalData(override);
      });
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex items-center justify-between pb-2">
              <CardTitle>
                <Skeleton className="h-4 w-40" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* TOTAL */}
        <Card
          onClick={() => showModalWith("Semua Spare Part", [], onTotalClick)}
          className={`
            cursor-pointer p-6 rounded-2xl shadow-lg 
    bg-gradient-to-br from-sky-500 to-blue-600 text-white
    transition-all duration-300 transform hover:scale-[1.03]
    hover:shadow-xl border border-white/10 dark:border-white/5
    min-h-[170px]
          `}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold drop-shadow-sm">
              Total Spare Part Terpantau
            </h3>
            <Wrench className="w-14 h-14 text-white/70" />
          </div>

          <div className="mt-4 text-6xl font-extrabold drop-shadow-sm">
            {stats.total}
            <span className="ml-2 text-xl font-medium text-white/80">Item</span>
          </div>
        </Card>

      {/* EXPIRING */}
      <Card
        onClick={() => showModalWith("Spare Part Akan Habis Umur", [], onExpiringClick)}
        className={`
          cursor-pointer p-6 rounded-2xl shadow-lg
          bg-gradient-to-br from-yellow-400 to-amber-500
          transition-all duration-300 transform hover:scale-[1.03]
          hover:shadow-xl border border-white/10 dark:border-white/5
          text-white min-h-[170px]
        `}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold drop-shadow-sm">
            Spare Part Akan Habis Umur
          </h3>
          <Clock className="w-14 h-14 text-white/70" />
        </div>
        <div className="mt-2 text-6xl font-extrabold drop-shadow-sm">
          {stats.expiringSoon}
          <span className="ml-2 text-xl font-medium text-white/80">Item</span>
        </div>
      </Card>

        {/* OVERDUE */}
        <Card
          onClick={() => showModalWith("Spare Part Overdue", [], onOverdueClick)}
          className={`
            cursor-pointer p-6 rounded-2xl shadow-lg 
            bg-gradient-to-br from-red-500 to-red-700 text-white
            transition-all duration-300 transform hover:scale-[1.03]
            hover:shadow-xl border border-white/10 dark:border-white/5 min-h-[170px]
          `}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold drop-shadow-sm">Spare Part Overdue</h3>
            <AlertTriangle className="w-14 h-14 text-white/70" />
          </div>

          <div className="mt-4 text-6xl font-extrabold drop-shadow-sm">
            {stats.overdue}
            <span className="ml-2 text-xl font-medium text-white/80">Item</span>
          </div>
        </Card>

        {/* OK */}
        <Card
          onClick={() => showModalWith("Spare part OK", [], onOkClick)}
          className={`
            cursor-pointer p-6 rounded-2xl shadow-lg 
            bg-gradient-to-br from-green-500 to-emerald-600 text-white
            transition-all duration-300 transform hover:scale-[1.03]
            hover:shadow-xl border border-white/10 dark:border-white/5 min-h-[170px]
          `}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold drop-shadow-sm">Spare Part Aktif (OK)</h3>
            <CheckCircle className="w-14 h-14 text-white/70" />
          </div>

          <div className="mt-4 text-6xl font-extrabold drop-shadow-sm">
            {stats.ok}
            <span className="ml-2 text-xl font-medium text-white/80">Item</span>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
      >
        <SparepartTable data={modalData} showMachine={true} worksheet={worksheet} />
      </Modal>
    </>
  );
}

/* --- OverdueTable --- */
export function OverdueTable({ data, showMachine = false }: OverdueTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card>
      <BorderBeam duration={6} size={400} className="from-transparent via-slate-600 to-transparent" />
      <CardHeader>
        <CardTitle>Spare Part Overdue</CardTitle>
        <CardDescription>Daftar spare part yang melewati jadwal penggantian</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {showMachine && <TableHead>Machine</TableHead>}
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Lifetime</TableHead>
              <TableHead>Last Replace</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((sp, i) => (
              <TableRow key={i}>
                {showMachine && <TableCell>{sp.mesin}</TableCell>}
                <TableCell>{sp.kodepart}</TableCell>
                <TableCell>{sp.part}</TableCell>
                <TableCell><CategoryLabel category={sp.category} /></TableCell>
                <TableCell>{sp["lifetime(bulan)"]}</TableCell>
                <TableCell>{sp.penggantianterakhir}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
              Previous
            </Button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* --- PieChartDistribution (Donut Chart Elegan) --- */
export function PieChartDistribution({ data }: PieChartDistributionProps) {
  const COLORS = ["#e42b2bff", "#f5ff34ff", "#11f611ff"];

  // pastikan hasil map sesuai urutan data kamu:
  const orderedNames = [
    "Spare part overdue",
    "Spare part yang akan habis umur",
    "Spare part OK",
  ];

  const validData = orderedNames
    .map((name) => data.find((d) => d.name === name))
    .filter(Boolean)
    .map((d, i) => ({
      ...d!,
      fill: COLORS[i],
    }));

  return (
    <Card className="w-[1200px] h-[450px]">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
          Distribusi Spare part
        </CardTitle>
        <CardDescription className="text-sm md:text-lg text-gray-500 dark:text-gray-400">
          Berdasarkan status umur spare part
        </CardDescription>
      </CardHeader>

      <CardContent className="flex items-center justify-center">
        {validData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={validData}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={0}
              >
                {validData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>

              {/* Tooltip yang baru muncul pas hover */}
              <Tooltip
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const entry = payload[0];
                  const total = validData.reduce((a, b) => a + b.value, 0);
                  const percent = ((entry.value / total) * 100).toFixed(1);

                  return (
                    <div className="bg-white dark:bg-slate-800 text-sm p-2 rounded shadow-lg border border-gray-300 dark:border-gray-700">
                      <div className="font-semibold">{entry.name}</div>
                      <div>{entry.value} item</div>
                      <div className="text-blue-600 dark:text-blue-400">
                        {percent}%
                      </div>
                    </div>
                  );
                }}
              />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* --- Spare partTable (with export PDF) --- */
export function SparepartTable({ data, showMachine = false, worksheet }: SparepartTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [responsibilityFilter, setResponsibilityFilter] = useState("all");
  const [selectedSparepart, setSelectedSparepart] = useState<Sparepart | null>(null);
  const [tanggalPelaksanaan, setTanggalPelaksanaan] = useState("");
  const [showTanggalModal, setShowTanggalModal] = useState(false);
  const itemsPerPage = 10;

async function handleSubmitTanggal() {
  if (!selectedSparepart || !tanggalPelaksanaan) {
    alert("Mohon isi tanggal pelaksanaan.");
    return;
  }

  try {
    const res = await fetch(
  `/api/sheets?worksheet=${encodeURIComponent(worksheet)}&kodepart=${selectedSparepart.kodepart}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggalPenggantianTerakhir: tanggalPelaksanaan,
        }),
      }
    );

    const result = await res.json();
    if (result.success) {
      alert(`✅ Data ${selectedSparepart.kodepart} berhasil diperbarui`);
      setShowTanggalModal(false);
      window.location.reload();
    } else {
      alert(`❌ Gagal memperbarui: ${result.error || "Unknown error"}`);
    }
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat mengirim data.");
  }
}


  const filteredData = data.filter((item) => {
    const matchSearch = (item.part || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.kodepart || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    const matchResponsibility = responsibilityFilter === "all" || item.tanggungjawab === responsibilityFilter;
    return matchSearch && matchCategory && matchStatus && matchResponsibility;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  function exportPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.text("Daftar Spare part", 40, 40);
    const body = filteredData.map((r) => [
      showMachine ? r.mesin : undefined,
      r.kodepart || "-",
      r.part || "-",
      r.category || "-",
      r["lifetime(bulan)"] || "-",
      r.penggantianterakhir || "-",
      r.penggantianselanjutnya || "-",
      r.status || "-",
      r.tanggungjawab || "-",
    ].filter((c) => c !== undefined));
    const head = (showMachine ? ["Machine", "Code", "Name", "Category", "Lifetime", "Last Replace", "Next Replace", "Status", "Responsibility"]
      : ["Code", "Name", "Category", "Lifetime", "Last Replace", "Next Replace", "Status", "Responsibility"]);
    autoTable(doc, { startY: 60, head: [head], body, styles: { fontSize: 9 }});
    doc.save(`sparepart_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-0">
        <div>
          <CardTitle>Daftar Spare part</CardTitle>
          <CardDescription>Daftar seluruh spare part</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportPDF}><Printer /></Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 py-4">
          <Input placeholder="Search by part or code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Vital">Vital</SelectItem>
              <SelectItem value="Desirable">Desirable</SelectItem>
              <SelectItem value="Essential">Essential</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Segera Jadwalkan Penggantian">Segera Jadwalkan Penggantian</SelectItem>
              <SelectItem value="Melewati Jadwal Penggantian">Melewati Jadwal Penggantian</SelectItem>
            </SelectContent>
          </Select>
          <Select value={responsibilityFilter} onValueChange={setResponsibilityFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Responsibility" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Responsibilities</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
              <SelectItem value="AM">AM</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              {showMachine && <TableHead>Machine</TableHead>}
              <TableHead className="text-center">Code</TableHead>
              <TableHead className="text-center">Name</TableHead>
              <TableHead className="text-center">Category</TableHead>
              <TableHead className="text-center">Lifetime</TableHead>
              <TableHead className="text-center">Last Replace</TableHead>
              <TableHead className="text-center">Next Replace</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Responsibility</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentData.map((sp, idx) => (
              <TableRow key={idx}>
                {showMachine && <TableCell>{sp.mesin}</TableCell>}
                <TableCell>{sp.kodepart}</TableCell>
                <TableCell>{sp.part}</TableCell>
                <TableCell className="text-center"><CategoryLabel category={sp.category} /></TableCell>
                <TableCell className="text-center">{sp["lifetime(bulan)"]}</TableCell>
                <TableCell className="text-center">{sp.penggantianterakhir}</TableCell>
                <TableCell className="text-center">{sp.penggantianselanjutnya}</TableCell>
                <TableCell><StatusLabel status={sp.status} /></TableCell>
                <TableCell className="text-center"><ResponsibilityLabel responsibility={sp.tanggungjawab} /></TableCell>
                <TableCell className="flex justify-center items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setSelectedSparepart(sp);
                      setTanggalPelaksanaan("");
                      setShowTanggalModal(true);
                    }}
                  >
                    Sudah Dilakukan
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
            <span className="text-sm">Page {currentPage} of {totalPages} ({data.length} items)</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        )}
        {showTanggalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg w-[400px]">
              <h3 className="text-lg font-semibold mb-4">
                Tanggal Pelaksanaan - {selectedSparepart?.kodepart}
              </h3>
              <input
                type="date"
                value={tanggalPelaksanaan}
                onChange={(e) => setTanggalPelaksanaan(e.target.value)}
                className="w-full border rounded-md px-3 py-2 mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTanggalModal(false)}>
                  Batal
                </Button>
                <Button onClick={handleSubmitTanggal} className="bg-blue-600 text-white hover:bg-blue-700">
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
