import {
  Table,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";

export default function OverdueTable() {
  return (
    <Table>
      <TableCaption>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Quo,
        dignissimos.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Lifetime</TableHead>
          <TableHead>Last Replace</TableHead>
        </TableRow>
      </TableHeader>
    </Table>
  );
}
