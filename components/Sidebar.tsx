"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Video, User, HelpCircle, LogOut } from "lucide-react";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: BookOpen, label: "Cursos", href: "/" },
    { icon: Video, label: "Vídeos", href: "/videos" },
    { icon: User, label: "Meu Perfil", href: "/perfil" },
  ];

  const bottomItems = [
    { icon: HelpCircle, label: "Suporte", href: "/suporte" },
    { icon: LogOut, label: "Logout", href: "/logout" },
  ];

  return (
    <Sidebar collapsible="icon" className="border-none">
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shrink-0" />
          <h1 className="text-base font-bold text-white whitespace-nowrap group-data-[collapsible=icon]:hidden">
            OrtoQBank
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={cn(
                              "text-white/80 hover:text-white hover:bg-white/10",
                              isActive && "bg-white/20 text-white hover:bg-white/20"
                            )}
                          >
                            <Link href={item.href}>
                              <Icon size={16} />
                              <span className="text-xs">{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="group-data-[collapsible=icon]:flex hidden">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="bg-white/20" />
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-white/60 group-data-[collapsible=icon]:hidden">
            Usuário
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            className="text-white/80 hover:text-white hover:bg-white/10"
                          >
                            <Link href={item.href}>
                              <Icon size={16} />
                              <span className="text-xs">{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="group-data-[collapsible=icon]:flex hidden">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

