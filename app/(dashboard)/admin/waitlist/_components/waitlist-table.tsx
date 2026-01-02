"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Doc } from "@/convex/_generated/dataModel";

type WaitlistEntry = Doc<"waitlist">;

interface WaitlistTableProps {
  entries: WaitlistEntry[];
  isLoading: boolean;
  hasSearchQuery: boolean;
}

export function WaitlistTable({
  entries,
  isLoading,
  hasSearchQuery,
}: WaitlistTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Instagram</TableHead>
            <TableHead>Nivel Residencia</TableHead>
            <TableHead>Subespecialidade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-6 text-center text-muted-foreground"
              >
                Carregando inscricoes...
              </TableCell>
            </TableRow>
          ) : entries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-6 text-center text-muted-foreground"
              >
                {hasSearchQuery
                  ? "Nenhuma inscricao encontrada"
                  : "Nenhuma inscricao na lista de espera"}
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow key={entry._id}>
                <TableCell className="font-medium">{entry.name}</TableCell>
                <TableCell>{entry.email}</TableCell>
                <TableCell>{entry.whatsapp}</TableCell>
                <TableCell>
                  {entry.instagram ? `@${entry.instagram}` : "-"}
                </TableCell>
                <TableCell>{entry.residencyLevel}</TableCell>
                <TableCell>{entry.subspecialty}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
