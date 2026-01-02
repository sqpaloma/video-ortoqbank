import {
  BookOpenIcon,
  StarIcon,
  type LucideIcon,
  UserCircleIcon,
} from "lucide-react";
import Link from "next/link";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  prefetch?: boolean; // Add prefetch control
}

const items: MenuItem[] = [
  {
    title: "Meu Perfil",
    url: "/profile",
    icon: UserCircleIcon,
    prefetch: true,
  },
  { title: "Cursos", url: "/categories", icon: BookOpenIcon, prefetch: true },
  { title: "Favoritos", url: "/favorites", icon: StarIcon, prefetch: true },
];

export default function NavMain() {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
              <Link
                href={item.url}
                className="flex gap-3 py-5"
                onClick={() => setOpenMobile(false)}
                data-sidebar={item.url.replace("/", "")}
                {...(item.prefetch !== undefined && {
                  prefetch: item.prefetch,
                })}
              >
                <item.icon className="size-5" />
                <span className="text-base">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
