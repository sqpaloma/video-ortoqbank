"use client";

import { useState } from "react";

interface ConfirmState {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
}

export function useConfirmModal() {
  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    title: "Confirmar ação",
    message: "",
    onConfirm: () => {},
  });

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    title?: string,
  ) => {
    setConfirm({
      isOpen: true,
      title: title || "Confirmar ação",
      message,
      onConfirm,
    });
  };

  const hideConfirm = () => {
    setConfirm({
      isOpen: false,
      title: "Confirmar ação",
      message: "",
      onConfirm: () => {},
    });
  };

  return {
    confirm,
    showConfirm,
    hideConfirm,
  };
}
