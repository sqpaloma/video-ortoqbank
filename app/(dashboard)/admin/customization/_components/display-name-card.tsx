"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DisplayNameCardProps {
  displayName: string;
  onDisplayNameChange: (value: string) => void;
}

export function DisplayNameCard({
  displayName,
  onDisplayNameChange,
}: DisplayNameCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nome de Exibição</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="displayName">Nome exibido ao lado do logo</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="Ex: Ortoclub, MeuApp..."
            className="max-w-md"
          />
          <p className="text-sm text-muted-foreground">
            Este nome será exibido na sidebar e em outras áreas do app.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
