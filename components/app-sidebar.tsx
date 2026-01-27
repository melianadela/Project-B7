"use client";

import * as React from "react";
import {
  ChevronRight,
  Activity,
  Target,
  BrainCircuit,
  KanbanSquare,
  Users,
  Wrench,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

const data = {
  navLifetime: {
    title: "Lifetime",
    icon: Activity,
    links: [
      { title: "Overview", icon: Target, url: "/dashboard/lifetime/overview" },
    ],
    categories: [
      {
        title: "Machines",
        icon: BrainCircuit,
        items: [
          {
            title: "ILAPAK",
            items: [
              { title: "ILAPAK 1", url: "/dashboard/lifetime/ilapak/1" },
              { title: "ILAPAK 2", url: "/dashboard/lifetime/ilapak/2" },
              { title: "ILAPAK 3", url: "/dashboard/lifetime/ilapak/3" },
              { title: "ILAPAK 4", url: "/dashboard/lifetime/ilapak/4" },
              { title: "ILAPAK 5", url: "/dashboard/lifetime/ilapak/5" },
              { title: "ILAPAK 6", url: "/dashboard/lifetime/ilapak/6" },
              { title: "ILAPAK 7", url: "/dashboard/lifetime/ilapak/7" },
              { title: "ILAPAK 8", url: "/dashboard/lifetime/ilapak/8" },
              { title: "ILAPAK 9", url: "/dashboard/lifetime/ilapak/9" },
              { title: "ILAPAK 10", url: "/dashboard/lifetime/ilapak/10" },
              { title: "ILAPAK 11", url: "/dashboard/lifetime/ilapak/11" },
              { title: "ILAPAK 12", url: "/dashboard/lifetime/ilapak/12" },
            ],
          },
          {
            title: "SIG",
            items: [
              { title: "SIG 5", url: "/dashboard/lifetime/sig/5" },
              { title: "SIG 6", url: "/dashboard/lifetime/sig/6" },
            ],
          },
          {
            title: "UNIFILL",
            items: [
              { title: "UNIFILL A", url: "/dashboard/lifetime/unifill/A" },
              { title: "UNIFILL B", url: "/dashboard/lifetime/unifill/B" },
            ],
          },
          {
            title: "CHIMEI",
            items: [
              { title: "CHIMEI 1", url: "/dashboard/lifetime/chimei/1-(SIG 6)" },
              { title: "CHIMEI 3A", url: "/dashboard/lifetime/chimei/3A-(ILAPAK 1)" },
              { title: "CHIMEI 4B", url: "/dashboard/lifetime/chimei/4B-(ILAPAK 3, 4)" },
              { title: "CHIMEI 5", url: "/dashboard/lifetime/chimei/5-(ILAPAK 5)" },
              { title: "CHIMEI 5B", url: "/dashboard/lifetime/chimei/5-(UNIFILL B)" },
              { title: "CHIMEI 8A", url: "/dashboard/lifetime/chimei/8A-(ILAPAK 8)" },
              { title: "CHIMEI 9A", url: "/dashboard/lifetime/chimei/9A-(ILAPAK 11)" },
              { title: "CHIMEI 10", url: "/dashboard/lifetime/chimei/10-(ILAPAK 2, 12)" },
              { title: "CHIMEI 11", url: "/dashboard/lifetime/chimei/11-(ILAPAK 9, 10)" },
              { title: "CHIMEI 12", url: "/dashboard/lifetime/chimei/12-(ILAPAK 6, 7)" },
            ],
          },
          {
            title: "JINSUNG",
            items: [
              { title: "JINSUNG 1", url: "/dashboard/lifetime/jinsung/1" },
              { title: "JINSUNG 2", url: "/dashboard/lifetime/jinsung/2" },
              { title: "JINSUNG 3", url: "/dashboard/lifetime/jinsung/3" },
              { title: "JINSUNG 4", url: "/dashboard/lifetime/jinsung/4" },
              { title: "JINSUNG 5", url: "/dashboard/lifetime/jinsung/5" },
            ],
          },
          {
            title: "JIHCHENG",
            url: "/dashboard/lifetime/jihcheng/_",
          },
          {
            title: "COSMEC",
            url: "/dashboard/lifetime/cosmec/_",
          },
          {
            title: "FBD",
            items: [
              { title: "FBD GLAT", url: "/dashboard/lifetime/fbd/glat" },
              { title: "FBD 2", url: "/dashboard/lifetime/fbd/2" },
              { title: "FBD 3", url: "/dashboard/lifetime/fbd/3" },
              { title: "FBD 4", url: "/dashboard/lifetime/fbd/4" },
              { title: "FBD 6", url: "/dashboard/lifetime/fbd/6" },
            ],
          },
          {
            title: "TEMACH",
            url: "/dashboard/lifetime/temach/_",
          },
          {
            title: "SUPER MIXER",
            items: [
              { title: "SUPER MIXER", url: "/dashboard/lifetime/super-mixer/_" },
              { title: "SUPER MIXER 1", url: "/dashboard/lifetime/super-mixer/1" },
            ],
          },
          {
            title: "MIXING TANK",
            items: [
              { title: "SILVERSON", url: "/dashboard/lifetime/mixing-tank/silverson" },
              { title: "TETRA 1", url: "/dashboard/lifetime/mixing-tank/tetra-1" },
              { title: "TETRA 2", url: "/dashboard/lifetime/mixing-tank/tetra-2" },
              { title: "TETRA 3", url: "/dashboard/lifetime/mixing-tank/tetra-3" },
            ],
          },
          {
            title: "STORAGE TANK",
            items: [
              { title: "STORAGE TANK 1", url: "/dashboard/lifetime/storage tank/1" },
              { title: "STORAGE TANK 5", url: "/dashboard/lifetime/storage-tank/5" },
              { title: "STORAGE TANK 8", url: "/dashboard/lifetime/storage-tank/8-(RCL-3)" },
              { title: "STORAGE TANK 9", url: "/dashboard/lifetime/storage-tank/9" },
              { title: "STORAGE TANK 10", url: "/dashboard/lifetime/storage-tank/10" },
              { title: "STORAGE TANK 12", url: "/dashboard/lifetime/storage-tank/12" },
              { title: "STORAGE TANK 13", url: "/dashboard/lifetime/storage-tank/13" },
            ],
          },
          {
            title: "AQUADEMIN",
            items: [
              { title: "AQUADEMIN", url: "/dashboard/lifetime/aquademin/_" },
              { title: "AQUADEMIN 1", url: "/dashboard/lifetime/aquademin/1" },
              { title: "AQUADEMIN 2", url: "/dashboard/lifetime/aquademin/2" },
              { title: "AQUADEMIN 3", url: "/dashboard/lifetime/aquademin/3" },
            ],
          },
          {
            title: "DEMIN PANAS",
            url: "/dashboard/lifetime/demin-panas/_",
          },
          {
            title: "BOILER",
            url: "/dashboard/lifetime/boiler/_",
          },
          {
            title: "GENSET",
            url: "/dashboard/lifetime/genset/_",
          },
          {
            title: "CHILLER",
            items: [
              { title: "CHILLER TRANE", url: "/dashboard/lifetime/chiller/trane" },
            ],
          },
          {
            title: "KOMPRESSOR",
            items: [
              { title: "KOMPRESSOR 2", url: "/dashboard/lifetime/kompressor/2" },
              { title: "KOMPRESSOR 3", url: "/dashboard/lifetime/kompressor/3" },
              { title: "KOMPRESSOR ELGI", url: "/dashboard/lifetime/kompressor/elgi" },
            ],
          },
          {
            title: "PURIFIED WATER (PW)",
            items: [
              { title: "PW 1", url: "/dashboard/lifetime/purified-water-(pw)/pw-1" },
              { title: "PW 2", url: "/dashboard/lifetime/purified-water-(pw)/pw-2" },
              { title: "PW 3", url: "/dashboard/lifetime/purified-water-(pw)/pw-3" },
            ],
          },
          {
            title: "AHU",
            items: [
              { title: "AHU 101", url: "/dashboard/lifetime/ahu/ahu-101" },
              { title: "AHU 102", url: "/dashboard/lifetime/ahu/ahu-102" },
              { title: "AHU 103", url: "/dashboard/lifetime/ahu/ahu-103" },
              { title: "AHU 104", url: "/dashboard/lifetime/ahu/ahu-104" },
              { title: "AHU 105", url: "/dashboard/lifetime/ahu/ahu-105" },
              { title: "AHU 106", url: "/dashboard/lifetime/ahu/ahu-106" },
              { title: "AHU 107", url: "/dashboard/lifetime/ahu/ahu-107" },
              { title: "AHU 108", url: "/dashboard/lifetime/ahu/ahu-108" },
              { title: "AHU 110", url: "/dashboard/lifetime/ahu/ahu-110" },
              { title: "AHU 111", url: "/dashboard/lifetime/ahu/ahu-111" },
              { title: "AHU 112", url: "/dashboard/lifetime/ahu/ahu-112" },
              { title: "AHU 113", url: "/dashboard/lifetime/ahu/ahu-113" },
              { title: "AHU 114", url: "/dashboard/lifetime/ahu/ahu-114" },
              { title: "AHU 115", url: "/dashboard/lifetime/ahu/ahu-115" },
              { title: "AHU 116", url: "/dashboard/lifetime/ahu/ahu-116" },
              { title: "AHU 201", url: "/dashboard/lifetime/ahu/ahu-201" },
              { title: "AHU 202", url: "/dashboard/lifetime/ahu/ahu-202" },
              { title: "AHU 203", url: "/dashboard/lifetime/ahu/ahu-203" },
              { title: "AHU 204", url: "/dashboard/lifetime/ahu/ahu-204" },
              { title: "AHU 205", url: "/dashboard/lifetime/ahu/ahu-205" },
              { title: "AHU 207", url: "/dashboard/lifetime/ahu/ahu-207" },
              { title: "AHU 208", url: "/dashboard/lifetime/ahu/ahu-208" },
              { title: "AHU 209", url: "/dashboard/lifetime/ahu/ahu-209" },
              { title: "AHU 210", url: "/dashboard/lifetime/ahu/ahu-210" },
              { title: "AHU 211", url: "/dashboard/lifetime/ahu/ahu-211" },
              { title: "AHU 212", url: "/dashboard/lifetime/ahu/ahu-212" },
              { title: "AHU 213", url: "/dashboard/lifetime/ahu/ahu-213" },
              { title: "AHU 215", url: "/dashboard/lifetime/ahu/ahu-215" },
              { title: "AHU 216", url: "/dashboard/lifetime/ahu/ahu-216" },
              { title: "AHU 217", url: "/dashboard/lifetime/ahu/ahu-217" },
              { title: "AHU 218", url: "/dashboard/lifetime/ahu/ahu-218" },
              { title: "AHU 219", url: "/dashboard/lifetime/ahu/ahu-219" },
              { title: "AHU 220", url: "/dashboard/lifetime/ahu/ahu-220" },
              { title: "AHU 221", url: "/dashboard/lifetime/ahu/ahu-221" },
              { title: "AHU 301", url: "/dashboard/lifetime/ahu/ahu-301" },
              { title: "AHU 302", url: "/dashboard/lifetime/ahu/ahu-302" },
              { title: "AHU 303", url: "/dashboard/lifetime/ahu/ahu-303" },
              { title: "AHU 304", url: "/dashboard/lifetime/ahu/ahu-304" },
              { title: "AHU 305", url: "/dashboard/lifetime/ahu/ahu-305" },
              { title: "AHU 306", url: "/dashboard/lifetime/ahu/ahu-306" },
              { title: "AHU 307", url: "/dashboard/lifetime/ahu/ahu-307" },
              { title: "AHU 308", url: "/dashboard/lifetime/ahu/ahu-308" },
            ],
          },
        ],
      },
    ],
  },
  navKanban: [
    {
      title: "Kanban",
      url: "#",
      icon: KanbanSquare,
      isActive: false,
      items: [
        { title: "Internal", url: "/dashboard/kanban/internal" },
        { title: "External", url: "/dashboard/kanban/external" },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const pathname = usePathname();

  const toggleOpen = (title: string) => {
    setOpen((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActiveLink = (url: string) => {
    return pathname === url;
  };

  return (
    <Sidebar variant="inset" {...props}>
      {/* Header */}
      <SidebarHeader className="border-b h-32 flex items-center px-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-full w-full">
              <Link href="#" className="flex items-center gap-5 h-full">
                <Image
                  src="/companylogo.png"
                  alt="Company Logo"
                  width={150}
                  height={150}
                  className="object-contain"
                />
                <div className="flex flex-col justify-center leading-tight">
                  <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent tracking-wide">
                    E-Ject
                  </span>
                  <span className="text-sm font-medium text-muted-foreground not-italic tracking-tight">
                    Engineering Projects
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-2 -space-y-5">
        {/* Lifetime Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Collapsible
                  open={open[data.navLifetime.title] || false}
                  onOpenChange={() => toggleOpen(data.navLifetime.title)}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="w-full justify-between hover:bg-muted">
                      <div className="flex items-center gap-4">
                        <data.navLifetime.icon className="w-8 h-8" />
                        <span className="text-2xl font-bold">
                          {data.navLifetime.title}
                        </span>
                      </div>
                      <ChevronRight
                        className={`size-4 transition-transform duration-200 ${
                          open[data.navLifetime.title] ? "rotate-90" : ""
                        }`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-6">
                      {/* Overview link */}
                      {data.navLifetime.links.map((link) => (
                        <SidebarMenuSubItem key={link.title}>
                          <Link href={link.url}>
                            <SidebarMenuButton
                              size="sm"
                              className={`w-full justify-start hover:bg-muted ${
                                isActiveLink(link.url) ? "bg-slate-500" : ""
                              }`}
                            >
                              <div className="flex items-center gap-5">
                                <link.icon className="w-7 h-7" />
                                <span className="text-lg font-semibold">{link.title}</span>
                              </div>
                            </SidebarMenuButton>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}

                      {/* Categories */}
                      {data.navLifetime.categories.map((category) => (
                        <SidebarMenuSubItem key={category.title}>
                          <Collapsible
                            open={open[category.title] || false}
                            onOpenChange={() => toggleOpen(category.title)}
                          >
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                size="sm"
                                className="w-full justify-between hover:bg-muted"
                              >
                                <div className="flex items-center gap-3">
                                  <category.icon className="w-7 h-7" />
                                  <span className="text-lg font-semibold">{category.title}</span>
                                </div>
                                <ChevronRight
                                  className={`size-4 transition-transform duration-200 ${
                                    open[category.title] ? "rotate-90" : ""
                                  }`}
                                />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-1">
                              <SidebarMenuSub className="ml-6 space-y-1">
                                {category.items.map((machine) => (
                                  <SidebarMenuSubItem key={machine.title}>
                                    {machine.items &&
                                    machine.items.length > 0 ? (
                                      <Collapsible
                                        open={open[machine.title] || false}
                                        onOpenChange={() =>
                                          toggleOpen(machine.title)
                                        }
                                      >
                                        <CollapsibleTrigger asChild>
                                          <SidebarMenuButton
                                            size="sm"
                                            className="w-full justify-between hover:bg-muted"
                                          >
                                            <span className="text-sm">
                                              {machine.title}
                                            </span>
                                            <ChevronRight
                                              className={`size-4 transition-transform duration-200 ${
                                                open[machine.title]
                                                  ? "rotate-90"
                                                  : ""
                                              }`}
                                            />
                                          </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="mt-1">
                                          <SidebarMenuSub className="ml-6 space-y-1">
                                            {machine.items.map((subItem) => (
                                              <SidebarMenuSubItem
                                                key={subItem.title}
                                              >
                                                <Link href={subItem.url}>
                                                  <SidebarMenuButton
                                                    size="sm"
                                                    className={`w-28 justify-start hover:bg-muted ${
                                                      isActiveLink(subItem.url)
                                                         ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                                                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                                                  >
                                                    <span className="text-sm">
                                                      {subItem.title}
                                                    </span>
                                                  </SidebarMenuButton>
                                                </Link>
                                              </SidebarMenuSubItem>
                                            ))}
                                          </SidebarMenuSub>
                                        </CollapsibleContent>
                                      </Collapsible>
                                    ) : (
                                      <Link href={machine.url!}>
                                        <SidebarMenuButton
                                          size="sm"
                                          className={`w-full justify-start hover:bg-muted ${
                                            isActiveLink(machine.url!)
                                               ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                                        >
                                          <span className="text-sm">
                                            {machine.title}
                                          </span>
                                        </SidebarMenuButton>
                                      </Link>
                                    )}
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </Collapsible>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Kanban Section */}
        <div className="mb-2"></div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {data.navKanban.map((nav) => (
                <SidebarMenuItem key={nav.title}>
                  <Collapsible
                    open={open[nav.title] || false}
                    onOpenChange={() => toggleOpen(nav.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full justify-between hover:bg-muted">
                        <div className="flex items-center gap-4">
                          <nav.icon className="w-8 h-8" />
                          <span className="text-2xl font-bold">
                            {nav.title}
                          </span>
                        </div>
                        <ChevronRight
                          className={`size-4 transition-transform duration-200 ${
                            open[nav.title] ? "rotate-90" : ""
                          }`}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1">
                      <SidebarMenuSub className="ml-6 space-y-1">
                        {nav.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <Link href={item.url}>
                              <SidebarMenuButton
                                size="sm"
                                className={`w-full justify-start hover:bg-muted ${
                                  isActiveLink(item.url)  ? "bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
                                                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                              >
                                <span className="text-lg font-semibold">{item.title}</span>
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pemakaian Section */}
        <div className="mb-2"></div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="w-full justify-between hover:bg-muted"
                >
                  <Link href="/dashboard/pemakaian">
                    <div className="flex items-center gap-4">
                      <ClipboardCheck className="w-8 h-8" />
                      <span className="text-lg font-bold leading-tight text-left whitespace-normal break-words">
                        Pemakaian Kanban Eksternal
                      </span>
                    </div>

                    {/* ikon panah pindah ke kanan, tidak bikin layout pecah */}
                    <ChevronRight className="size-4 opacity-60" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
