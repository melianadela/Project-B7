"use client";

import * as React from "react";
import {
  Command,
  Database,
  ChevronRight,
  Activity,
  Target,
  BrainCircuit,
  KanbanSquare,
} from "lucide-react";
import Link from "next/link";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  user: {
    name: "User One",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navDataSparepart: [
    {
      title: "Master Data",
      url: "#",
      icon: Database,
      isActive: true,
      items: [
        {
          title: "Spareparts List",
          url: "/spareparts/lists",
        },
        {
          title: "BPP",
          url: "/spareparts/bpp",
        },
      ],
    },
  ],
  navLifetime: [
    {
      title: "Lifetime",
      url: "#",
      icon: Activity,
      isActive: true,
      items: [
        { title: "Overview", icon: Target, url: "/dashboard/projects" },
        {
          title: "Machines",
          icon: BrainCircuit,
          items: [
            {
              title: "ILAPAK",
              url: "#",
              items: [
                { title: "ILAPAK 1", url: "/ilapak/1" },
                { title: "ILAPAK 2", url: "/ilapak/2" },
                { title: "ILAPAK 3", url: "/ilapak/3" },
                { title: "ILAPAK 4", url: "/ilapak/4" },
                { title: "ILAPAK 5", url: "/ilapak/5" },
                { title: "ILAPAK 6", url: "/ilapak/6" },
                { title: "ILAPAK 7", url: "/ilapak/7" },
                { title: "ILAPAK 8", url: "/ilapak/8" },
                { title: "ILAPAK 9", url: "/ilapak/9" },
                { title: "ILAPAK 10", url: "/ilapak/10" },
                { title: "ILAPAK 11", url: "/ilapak/11" },
                { title: "ILAPAK 12", url: "/ilapak/12" },
              ],
            },
            {
              title: "SIG",
              url: "#",
              items: [
                { title: "SIG 5", url: "/sig/5" },
                { title: "SIG 6", url: "/sig/6" },
              ],
            },
            {
              title: "UNIFIL",
              url: "#",
              items: [
                { title: "UNIFIL A", url: "/unifil/1" },
                { title: "UNIFIL B", url: "/unifil/2" },
              ],
            },
            {
              title: "CHIMEI",
              url: "#",
              items: [
                { title: "CHIMEI 1", url: "/chimei/1" },
                { title: "CHIMEI 2", url: "/chimei/2" },
                { title: "CHIMEI 3", url: "/chimei/3" },
                { title: "CHIMEI 4", url: "/chimei/4" },
                { title: "CHIMEI 5", url: "/chimei/5" },
                { title: "CHIMEI 6", url: "/chimei/6" },
                { title: "CHIMEI 7", url: "/chimei/7" },
                { title: "CHIMEI 8", url: "/chimei/8" },
                { title: "CHIMEI 9", url: "/chimei/9" },
                { title: "CHIMEI 10", url: "/chimei/10" },
                { title: "CHIMEI 11", url: "/chimei/11" },
                { title: "CHIMEI 12", url: "/chimei/12" },
              ],
            },
            {
              title: "JINSUNG",
              url: "#",
              items: [
                { title: "JINSUNG 1", url: "/jinsung/1" },
                { title: "JINSUNG 2", url: "/jinsung/2" },
                { title: "JINSUNG 3", url: "/jinsung/3" },
                { title: "JINSUNG 4", url: "/jinsung/4" },
                { title: "JINSUNG 5", url: "/jinsung/5" },
              ],
            },
            {
              title: "JIHCHENG",
              url: "#",
              items: [],
            },
            {
              title: "COSMEC",
              url: "#",
              items: [],
            },
            {
              title: "FBD",
              url: "#",
              items: [
                { title: "FBD GLAT", url: "/fbd/glat" },
                { title: "FBD 2", url: "/fbd/2" },
                { title: "FBD 3", url: "/fbd/3" },
                { title: "FBD 4", url: "/fbd/4" },
                { title: "FBD 6", url: "/fbd/6" },
              ],
            },
          ],
        },
      ],
    },
  ],
  navKanban: [
    {
      title: "Kanban",
      url: "#",
      icon: KanbanSquare,
      isActive: false,
      items: [
        { title: "Tasks", url: "/dashboard/tasks" },
        { title: "Projects", url: "/dashboard/projects" },
        { title: "Teams", url: "/dashboard/teams" },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="sizxs-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">E-Ject</span>
                  <span className="truncate text-xs">Engineering Projects</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Spareparts</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Nav for Main */}
            <SidebarGroup className="-mt-4">
              <SidebarMenu>
                {data.navDataSparepart.map((nav) => (
                  <SidebarMenuItem key={nav.title}>
                    <SidebarMenuButton size="lg" asChild>
                      <Link href={nav.url}>
                        <div className="flex items-center">
                          <nav.icon className="size-4" />
                          <span className="ml-2">{nav.title}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>

                    {nav.items && (
                      <SidebarMenuSub>
                        {nav.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <Link
                              href={item.url}
                              className="text-sm pl-4 pr-2 py-1 block hover:bg-accent rounded"
                            >
                              {item.title}
                            </Link>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            {/* Nav for Lifetime */}
            <SidebarGroup className="-mt-4">
              <SidebarMenu>
                {data.navLifetime.map((nav) => (
                  <SidebarMenuItem key={nav.title}>
                    <SidebarMenuButton size="lg" asChild>
                      <Link href={nav.url}>
                        <div className="flex items-center">
                          <nav.icon className="size-4" />
                          <span className="ml-2">{nav.title}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>

                    {nav.items && (
                      <SidebarMenuSub>
                        {nav.items.map((item) => (
                          <Collapsible
                            key={item.title}
                            defaultOpen={false}
                            className="group/collapsible"
                          >
                            <SidebarMenuItem>
                              <CollapsibleTrigger asChild>
                                <div className="flex items-center w-full pr-2 py-1 text-sm cursor-pointer hover:bg-muted rounded-md">
                                  <item.icon className="size-4 mr-2" />
                                  <span className="flex-1">{item.title}</span>
                                  {item.items && item.items.length > 0 && (
                                    <ChevronRight className="ml-2 transition-transform group-data-[state=open]/collapsible:rotate-90 size-4" />
                                  )}
                                </div>
                              </CollapsibleTrigger>

                              {item.items && item.items.length > 0 && (
                                <CollapsibleContent className="pl-2">
                                  {item.items.map((machine) => (
                                    <Collapsible
                                      key={machine.title}
                                      defaultOpen={false}
                                      className="group/collapsible"
                                    >
                                      <CollapsibleTrigger asChild>
                                        <div className="flex items-center w-full pl-4 pr-2 py-1 text-xs cursor-pointer hover:bg-muted rounded-md my-1.5">
                                          <span className="flex-1">
                                            {machine.title}
                                          </span>
                                          {machine.items &&
                                            machine.items.length > 0 && (
                                              <ChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90 size-3" />
                                            )}
                                        </div>
                                      </CollapsibleTrigger>

                                      {machine.items &&
                                        machine.items.length > 0 && (
                                          <CollapsibleContent className="pl-">
                                            <SidebarMenuSub>
                                              {machine.items.map((subItem) => (
                                                <SidebarMenuSubItem
                                                  key={subItem.title}
                                                >
                                                  <Link
                                                    href={subItem.url}
                                                    className="text-xs pl-4 pr-2 py-1 block hover:bg-accent rounded"
                                                  >
                                                    {subItem.title}
                                                  </Link>
                                                </SidebarMenuSubItem>
                                              ))}
                                            </SidebarMenuSub>
                                          </CollapsibleContent>
                                        )}
                                    </Collapsible>
                                  ))}
                                </CollapsibleContent>
                              )}
                            </SidebarMenuItem>
                          </Collapsible>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            {/* Nav for Kanban */}
            <SidebarGroup className="-mt-4">
              <SidebarMenu>
                {data.navKanban.map((nav) => (
                  <SidebarMenuItem key={nav.title}>
                    <SidebarMenuButton size="lg" asChild>
                      <Link href={nav.url}>
                        <div className="flex items-center">
                          <nav.icon className="size-4" />
                          <span className="ml-2">{nav.title}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
