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

export interface KanbanData {
  category: string;
  deadlinepemesanan: string;
  kodepart: string;
  'leadtime(hari)': string;
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

export const columns: ColumnDef<KanbanData>[] = [
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
    accessorKey: "part",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Part" />
    ),
  },
  {
    accessorKey: "kodepart",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kode Part" />
    ),
  },
  {
    accessorKey: "onhandinventory",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="On Hand" />
    ),
  },
  {
    accessorKey: "qtykebutuhanreorder",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reorder" />
    ),
  },
  {
    accessorKey: "leadtime(hari)",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lead Time" />
    ),
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendor" />
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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.kodepart)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];