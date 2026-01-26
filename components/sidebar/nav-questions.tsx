"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarSeparator } from "@/components/ui/sidebar";
import Image from "next/image";

export default function QuestionsPromo() {
  const handleVisitClick = () => {
    // Link to Tokebank questions platform
    window.open("https://Ortoclub.com.br/criar-teste", "_blank");
  };

  return (
    <>
      {/* Expanded version - full card */}
      <div className="relative rounded-xl bg-blue-brand border border-white/40 p-3 shadow-lg group-data-[collapsible=icon]:hidden">
        {/* Icon */}
        <div>
          <div className="flex size-14 items-center justify-center rounded-lg">
            <Image
              src="/questoes-transparente.png"
              alt="Ortoclub Logo"
              width={52}
              height={52}
              className="rounded-sm"
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-1 text-base font-semibold text-white">Qbank?</h3>

        {/* Description */}
        <p className="mb-4 text-sm leading-relaxed text-white">
          Fixe o conteúdo com questões direcionadas.
          <br />
          Treine no OrtoQBank exatamente os temas que você acabou de estudar.
        </p>

        {/* CTA Button */}
        <Button
          onClick={handleVisitClick}
          className="w-full bg-white/40 text-white hover:bg-white hover:text-blue-brand"
          size="default"
        >
          Acesse
          <ExternalLink className="size-4" />
        </Button>
      </div>

      {/* Collapsed version - just image and separator */}
      <div className="mb-2 hidden group-data-[collapsible=icon]:block">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleVisitClick}
            className="cursor-pointer transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-sm"
            aria-label="Acessar questões"
          >
            <Image
              src="/questoes-transparente.png"
              alt="Questões"
              width={40}
              height={40}
              className="rounded-sm"
            />
          </button>
        </div>
        <SidebarSeparator className="mt-2" />
      </div>
    </>
  );
}
