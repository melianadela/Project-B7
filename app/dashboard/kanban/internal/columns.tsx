"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "./data-table-column-header";
import { KanbanDataTracking } from "./page";

export const columns: ColumnDef<KanbanDataTracking>[] = [
  {
    accessorKey: "tanggal",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal" />
    ),
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
  },
  {
    accessorKey: "tanggalpo",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal PR" />
    ),
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
  },
  {
    accessorKey: "tanggalreceipt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tanggal Receipt" />
    ),
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
