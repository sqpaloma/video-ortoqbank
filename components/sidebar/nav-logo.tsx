import Image from "next/image";
import Link from "next/link";

import { Separator } from "../ui/separator";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";

export default function NavLogo() {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href="/" onClick={() => setOpenMobile(false)}>
            <div className="flex aspect-square size-6 items-center justify-center rounded-lg">
              <Image
                src="/logo-transparente.png"
                alt="OrtoQBank Logo"
                width={32}
                height={32}
                className="rounded-sm"
              />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-sifonn text-xl font-medium">OrtoQBank</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <Separator />
    </SidebarMenu>
  );
}
