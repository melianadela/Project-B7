"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast, { Toaster } from "react-hot-toast";
import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  date: z.string().min(1, "Tanggal harus diisi"),
  noPr: z.string().min(1, "Nomor PR harus diisi"),
  codePart: z.string().min(1, "Kode part harus diisi"),
  part: z.string().min(1, "Nama part harus diisi"),
  formMonth: z.string().min(1, "Bulan form harus diisi"),
  quantity: z.number().min(1, "Jumlah harus lebih dari 0"),
  uom: z.enum(["EA", "Box", "Dus", "Can", "Roll", "SET", "..Others"], {
    errorMap: () => {
      return { message: "Satuan harus dipilih" };
    },
  }),
  vendor: z.string().min(1, "Vendor harus diisi"),
});

export default function FormPRContent() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      noPr: "",
      codePart: params.get("code") || "",
      part: params.get("part") || "",
      formMonth: params.get("month") || "",
      quantity: params.get("quantity")
        ? parseInt(params.get("quantity") ?? "")
        : 1,
      uom: "EA",
      vendor: params.get("vendor") || "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      const response = await fetch("/api/sheets/create-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("PR berhasil disimpan!");

        fetch(
          `/api/sheets?worksheet=KANBAN_INTERNAL&kodepart=${data.codePart}`,
          {
            method: "PATCH",
          }
        )
          .then((r) => r.json())
          .then(console.log);
        setTimeout(() => {
          router.push("/dashboard/kanban/internal");
        }, 3000);
      } else {
        toast.error("Gagal menyimpan data. Silakan coba lagi.");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6 min-h-screen flex justify-center items-center">
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          className: "",
          duration: 5000,
          removeDelay: 1000,

          success: {
            duration: 3000,
          },
        }}
      />
      <div className="rounded-lg shadow-md max-w-2xl min-w-xl p-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <h1 className="text-2xl font-bold mb-6 text-center">
              Form Purchase Request (PR)
            </h1>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" disabled />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="codePart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode Part</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Contoh: PT-001-ABC"
                      type="text"
                      disabled
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="part"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Part</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Bearing 6205"
                      type="text"
                      disabled
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="formMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Untuk Bulan</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Contoh: Januari 2024"
                      type="text"
                      disabled
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noPr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor PR</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="..." type="text" />
                  </FormControl>
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
                      {...field}
                      type="number"
                      min="1"
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih UOM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EA">EA</SelectItem>
                        <SelectItem value="Box">Box</SelectItem>
                        <SelectItem value="Dus">Dus</SelectItem>
                        <SelectItem value="Can">Can</SelectItem>
                        <SelectItem value="Roll">Roll</SelectItem>
                        <SelectItem value="SET">SET</SelectItem>
                        <SelectItem value="..Others">..Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Helieurs" type="text" />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full hover:cursor-pointer">
              {loading ? <Loader2Icon className="animate-spin" /> : "Kirim PR"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
