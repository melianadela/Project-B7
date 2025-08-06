"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "./data-table-column-header";
import { KanbanDataTracking } from "./page";

function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  let date: Date;
  
  if (dateString.includes('/')) {
    const [d, m, y] = dateString.split('/');
    date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  }
  else if (dateString.includes('-')) {
    date = new Date(dateString);
  }
  else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = dateString.split(' ');
    if (parts.length === 3 && months.includes(parts[1])) {
      return dateString;
    }
    date = new Date(dateString);
  }
  
  if (isNaN(date.getTime())) return dateString;
  
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

export const columns: ColumnDef<KanbanDataTracking>[] = [
  {
    accessorKey: "tanggal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal" />
    ),
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    accessorKey: "PO",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PR" />
    ),
  },
  {
    accessorKey: "tipekanban",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipe Kanban" />
    ),
  },
  {
    accessorKey: "kodepart",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kode Part" />
    ),
  },
  {
    accessorKey: "part",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Part" />
    ),
  },
  {
    accessorKey: "untukbulan",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Untuk Bulan" />
    ),
  },
  {
    accessorKey: "qtyorder",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quantity Order" />
    ),
  },
  {
    accessorKey: "uom",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="UOM" />
    ),
  },
  {
    accessorKey: "harga(daripr/po)",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Harga dari PR/PO" />
    ),
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supplier" />
    ),
  },
  {
    accessorKey: "tanggalpr",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal PR" />
    ),
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    accessorKey: "tanggalpo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal PO" />
    ),
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    accessorKey: "leadtime(hari)",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lead Time (hari)" />
    ),
  },
  {
    accessorKey: "eta",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ETA" />
    ),
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    accessorKey: "tanggalreceipt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal Receipt" />
    ),
    cell: ({ getValue }) => formatDate(getValue() as string),
  },
  {
    accessorKey: "noreceipt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="No. Receipt" />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
  },
  {
    accessorKey: "keterangan",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Keterangan" />
    ),
  },
  {
    accessorKey: "pic",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PIC" />
    ),
  },
];