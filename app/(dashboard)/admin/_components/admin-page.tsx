"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  FolderIcon,
  LayersIcon,
  ArrowRightIcon,
  DollarSignIcon,
  PercentIcon,
  UsersIcon,
  BookIcon,
} from "lucide-react";
import Link from "next/link";

export function AdminHub() {
  const { state } = useSidebar();

  const adminPages = [
    {
      title: "Categorias",
      description: "Gerencie as categorias do sistema",
      icon: FolderIcon,
      href: "/admin/categories",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Unidades e Aulas",
      description: "Gerencie unidades e suas aulas",
      icon: LayersIcon,
      href: "/admin/units-lessons",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Planos de Preços",
      description: "Gerencie os planos de preços do sistema",
      icon: DollarSignIcon,
      href: "/admin/pricing-plans",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Cupons",
      description: "Gerencie os cupons do sistema",
      icon: PercentIcon,
      href: "/admin/coupons",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Usuários",
      description: "Gerencie os usuários do sistema",
      icon: UsersIcon,
      href: "/admin/users",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Lista de Espera",
      description: "Gerencie a lista de espera do sistema",
      icon: BookIcon,
      href: "/admin/waitlist",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <div className="min-h-screen bg-white relative">
      {/* Sidebar trigger - follows sidebar position */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light transition-[left] duration-200 ease-linear z-10 ${
          state === "collapsed"
            ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]"
            : "left-[calc(var(--sidebar-width)+0.25rem)]"
        }`}
      />

      {/* Header */}
      <div className="py-6 px-8 flex items-center gap-3 border-b">
        <h1 className="text-2xl font-bold">Administração</h1>
      </div>

      {/* Content */}
      <div className="p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminPages.map((page) => {
              const Icon = page.icon;
              return (
                <Link key={page.href} href={page.href}>
                  <Card className="h-full transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-lg ${page.bgColor}`}>
                          <Icon className={`h-6 w-6 ${page.color}`} />
                        </div>
                        <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <CardTitle className="mt-4">{page.title}</CardTitle>
                      <CardDescription>{page.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
