"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title = "Confirmar ação",
  message,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setLoading(false);
      setError(null);
    }
  }, [open]);

  // Track mount status
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleConfirm = async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      if (mountedRef.current) {
        onOpenChange(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao confirmar a ação",
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

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
        {error && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          </div>
        )}
        <div className="flex justify-center gap-4 pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="px-8"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-blue-brand hover:bg-blue-brand-dark text-white px-8"
            disabled={loading}
          >
            {loading ? "Processando..." : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
