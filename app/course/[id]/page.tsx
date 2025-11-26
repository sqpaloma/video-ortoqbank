import { CourseInner } from "../_components/CourseInner";

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

interface CourseData {
  title: string;
  subtitle: string;
  progress: number;
  modules: Module[];
}

// Dados mockados - substituir por preloadQuery do Convex
const coursesData: Record<string, CourseData> = {
  "1": {
    title: "Introdução à Anatomia Óssea",
    subtitle: "Ciências Básicas em Ortopedia",
    progress: 34,
    modules: [
      {
        id: "1",
        title: "Anatomia do Sistema Musculoesquelético",
        lessonsCount: 5,
        completedCount: 3,
        lessons: [
          { id: "1", title: "Introdução à anatomia óssea", duration: "15:34", completed: true },
          { id: "2", title: "Estrutura e função dos ossos", duration: "18:22", completed: true },
          { id: "3", title: "Articulações e ligamentos", duration: "22:45", completed: true },
          { id: "4", title: "Sistema muscular", duration: "20:10", completed: false },
          { id: "5", title: "Vascularização e inervação", duration: "19:30", completed: false },
        ],
      },
    ],
  },
};

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // TODO: Substituir por preloadQuery do Convex
  // const preloaded = await preloadQuery(api.courses.getCourse, { courseId: id });

  const courseData = coursesData[id] || coursesData["1"];

  return <CourseInner courseData={courseData} />;
}
