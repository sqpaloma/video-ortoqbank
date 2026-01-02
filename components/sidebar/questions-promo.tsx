"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarSeparator } from "@/components/ui/sidebar";
import Image from "next/image";

export default function QuestionsPromo() {
  const handleVisitClick = () => {
    // Link to Tokebank questions platform
    window.open("https://ortoqbank.com.br/criar-teste", "_blank");
  };

  return (
    <>
      {/* Expanded version - full card */}
      <div className="relative mb-3 rounded-xl bg-blue-brand border border-white/40 p-4 shadow-lg group-data-[collapsible=icon]:hidden">
        {/* Icon */}
        <div className="mb-3">
          <div className="flex size-12 items-center justify-center rounded-lg">
            <Image
              src="/questoes-transparente.png"
              alt="OrtoQBank Logo"
              width={52}
              height={52}
              className="rounded-sm"
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-1 text-base font-semibold text-white">Questões?</h3>

        {/* Description */}
        <p className="mb-4 text-sm leading-relaxed text-white">
          Acesse as questões, e se você não as tem, venha ver os planos.
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
        <div className="flex flex-col items-center gap-2 px-2">
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
