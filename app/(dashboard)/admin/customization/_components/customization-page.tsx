"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTenant } from "@/components/providers/tenant-provider";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Loader2, Palette } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Predefined color palette
const PRESET_COLORS = [
  { name: "Azul", value: "oklch(0.6167 0.1623 250.58)" }, // Current default
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

// Default blue-brand color for reference
const DEFAULT_PRIMARY_COLOR = "oklch(0.6167 0.1623 250.58)";

export function CustomizationPage() {
  const { state } = useSidebar();
  const { tenantId, tenantDisplayName, tenantLogoUrl, tenantPrimaryColor, tenantName } =
    useTenant();
  const { toast } = useToast();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [customColor, setCustomColor] = useState("#3b82f6"); // Hex for custom picker
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Mutation
  const updateBranding = useMutation(api.tenants.updateBranding);

  // Initialize form with current tenant values
  useEffect(() => {
    if (tenantDisplayName) {
      setDisplayName(tenantDisplayName);
    } else if (tenantName) {
      setDisplayName(tenantName);
    }
    if (tenantLogoUrl) {
      setLogoUrl(tenantLogoUrl);
    }
    if (tenantPrimaryColor) {
      setPrimaryColor(tenantPrimaryColor);
      // Check if current color is a preset
      const isPreset = PRESET_COLORS.some((c) => c.value === tenantPrimaryColor);
      setUseCustomColor(!isPreset);
    }
  }, [tenantDisplayName, tenantName, tenantLogoUrl, tenantPrimaryColor]);

  // Apply preview color to CSS variable in real-time
  useEffect(() => {
    const colorToApply = useCustomColor
      ? hexToOklch(customColor)
      : primaryColor || DEFAULT_PRIMARY_COLOR;
    document.documentElement.style.setProperty("--blue-brand", colorToApply);
  }, [primaryColor, customColor, useCustomColor]);

  // Convert hex to oklch (simplified approximation)
  function hexToOklch(hex: string): string {
    // Remove # if present and trim whitespace
    const cleanHex = hex.replace(/^#/, "").trim();

    // Validate hex string format (must be exactly 6 hex digits)
    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      // Return a safe fallback for invalid input
      return hex;
    }

    const rInt = parseInt(cleanHex.substring(0, 2), 16);
    const gInt = parseInt(cleanHex.substring(2, 4), 16);
    const bInt = parseInt(cleanHex.substring(4, 6), 16);

    // Guard against NaN from parseInt (should not happen after regex validation, but extra safety)
    if (!Number.isFinite(rInt) || !Number.isFinite(gInt) || !Number.isFinite(bInt)) {
      return hex;
    }

    const r = rInt / 255;
    const g = gInt / 255;
    const b = bInt / 255;

    // Simple RGB to approximate Oklch conversion
    // This is a simplified conversion - for production, use a proper color library
    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
    const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

    const C = Math.sqrt(a * a + bVal * bVal);
    let h = (Math.atan2(bVal, a) * 180) / Math.PI;
    if (h < 0) h += 360;

    // Final NaN guard before formatting
    if (!Number.isFinite(L) || !Number.isFinite(C) || !Number.isFinite(h)) {
      return hex;
    }

    return `oklch(${L.toFixed(2)} ${C.toFixed(4)} ${h.toFixed(2)})`;
  }

  const handleSave = async () => {
    if (!tenantId) {
      toast({
        title: "Erro",
        description: "Tenant não encontrado",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const colorToSave = useCustomColor
        ? hexToOklch(customColor)
        : primaryColor || undefined;

      await updateBranding({
        tenantId,
        displayName: displayName || undefined,
        logoUrl: logoUrl || undefined,
        primaryColor: colorToSave,
      });

      toast({
        title: "Sucesso!",
        description: "Configurações de branding salvas com sucesso.",
      });
    } catch (error) {
      console.error("Error saving branding:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePresetColorSelect = (color: string) => {
    setUseCustomColor(false);
    setPrimaryColor(color);
  };

  const handleCustomColorChange = (hex: string) => {
    setCustomColor(hex);
    setUseCustomColor(true);
  };

  return (
    <div className="min-h-screen relative">
      {/* Sidebar trigger */}
      <SidebarTrigger
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-blue-brand hover:text-blue-brand hover:bg-blue-brand/10 transition-[left] duration-200 ease-linear z-10 ${state === "collapsed"
          ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]"
          : "left-[calc(var(--sidebar-width)+0.25rem)]"
          }`}
      />

      {/* Header */}
      <div className="border-b">
        <div className="p-4 pt-12 flex items-center pl-14 gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customização</h1>
            <p className="text-sm text-muted-foreground">
              Personalize a aparência do seu aplicativo
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pb-24 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-blue-brand rounded-lg">
                {logoUrl ? (
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-white/20">
                    <Image
                      src={logoUrl}
                      alt="Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {(displayName || tenantName || "T")[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-white text-xl font-semibold">
                  {displayName || tenantName || "Nome do App"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Display Name */}
          <Card>
            <CardHeader>
              <CardTitle>Nome de Exibição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Nome exibido ao lado do logo
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: OrtoQBank, MeuApp..."
                  className="max-w-md"
                />
                <p className="text-sm text-muted-foreground">
                  Este nome será exibido na sidebar e em outras áreas do app.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="max-w-md">
                  <ImageUpload
                    value={logoUrl}
                    onChange={setLogoUrl}
                    folder="/tenants"
                    id="tenant-logo-upload"
                    onUploadStateChange={setIsUploading}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Recomendado: imagem quadrada PNG ou SVG com fundo transparente.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Primary Color */}
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
                      onClick={() => handlePresetColorSelect(color.value)}
                      className={`
                        relative h-12 rounded-lg transition-all
                        hover:scale-105 hover:shadow-md
                        ${!useCustomColor && primaryColor === color.value
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
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className={`
                      h-12 w-20 rounded-lg cursor-pointer border-2
                      ${useCustomColor ? "border-gray-900" : "border-gray-300"}
                    `}
                  />
                  <Input
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
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
                  Esta cor será aplicada em botões, links, sidebar e outros
                  elementos de destaque.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || isUploading}
              size="lg"
              className="min-w-[200px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

