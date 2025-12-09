

import { Progress } from "@/components/ui/progress";

export function ProgressBar() {
  const progress = 34;
  return (
    <div className="w-full h-14 flex flex-col justify-center">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground">Progresso Total</span>
        <span className="text-lg font-bold text-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

