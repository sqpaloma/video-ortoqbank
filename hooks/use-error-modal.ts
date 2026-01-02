"use client";

import { useState } from "react";

interface ErrorState {
  isOpen: boolean;
  title?: string;
  message: string;
}

export function useErrorModal() {
  const [error, setError] = useState<ErrorState>({
    isOpen: false,
    title: "Erro",
    message: "",
  });

  const showError = (message: string, title?: string) => {
    setError({
      isOpen: true,
      title: title || "Erro",
      message,
    });
  };

  const hideError = () => {
    setError({
      isOpen: false,
      title: "Erro",
      message: "",
    });
  };

  return {
    error,
    showError,
    hideError,
  };
}
