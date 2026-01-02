import { redirect } from "next/navigation";

export default function DashboardPage() {
  // Redireciona para a página de categorias que é a página principal
  redirect("/categories");
}
