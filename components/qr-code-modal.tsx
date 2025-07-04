"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeCanvas } from "qrcode.react";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    code: string;
    name: string;
    location: string;
  };
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export function QRCodeModal({ open, onClose, data }: QRCodeModalProps) {
  const url = `${BASE_URL}/forms?code=${data.code}&name=${data.name}&location=${data.location}`;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <QRCodeCanvas value={url} size={256} className="mb-4" />
          <p className="text-center text-sm text-gray-600">
            Scan this QR code to access the form for{" "}
            <strong>{data.name}</strong> at <u>{data.location}</u>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
