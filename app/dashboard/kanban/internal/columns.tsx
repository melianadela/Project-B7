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
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    accessorKey: "Keterangan",
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

  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
