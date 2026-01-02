"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
}

export function ErrorModal({
  open,
  onOpenChange,
  title = "Erro",
  message,
}: ErrorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400 pt-2 text-center">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-blue-brand hover:bg-blue-brand-dark text-white px-8"
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
