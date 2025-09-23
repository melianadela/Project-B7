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
              { title: "CHIMEI 1", url: "/dashboard/lifetime/chimei/1" },
              { title: "CHIMEI 4", url: "/dashboard/lifetime/chimei/4" },
              { title: "CHIMEI 5", url: "/dashboard/lifetime/chimei/5" },
              { title: "CHIMEI 6", url: "/dashboard/lifetime/chimei/6" },
              { title: "CHIMEI 7", url: "/dashboard/lifetime/chimei/7" },
              { title: "CHIMEI 8", url: "/dashboard/lifetime/chimei/8" },
              { title: "CHIMEI 9", url: "/dashboard/lifetime/chimei/9" },
              { title: "CHIMEI 10", url: "/dashboard/lifetime/chimei/10" },
              { title: "CHIMEI 11", url: "/dashboard/lifetime/chimei/11" },
              { title: "CHIMEI 12", url: "/dashboard/lifetime/chimei/12" },
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
                                  <span className="text-lg font-bold">{category.title}</span>
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
                                                        ? "bg-slate-200"
                                                        : ""
                                                    }`}
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
                                              ? "bg-slate-200"
                                              : ""
                                          }`}
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
                                  isActiveLink(item.url) ? "bg-slate-200" : ""
                                }`}
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

        {/* CMMS Section */}
        <div className="mb-2"></div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full justify-between hover:bg-muted">
                  <div className="flex items-center gap-4">
                    <Wrench className="w-8 h-8" />
                    <span className="text-2xl font-bold">CMMS</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
