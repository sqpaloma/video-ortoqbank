import { requireVideoAccess } from "@/lib/access";
import { FavoritesClientPage } from "./_components/favorites-client-page";

export default async function FavoritesPage() {
  // Verifica acesso pago antes de carregar conteúdo
  await requireVideoAccess();

  return <FavoritesClientPage />;
}
