"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTenant } from "@/components/providers/tenant-provider";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, X } from "lucide-react";

import { PreviewCard } from "./preview-card";
import { DisplayNameCard } from "./display-name-card";
import { LogoCard } from "./logo-card";
import { PrimaryColorCard, PRESET_COLORS } from "./primary-color-card";

// Interface for tracking original state
interface OriginalState {
  displayName: string;
  logoUrl: string;
  primaryColor: string;
  customColor: string;
  useCustomColor: boolean;
}

// Default blue-brand color for reference
const DEFAULT_PRIMARY_COLOR = "oklch(0.6167 0.1623 250.58)";

export function CustomizationPage() {
  const { state } = useSidebar();
  const {
    tenantId,
    tenantDisplayName,
    tenantLogoUrl,
    tenantPrimaryColor,
    tenantName,
  } = useTenant();
  const { toast } = useToast();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track original state for change detection
  const originalStateRef = useRef<OriginalState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Mutation
  const updateBranding = useMutation(api.tenants.updateBranding);

  // Initialize form with current tenant values
  useEffect(() => {
    const initialDisplayName = tenantDisplayName || tenantName || "";
    const initialLogoUrl = tenantLogoUrl || "";
    const initialPrimaryColor = tenantPrimaryColor || "";
    const isPreset = tenantPrimaryColor
      ? PRESET_COLORS.some((c) => c.value === tenantPrimaryColor)
      : true;
    const initialUseCustomColor = tenantPrimaryColor ? !isPreset : false;

    // If using custom color, preserve the actual custom color value
    const initialCustomColor =
      initialUseCustomColor && tenantPrimaryColor
        ? tenantPrimaryColor
        : "#3b82f6";

    setDisplayName(initialDisplayName);
    setLogoUrl(initialLogoUrl);
    setPrimaryColor(initialPrimaryColor);
    setUseCustomColor(initialUseCustomColor);
    setCustomColor(initialCustomColor);

    // Store original state for change detection
    originalStateRef.current = {
      displayName: initialDisplayName,
      logoUrl: initialLogoUrl,
      primaryColor: initialPrimaryColor,
      customColor: initialCustomColor,
      useCustomColor: initialUseCustomColor,
    };
    setIsInitialized(true);
  }, [tenantDisplayName, tenantName, tenantLogoUrl, tenantPrimaryColor]);

  // Compute whether there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!isInitialized || !originalStateRef.current) return false;

    const original = originalStateRef.current;
    return (
      displayName !== original.displayName ||
      logoUrl !== original.logoUrl ||
      primaryColor !== original.primaryColor ||
      useCustomColor !== original.useCustomColor ||
      (useCustomColor && customColor !== original.customColor)
    );
  }, [
    displayName,
    logoUrl,
    primaryColor,
    useCustomColor,
    customColor,
    isInitialized,
  ]);

  // Warn user when leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Cancel handler - reset to original state
  const handleCancel = useCallback(() => {
    if (!originalStateRef.current) return;

    const original = originalStateRef.current;
    setDisplayName(original.displayName);
    setLogoUrl(original.logoUrl);
    setPrimaryColor(original.primaryColor);
    setCustomColor(original.customColor);
    setUseCustomColor(original.useCustomColor);
  }, []);

  // Apply preview color to CSS variable in real-time
  useEffect(() => {
    const colorToApply = useCustomColor
      ? hexToOklch(customColor)
      : primaryColor || DEFAULT_PRIMARY_COLOR;
    document.documentElement.style.setProperty("--blue-brand", colorToApply);
  }, [primaryColor, customColor, useCustomColor]);

  // Convert hex to oklch (simplified approximation)
  function hexToOklch(hex: string): string {
    const cleanHex = hex.replace(/^#/, "").trim();

    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      return hex;
    }

    const rInt = parseInt(cleanHex.substring(0, 2), 16);
    const gInt = parseInt(cleanHex.substring(2, 4), 16);
    const bInt = parseInt(cleanHex.substring(4, 6), 16);

    if (
      !Number.isFinite(rInt) ||
      !Number.isFinite(gInt) ||
      !Number.isFinite(bInt)
    ) {
      return hex;
    }

    const r = rInt / 255;
    const g = gInt / 255;
    const b = bInt / 255;

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

      // Update original state after successful save
      originalStateRef.current = {
        displayName,
        logoUrl,
        primaryColor,
        customColor,
        useCustomColor,
      };

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
        className={`hidden md:inline-flex fixed top-2 h-6 w-6 text-black hover:text-black hover:bg-gray-100 transition-[left] duration-200 ease-linear z-10 ${
          state === "collapsed"
            ? "left-[calc(var(--sidebar-width-icon)+0.25rem)]"
            : "left-[calc(var(--sidebar-width)+0.25rem)]"
        }`}
      />

      {/* Header */}
      <div className="border-b">
        <div className="p-4 pt-12 flex items-center pl-14 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customização</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pb-24 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <PreviewCard
            logoUrl={logoUrl}
            displayName={displayName}
            tenantName={tenantName || ""}
          />

          <DisplayNameCard
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
          />

          <LogoCard
            logoUrl={logoUrl}
            onLogoUrlChange={setLogoUrl}
            onUploadStateChange={setIsUploading}
          />

          <PrimaryColorCard
            primaryColor={primaryColor}
            customColor={customColor}
            useCustomColor={useCustomColor}
            onPresetColorSelect={handlePresetColorSelect}
            onCustomColorChange={handleCustomColorChange}
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleCancel}
              disabled={isSaving || !hasChanges}
              variant="outline"
              size="lg"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isUploading || !hasChanges}
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
