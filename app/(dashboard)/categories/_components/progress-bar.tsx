

import { Progress } from "@/components/ui/progress";

export function ProgressBar() {
  const progress = 34;
  return (
    <div className="w-full h-12 md:h-14 flex flex-col justify-center">
      <div className="flex justify-between items-center mb-1.5 md:mb-2">
        <span className="text-xs md:text-sm font-medium text-foreground">Progresso Total</span>
        <span className="text-base md:text-lg font-bold text-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="h-1.5 md:h-2" />
    </div>
  );
}

