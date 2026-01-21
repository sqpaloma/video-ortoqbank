"use client";

import { HeadsetIcon, type LucideIcon, UserCircleIcon } from "lucide-react";
import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { useSession } from "../providers/session-provider";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  requiresAdmin?: boolean;
}

const items: MenuItem[] = [
  { title: "Suporte", url: "/support", icon: HeadsetIcon },

  {
    title: "Admin",
    url: "/admin",
    icon: UserCircleIcon,
    requiresAdmin: true,
  },
];

export default function NavThird() {
  const { setOpenMobile } = useSidebar();
  const { isAdmin } = useSession();

  // Filter menu items based on tenant-specific admin status
  const visibleItems = items.filter((item) => {
    // If item doesn't require admin, show it to everyone
    if (!item.requiresAdmin) return true;

    // Only show admin items if user is admin of this tenant (or superadmin)
    return isAdmin;
  });

  return (
    <SidebarGroup className="pl-0">
      <SidebarGroupLabel>Usuário</SidebarGroupLabel>
      <SidebarMenu>
        {visibleItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <Link
                href={item.url}
                className="flex items-center gap-3 py-5"
                onClick={() => setOpenMobile(false)}
              >
                <item.icon className="size-5 " />
                <span className="text-base">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
