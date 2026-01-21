import Image from "next/image";
import Link from "next/link";

import { Separator } from "../ui/separator";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar";
import { useTenant } from "../providers/tenant-provider";

export default function NavLogo() {
  const { setOpenMobile } = useSidebar();
  const { tenantDisplayName, tenantLogoUrl } = useTenant();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton variant="logo" size="lg" asChild>
          <Link href="/" onClick={() => setOpenMobile(false)}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
              <Image
                src={tenantLogoUrl || "/logo.webp"}
                alt={`${tenantDisplayName || "Ortoclub"} Logo`}
                width={32}
                height={32}
                className="rounded-sm"
              />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-sifonn text-xl font-medium">
                {tenantDisplayName || "Ortoclub"}
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <Separator />
    </SidebarMenu>
  );
}
