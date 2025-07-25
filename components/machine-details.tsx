"use client";

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
  TableHead,
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

interface PieChartData {
  name: string;
  value: number;
  fill?: string;
}

interface OverdueTableProps {
  data: Sparepart[];
}

interface PieChartDistributionProps {
  data: PieChartData[];
}

interface SparepartTableProps {
  data: Sparepart[];
}

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
  return <span className={`px-5 py-1 rounded-full ${color}`}>{status}</span>;
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

const ResponsibilityLabel = ({
  responsibility,
}: {
  responsibility: string;
}) => {
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
  return (
    <span className={`px-2 py-1 rounded-full ${color}`}>{responsibility}</span>
  );
};

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
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="flex flex-col justify-between relative overflow-hidden max-w-[350px] w-full">
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
      <Card className="flex flex-col justify-between relative overflow-hidden max-w-[350px] w-full">
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
      <Card className="flex flex-col justify-between relative overflow-hidden max-w-[350px] w-full">
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
      <Card className="flex flex-col justify-between relative overflow-hidden max-w-[350px] w-full">
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

export function OverdueTable({ data }: OverdueTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  return (
    <Card className="flex flex-col overflow-hidden relative">
      <BorderBeam
        duration={6}
        size={400}
        className="from-transparent via-slate-600 to-transparent"
      />
      <BorderBeam
        duration={6}
        delay={3}
        size={400}
        borderWidth={2}
        className="from-transparent via-slate-600 to-transparent"
      />
      <CardHeader className="items-center pb-0">
        <CardTitle>Sparepart Overdue</CardTitle>
        <CardDescription>
          Daftar sparepart yang melewati jadwal penggantian
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Lifetime</TableHead>
              <TableHead>Last Replace</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((sparepart, index) => (
              <TableRow key={index}>
                <TableCell>{sparepart.kodepart}</TableCell>
                <TableCell>{sparepart.part}</TableCell>
                <TableCell>
                  <CategoryLabel category={sparepart.category} />
                </TableCell>
                <TableCell>{sparepart["lifetime(bulan)"]}</TableCell>
                <TableCell>{sparepart.penggantianterakhir}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PieChartDistribution({ data }: PieChartDistributionProps) {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
  const chartConfig = {
    sparepart: {
      label: "Sparepart",
      color: "#CCCCCC",
    },
    "Sparepart yang akan habis umur": {
      label: "Sparepart yang akan habis umur",
      color: COLORS[0],
    },
    "Sparepart overdue": {
      label: "Sparepart overdue",
      color: COLORS[1],
    },
    "Sparepart OK": {
      label: "Sparepart OK",
      color: COLORS[2],
    },
  } satisfies ChartConfig;

  const validData = data
    .filter((item) => item.value > 0)
    .map((item) => ({
      ...item,
      fill: chartConfig[item.name as keyof typeof chartConfig]?.color || "#CCCCCC",
    }));

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Distribusi Sparepart</CardTitle>
        <CardDescription>Berdasarkan status umur sparepart</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {validData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[400px]"
          >
            <PieChart accessibilityLayer data={validData}>
              <Pie dataKey="value" innerRadius={60} outerRadius={120}>
                {validData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
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

export function SparepartTable({ data }: SparepartTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [responsibilityFilter, setResponsibilityFilter] = useState("all");
  const itemsPerPage = 10;

  const filteredData = data.filter(
    (item) =>
      (item.part.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kodepart.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (categoryFilter === "all" || item.category === categoryFilter) &&
      (statusFilter === "all" || item.status === statusFilter) &&
      (responsibilityFilter === "all" ||
        item.tanggungjawab === responsibilityFilter)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Daftar Sparepart</CardTitle>
        <CardDescription>
          Daftar seluruh sparepart pada mesin ini
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="flex items-center py-4 gap-2">
          <Input
            placeholder="Search by part name or code..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="max-w-sm"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Vital">Vital</SelectItem>
              <SelectItem value="Desirable">Desirable</SelectItem>
              <SelectItem value="Essential">Essential</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Segera Jadwalkan Penggantian">
                Segera Jadwalkan Penggantian
              </SelectItem>
              <SelectItem value="Melewati Jadwal Penggantian">
                Melewati Jadwal Penggantian
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={responsibilityFilter}
            onValueChange={setResponsibilityFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Responsibility" />
            </SelectTrigger>
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
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Lifetime</TableHead>
              <TableHead>Last Replace</TableHead>
              <TableHead>Next Replace</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsibility</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((sparepart, index) => (
              <TableRow key={index}>
                <TableCell>{sparepart.kodepart}</TableCell>
                <TableCell>{sparepart.part}</TableCell>
                <TableCell>{sparepart.qty}</TableCell>
                <TableCell>
                  <CategoryLabel category={sparepart.category} />
                </TableCell>
                <TableCell>{sparepart["lifetime(bulan)"]}</TableCell>
                <TableCell>{sparepart.penggantianterakhir}</TableCell>
                <TableCell>{sparepart.penggantianselanjutnya}</TableCell>
                <TableCell>
                  <StatusLabel status={sparepart.status} />
                </TableCell>
                <TableCell>
                  <ResponsibilityLabel
                    responsibility={sparepart.tanggungjawab}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages} ({data.length} items)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
