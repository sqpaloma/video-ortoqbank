"use client";

import { useState } from "react";
import { ChevronLeft, ChevronDown, ChevronRight, PlayCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  lessonsCount: number;
  completedCount: number;
  lessons: Lesson[];
}

interface CourseInnerProps {
  courseData: {
    title: string;
    subtitle: string;
    progress: number;
    modules: Module[];
  };
}

export function CourseInner({ courseData }: CourseInnerProps) {
  const router = useRouter();
  const [expandedModules, setExpandedModules] = useState<string[]>(["1"]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(
    courseData.modules[0]?.lessons[0] || null
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  const handleMarkAsCompleted = () => {
    if (selectedLesson) {
      // TODO: Implementar mutation do Convex
      console.log("Marcar como concluída:", selectedLesson.id);
    }
  };

  const handleNextLesson = () => {
    // TODO: Implementar lógica de próxima aula
    console.log("Próxima aula");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b">
        <div className="p-6 flex items-center gap-4">
          <SidebarTrigger className="text-blue-brand hover:text-blue-brand-dark hover:bg-blue-brand-light" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            <ChevronLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{courseData.title}</h1>
            <p className="text-sm text-gray-600">{courseData.subtitle}</p>
          </div>
        </div>

      </div>

      <div className="flex px-42">
        {/* Sidebar com módulos e aulas */}
        <div className="w-[480px] mr-20">
          {/* Progress Bar */}
          <div className="px-6 py-12">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Progresso</span>
              <div className="flex-1">
                <Progress value={courseData.progress} className="h-2" />
              </div>
              <span className="text-sm font-semibold text-gray-900">{courseData.progress}%</span>
            </div>
          </div>

          <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: "calc(100vh - 250px)" }}>
          {courseData.modules.map((module) => {
            const isExpanded = expandedModules.includes(module.id);
            return (
              <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="w-full p-6 flex items-start justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{module.title}</h3>
                    <p className="text-sm text-gray-600">
                      {module.lessonsCount} aulas • {module.completedCount} concluídas
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={20} className="text-gray-600 shrink-0 mt-1" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-600 shrink-0 mt-1" />
                  )}
                </button>

                {isExpanded && (
                  <div className="bg-white border-t border-gray-200">
                    {module.lessons.map((lesson) => {
                      const isSelected = selectedLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson)}
                          className={`w-full p-4 px-6 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100 first:border-t-0 ${
                            isSelected ? "bg-blue-50" : ""
                          }`}
                        >
                          {lesson.completed ? (
                            <CheckCircle size={20} className="text-blue-brand shrink-0" />
                          ) : (
                            <PlayCircle size={20} className="text-gray-400 shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm ${lesson.completed ? "text-blue-brand" : "text-gray-900"}`}>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-gray-500">{lesson.duration}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Área do vídeo e conteúdo */}
        <div className="flex-1 py-12">
          {selectedLesson ? (
            <>
              {/* Player de vídeo */}
              <div className="bg-black rounded-lg mb-6 flex items-center justify-center" style={{ height: "500px" }}>
                <PlayCircle size={80} className="text-white opacity-80" />
              </div>

              {/* Título da aula */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedLesson.title}</h2>

              {/* Descrição */}
              <p className="text-gray-700 mb-6">
                Nesta aula você vai aprender os conceitos fundamentais da anatomia óssea, incluindo a estrutura
                macroscópica e microscópica dos ossos. Vamos explorar a classificação dos ossos e sua importância
                no sistema musculoesquelético.
              </p>

              {/* Botões de ação */}
              <div className="flex gap-4">
                <Button
                  onClick={handleMarkAsCompleted}
                  className="bg-blue-brand hover:bg-blue-brand-dark text-white"
                >
                  <CheckCircle size={20} className="mr-2" />
                  Marcar como concluída
                </Button>
                <Button
                  onClick={handleNextLesson}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Próxima aula
                  <ChevronRight size={20} className="ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Selecione uma aula para começar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
