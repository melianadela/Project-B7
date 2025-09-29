// components/machine-details.tsx
"use client";

import { Wrench, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Pie, PieChart, Cell } from "recharts";
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
      <div className="relative max-w-5xl w-full bg-white dark:bg-slate-900 rounded shadow-lg overflow-auto max-h-[85vh]">
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
          if (machine && machine !== "ALL") {
            data = data.filter((item) => (item.mesin || "").toUpperCase() === (machine || "").toUpperCase());
          }
          const total = data.length;
          const expiringSoon = data.filter((item) => item.status === "Segera Jadwalkan Penggantian").length;
          const overdue = data.filter((item) => item.status === "Melewati Jadwal Penggantian").length;
          const ok = data.filter((item) => item.status && item.status !== "Segera Jadwalkan Penggantian" && item.status !== "Melewati Jadwal Penggantian").length;
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

  // helper show modal with data; also call optional external callback if provided
  const showModalWith = (title: string, d: Sparepart[], externalCb?: ((showWith: (data: Sparepart[]) => void) => void)) => {
    setModalTitle(title);
    setModalData(d);
    setModalOpen(true);
    if (externalCb) {
      // allow parent to override data if needed
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
              <CardTitle><Skeleton className="h-4 w-40" /></CardTitle>
            </CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // card render: clickable area is button inside (tidak langsung pada Card untuk menghindari typing issues)
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total */}
        <Card
          onClick={() => showModalWith("Semua Sparepart", [], onTotalClick)}
          className="cursor-pointer transition hover:scale-105 active:scale-95 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">Total Sparepart Terpantau</h3>
            <Wrench className="w-15 h-15 text-gray-500" />
          </div>
          <div className="mt-4 text-6xl font-bold">
            {stats.total}
            <span className="ml-2 text-xl font-normal text-gray-500">Item</span>
          </div>
        </Card>

        {/* Expiring Soon */}
        <Card
          onClick={() => showModalWith("Sparepart Akan Habis Umur", [], onExpiringClick)}
          className="cursor-pointer transition hover:scale-105 active:scale-95 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">Sparepart Akan Habis Umur</h3>
            <Clock className="w-15 h-15 text-gray-500" />
          </div>
          <p className="text-sm md:text-base lg:text-lg text-gray-700">&lt; 14 hari</p>
          <div className="mt-2 text-6xl font-bold">
            {stats.expiringSoon}
            <span className="ml-2 text-xl font-normal text-gray-500">Item</span>
          </div>
        </Card>

        {/* Overdue */}
        <Card
          onClick={() => showModalWith("Sparepart Overdue", [], onOverdueClick)}
          className="cursor-pointer transition hover:scale-105 active:scale-95 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">Sparepart Overdue</h3>
            <AlertTriangle className="w-15 h-15 text-gray-500" />
          </div>
          <div className="mt-4 text-6xl font-bold">
            {stats.overdue}
            <span className="ml-2 text-xl font-normal text-gray-500">Item</span>
          </div>
        </Card>

        {/* OK */}
        <Card
          onClick={() => showModalWith("Sparepart OK", [], onOkClick)}
          className="cursor-pointer transition hover:scale-105 active:scale-95 hover:shadow-lg rounded-2xl p-6 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold">Sparepart Aktif (OK)</h3>
            <CheckCircle className="w-15 h-15 text-gray-500" />
          </div>
          <div className="mt-4 text-6xl font-bold">
            {stats.ok}
            <span className="ml-2 text-xl font-normal text-gray-500">Item</span>
          </div>
        </Card>
      </div>

      {/* modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
      >
        <SparepartTable data={modalData} showMachine={true} />
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
        <CardTitle>Sparepart Overdue</CardTitle>
        <CardDescription>Daftar sparepart yang melewati jadwal penggantian</CardDescription>
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

/* --- PieChartDistribution --- */
export function PieChartDistribution({ data }: PieChartDistributionProps) {
  const COLORS = ["#f5ff34ff", "#e42b2bff", "#11f611ff", "#FF8042"];
  const chartConfig = {
    sparepart: { label: "Sparepart", color: "#CCCCCC" },
    "Sparepart yang akan habis umur": { label: "Sparepart yang akan habis umur", color: COLORS[0] },
    "Sparepart overdue": { label: "Sparepart overdue", color: COLORS[1] },
    "Sparepart OK": { label: "Sparepart OK", color: COLORS[2] },
  } as unknown as ChartConfig;

  const validData = data.filter((d) => d.value > 0).map((d) => ({ ...d, fill: chartConfig[d.name as keyof typeof chartConfig]?.color || "#CCCCCC" }));

  return (
  <Card className="w-[1200px] h-[450px]">
    <CardHeader className="items-center pb-0">
      <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
        Distribusi Sparepart
      </CardTitle>
      <CardDescription className="text-sm md:text-lg text-gray-500 dark:text-gray-400">
        Berdasarkan status umur sparepart
      </CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-center">
      {validData.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="w-[500px] h-[300px]"  // 👈 bikin fix height & width
        >
          <PieChart>
            <Pie
              data={validData}
              dataKey="value"
              innerRadius={70}
              outerRadius={125}
              paddingAngle={0}
            >
              {validData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent nameKey="name" className="text-base font-medium" />} />
          </PieChart>
        </ChartContainer>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
        </div>
      )}
    </CardContent>
  </Card>
);
}

/* --- SparepartTable (with export PDF) --- */
export function SparepartTable({ data, showMachine = false }: SparepartTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [responsibilityFilter, setResponsibilityFilter] = useState("all");
  const itemsPerPage = 10;

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
    doc.text("Daftar Sparepart", 40, 40);
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
          <CardTitle>Daftar Sparepart</CardTitle>
          <CardDescription>Daftar seluruh sparepart</CardDescription>
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
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Lifetime</TableHead>
              <TableHead>Last Replace</TableHead>
              <TableHead>Next Replace</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsibility</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentData.map((sp, idx) => (
              <TableRow key={idx}>
                {showMachine && <TableCell>{sp.mesin}</TableCell>}
                <TableCell>{sp.kodepart}</TableCell>
                <TableCell>{sp.part}</TableCell>
                <TableCell><CategoryLabel category={sp.category} /></TableCell>
                <TableCell>{sp["lifetime(bulan)"]}</TableCell>
                <TableCell>{sp.penggantianterakhir}</TableCell>
                <TableCell>{sp.penggantianselanjutnya}</TableCell>
                <TableCell><StatusLabel status={sp.status} /></TableCell>
                <TableCell><ResponsibilityLabel responsibility={sp.tanggungjawab} /></TableCell>
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
      </CardContent>
    </Card>
  );
}
