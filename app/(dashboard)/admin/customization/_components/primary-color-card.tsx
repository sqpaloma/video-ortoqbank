"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

// Predefined color palette
const PRESET_COLORS = [
  { name: "Azul", value: "oklch(0.6167 0.1623 250.58)" },
  { name: "Azul Escuro", value: "oklch(0.45 0.15 250)" },
  { name: "Verde", value: "oklch(0.65 0.18 145)" },
  { name: "Verde Escuro", value: "oklch(0.50 0.15 150)" },
  { name: "Roxo", value: "oklch(0.55 0.20 300)" },
  { name: "Vermelho", value: "oklch(0.55 0.22 25)" },
  { name: "Laranja", value: "oklch(0.70 0.18 50)" },
  { name: "Rosa", value: "oklch(0.65 0.20 350)" },
  { name: "Ciano", value: "oklch(0.65 0.15 200)" },
  { name: "Amarelo", value: "oklch(0.80 0.15 85)" },
];

interface PrimaryColorCardProps {
  primaryColor: string;
  customColor: string;
  useCustomColor: boolean;
  onPresetColorSelect: (color: string) => void;
  onCustomColorChange: (hex: string) => void;
}

export function PrimaryColorCard({
  primaryColor,
  customColor,
  useCustomColor,
  onPresetColorSelect,
  onCustomColorChange,
}: PrimaryColorCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cor Primária</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preset Colors */}
        <div className="space-y-3">
          <Label>Cores predefinidas</Label>
          <div className="grid grid-cols-5 gap-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => onPresetColorSelect(color.value)}
                className={`
                  relative h-12 rounded-lg transition-all
                  hover:scale-105 hover:shadow-md
                  ${
                    !useCustomColor && primaryColor === color.value
                      ? "ring-2 ring-offset-2 ring-gray-900"
                      : ""
                  }
                `}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {!useCustomColor && primaryColor === color.value && (
                  <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Color */}
        <div className="space-y-3">
          <Label>Cor personalizada</Label>
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={customColor}
              onChange={(e) => onCustomColorChange(e.target.value)}
              className={`
                h-12 w-20 rounded-lg cursor-pointer border-2
                ${useCustomColor ? "border-gray-900" : "border-gray-300"}
              `}
            />
            <Input
              value={customColor}
              onChange={(e) => onCustomColorChange(e.target.value)}
              placeholder="#3b82f6"
              className="w-32 font-mono"
            />
            {useCustomColor && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Check className="h-4 w-4 text-green-600" />
                Cor personalizada selecionada
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Esta cor será aplicada em botões, links, sidebar e outros elementos
            de destaque.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Export PRESET_COLORS for use in parent component
export { PRESET_COLORS };
