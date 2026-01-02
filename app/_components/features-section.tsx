"use client";

import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Award, BookOpen, Clock, PlayCircle, Users, Video } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Por que escolher o OrtoQBank Vídeos?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Video className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Videoaulas Completas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Conteúdo em vídeo de alta qualidade cobrindo todos os tópicos do
                TEOT
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Professores Especialistas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Aprenda com profissionais aprovados e experientes na área
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="w-1   2 h-12 text-blue-600 mb-4" />
              <CardTitle>Estude no Seu Ritmo</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Acesso ilimitado para assistir quando e onde quiser
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Material Complementar</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                PDFs e resumos para complementar seu aprendizado
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Award className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Acompanhe seu Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Sistema de controle para você saber exatamente onde está
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <PlayCircle className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Sempre Atualizado</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Novos conteúdos adicionados regularmente
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
