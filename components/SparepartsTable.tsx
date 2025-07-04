"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { SparepartItem } from "@/app/spareparts/lists/columns";

function SparepartsTable() {
  const [spareparts, setSpareparts] = useState<SparepartItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/spareparts");
      const data = await response.json();
      setSpareparts(data);
    }
    fetchData();
  }, []);

  const columns: ColumnDef<SparepartItem>[] = [
    {
      header: "Code",
      accessorKey: "code",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Location",
      accessorKey: "location",
    },
    {
      header: "Actions",
      id: "actions",
      cell: () => (
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: spareparts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default SparepartsTable;
