"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="`bg-gradient-to-b` from-blue-50 to-white py-20 px-4">
      <div className="container mx-auto max-w-6xl text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Acelere sua aprovação no TEOT
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Aprenda com videoaulas exclusivas ministradas por especialistas
          aprovados
        </p>
        <Button size="lg" className="text-lg px-8 py-6" asChild>
          <Link href="/dashboard">Começar Agora</Link>
        </Button>
      </div>
    </section>
  );
}
