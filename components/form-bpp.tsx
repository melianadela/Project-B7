"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  date: z.date({
    required_error: "Tanggal wajib diisi",
  }),
  location: z.string().min(5, "Lokasi wajib diisi"),
  codeItem: z.string().min(20, "Kode Barang wajib diisi"),
  nameItem: z.string().min(100, "Nama Barang wajib diisi"),
  reason: z.string().min(50, "Alasan wajib diisi"),
  quantity: z.number().min(1, "Jumlah minimal 1"),
  uom: z.string().min(1, "Satuan wajib diisi"),
  keyUser: z.string().min(1, "Pengguna Kunci wajib diisi"),
  requester: z.string().min(5, "Pemohon wajib diisi"),
  status: z.enum(["Draft", "Submitted", "Approved", "Rejected"], {
    errorMap: () => ({
      message: "Status wajib dipilih",
    }),
  }),
  workRequest: z.string().min(5, "Permintaan Kerja wajib diisi"),
  workOrder: z.string().min(5, "Perintah Kerja wajib diisi"),
  newCode: z.string().optional(),
  isChecked: z.boolean().optional(),
  formNumber: z.string().min(1, "Nomor Form wajib diisi"),
  costAllocation: z.string().min(5, "Alokasi Biaya wajib diisi"),
});

const statusOptions = [
  { value: "Draft", label: "Draft" },
  { value: "Submitted", label: "Diajukan" },
  { value: "Approved", label: "Disetujui" },
  { value: "Rejected", label: "Ditolak" },
];

export function FormBPP({
  codeItem,
  nameItem,
  location,
}: {
  codeItem: string;
  nameItem: string;
  location: string;
}) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(), // Menggunakan Date object langsung
      location,
      codeItem,
      nameItem,
      reason: "",
      quantity: 1,
      uom: "",
      keyUser: "WIDYAN",
      requester: "",
      status: "Draft" as const,
      workRequest: "",
      workOrder: "",
      newCode: "",
      isChecked: false,
      formNumber: "",
      costAllocation: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    console.log("Form dikirim:", data);
  };

  const getStatusLabel = (value: string) => {
    return (
      statusOptions.find((option) => option.value === value)?.label || value
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Informasi Dasar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: id })
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Pilih tanggal pengajuan form
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="formNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Form</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Masukkan nomor form" />
                  </FormControl>
                  <FormDescription>Nomor identifikasi form</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="cursor-not-allowed">
                  <FormLabel>Lokasi</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="bg-gray-50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white hover:bg-gray-50 cursor-pointer">
                          <span>{getStatusLabel(field.value)}</span>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        <DropdownMenuLabel>Pilih Status</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          {statusOptions.map((option) => (
                            <DropdownMenuRadioItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Informasi Barang */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="codeItem"
              render={({ field }) => (
                <FormItem className="cursor-not-allowed">
                  <FormLabel>Kode Sparepart</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="bg-gray-50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nameItem"
              render={({ field }) => (
                <FormItem className="cursor-not-allowed">
                  <FormLabel>Nama Sparepart</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="bg-gray-50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jumlah</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      min="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UOM</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col space-y-5">
              <FormField
                control={form.control}
                name="newCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Baru (Opsional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Masukkan kode baru jika ada"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isChecked"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-1 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Sudah Diperiksa</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Informasi Permintaan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Alasan</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Contoh: Untuk Mesin ILAPAK 8"
                    />
                  </FormControl>
                  <FormDescription>
                    Jelaskan alasan permintaan barang dengan detail
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keyUser"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key User</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Masukkan nama pengguna kunci"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requester"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pemohon</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Masukkan nama pemohon" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workRequest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Request</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Masukkan nomor permintaan kerja"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Order</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Masukkan nomor perintah kerja"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="costAllocation"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Alokasi Biaya</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Masukkan kode alokasi biaya"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tombol Submit */}
          <div className="flex justify-end pt-3">
            <Button type="submit" size="lg" className="px-8">
              Submit
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
