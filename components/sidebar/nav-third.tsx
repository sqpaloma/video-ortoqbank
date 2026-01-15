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

type UserRole = "admin" | "moderator" | "user";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  requiredRoles?: UserRole[];
}

const items: MenuItem[] = [
  { title: "Suporte", url: "/support", icon: HeadsetIcon },

  {
    title: "Admin",
    url: "/admin",
    icon: UserCircleIcon,
    requiredRoles: ["admin"],
  },
  // Example of a future item that could be available to both admins and moderators
  // {
  //   title: 'Moderação',
  //   url: '/moderacao',
  //   icon: ShieldIcon,
  //   requiredRoles: ['admin', 'moderator']
  // },
];

export default function NavThird() {
  const { setOpenMobile } = useSidebar();
  const { userRole } = useSession();

  // Filter menu items based on user role
  const visibleItems = items.filter((item) => {
    // If item has no role requirements, show it to everyone
    if (!item.requiredRoles) return true;

    // If user has no role, don't show items with role requirements
    if (!userRole) return false;

    // Check if user's role is in the required roles
    return item.requiredRoles.includes(userRole as UserRole);
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
