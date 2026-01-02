"use client";

import { UserButton, useUser } from "@clerk/nextjs";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export default function NavUser() {
  const { user } = useUser();

  if (!user) return;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* Expanded version */}
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden"
          onClick={(e) => {
            // Find and click the UserButton inside
            const buttonElement = (
              e.currentTarget as HTMLElement
            ).querySelector("button");
            if (buttonElement) {
              buttonElement.click();
            }
          }}
        >
          <div>
            <UserButton />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{user.fullName}</span>
            <span className="truncate text-xs">
              {user.primaryEmailAddress?.emailAddress}
            </span>
          </div>
        </SidebarMenuButton>

        {/* Collapsed version - direct UserButton without wrapper */}
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <UserButton />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
