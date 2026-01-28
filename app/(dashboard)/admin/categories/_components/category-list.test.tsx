import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { CategoryList } from "./category-list";
import { Doc, Id } from "@/convex/_generated/dataModel";

// Mock functions
const mockUpdateCategory = vi.fn(() => Promise.resolve());
const mockDeleteCategory = vi.fn(() => Promise.resolve());
const mockReorderCategories = vi.fn(() => Promise.resolve());
const mockTogglePublishCategory = vi.fn(() => Promise.resolve(true));
const mockToast = vi.fn();
const mockShowError = vi.fn();
const mockShowConfirm = vi.fn();

// Mock tenant hooks - track calls in order
const mutationMocks = [
  mockUpdateCategory,
  mockDeleteCategory,
  mockReorderCategories,
  mockTogglePublishCategory,
];
let mutationCallIndex = 0;

vi.mock("@/hooks/use-tenant-convex", () => ({
  useTenantMutation: vi.fn(() => {
    const mock = mutationMocks[mutationCallIndex % mutationMocks.length];
    mutationCallIndex++;
    return mock;
  }),
  useTenantReady: vi.fn(() => true),
}));

// Mock useToast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock useErrorModal hook
vi.mock("@/hooks/use-error-modal", () => ({
  useErrorModal: () => ({
    error: { isOpen: false, title: "", message: "" },
    showError: mockShowError,
    hideError: vi.fn(),
  }),
}));

// Mock useConfirmModal hook
vi.mock("@/hooks/use-confirm-modal", () => ({
  useConfirmModal: () => ({
    confirm: { isOpen: false, title: "", message: "", onConfirm: vi.fn() },
    showConfirm: mockShowConfirm,
    hideConfirm: vi.fn(),
  }),
}));

// Mock ImageUpload component
vi.mock("@/components/ui/image-upload", () => ({
  ImageUpload: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (value: string) => void;
  }) => (
    <input
      data-testid="image-upload"
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock Next.js Image (intentional img in test mock)
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test mock
    <img src={src} alt={alt} />
  ),
}));

// Mock DnD Kit
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock("@dnd-kit/sortable", () => ({
  arrayMove: vi.fn((array, from, to) => {
    const newArray = [...array];
    const item = newArray.splice(from, 1)[0];
    newArray.splice(to, 0, item);
    return newArray;
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ""),
    },
  },
}));

const mockCategories: Doc<"categories">[] = [
  {
    _id: "cat1" as Id<"categories">,
    _creationTime: 1234567890,
    tenantId: "tenant1" as Id<"tenants">,
    title: "Categoria 1",
    slug: "categoria-1",
    description: "Descrição da categoria 1",
    position: 1,
    isPublished: true,
    iconUrl: "https://example.com/icon1.png",
  },
  {
    _id: "cat2" as Id<"categories">,
    _creationTime: 1234567891,
    tenantId: "tenant1" as Id<"tenants">,
    title: "Categoria 2",
    slug: "categoria-2",
    description: "Descrição da categoria 2",
    position: 2,
    isPublished: false,
    iconUrl: undefined,
  },
  {
    _id: "cat3" as Id<"categories">,
    _creationTime: 1234567892,
    tenantId: "tenant1" as Id<"tenants">,
    title: "Categoria 3",
    slug: "categoria-3",
    description: "Descrição da categoria 3",
    position: 3,
    isPublished: true,
  },
];

describe("CategoryList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationCallIndex = 0;
  });

  describe("Renderização", () => {
    it("deve renderizar mensagem quando não há categorias", () => {
      render(<CategoryList categories={[]} />);

      expect(screen.getByText("Categorias Cadastradas")).toBeInTheDocument();
      expect(
        screen.getByText("Nenhuma categoria cadastrada ainda."),
      ).toBeInTheDocument();
    });

    it("deve renderizar lista de categorias", () => {
      render(<CategoryList categories={mockCategories} />);

      expect(screen.getByText("Categoria 1")).toBeInTheDocument();
      expect(screen.getByText("Categoria 2")).toBeInTheDocument();
      expect(screen.getByText("Categoria 3")).toBeInTheDocument();
    });

    it("deve renderizar ícones quando disponíveis", () => {
      render(<CategoryList categories={mockCategories} />);

      const icon = screen.getByRole("img", { name: "Categoria 1" });
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("src", "https://example.com/icon1.png");
    });

    it("deve mostrar botão de Editar Ordem quando há categorias", () => {
      render(<CategoryList categories={mockCategories} />);

      const editOrderButton = screen.getByText("Editar Ordem");
      expect(editOrderButton).toBeInTheDocument();
      expect(editOrderButton).toBeEnabled();
    });

    it("deve desabilitar botão de Editar Ordem quando não há categorias", () => {
      render(<CategoryList categories={[]} />);

      const editOrderButton = screen.getByText("Editar Ordem");
      expect(editOrderButton).toBeDisabled();
    });
  });

  describe("Estado de publicação", () => {
    it("deve mostrar ícone de publicado para categorias publicadas", () => {
      render(<CategoryList categories={mockCategories} />);

      const publishedButtons = screen.getAllByTitle("Despublicar categoria");
      expect(publishedButtons).toHaveLength(2); // cat1 e cat3
    });

    it("deve mostrar ícone de despublicado para categorias não publicadas", () => {
      render(<CategoryList categories={mockCategories} />);

      const unpublishedButton = screen.getByTitle("Publicar categoria");
      expect(unpublishedButton).toBeInTheDocument();
    });

    it("deve chamar confirmação ao tentar publicar categoria", async () => {
      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      const publishButton = screen.getByTitle("Publicar categoria");
      await user.click(publishButton);

      await waitFor(() => {
        expect(mockShowConfirm).toHaveBeenCalled();
        const confirmCall = mockShowConfirm.mock.calls[0];
        expect(confirmCall[0]).toContain('Publicar a categoria "Categoria 2"');
      });
    });

    it("deve chamar confirmação ao tentar despublicar categoria", async () => {
      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      const unpublishButtons = screen.getAllByTitle("Despublicar categoria");
      await user.click(unpublishButtons[0]);

      await waitFor(() => {
        expect(mockShowConfirm).toHaveBeenCalled();
        const confirmCall = mockShowConfirm.mock.calls[0];
        expect(confirmCall[0]).toContain(
          'Despublicar a categoria "Categoria 1"',
        );
      });
    });
  });

  describe("Edição de categoria", () => {
    it("deve abrir modal de edição ao clicar no botão editar", async () => {
      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      const editButtons = screen.getAllByRole("button", { name: "" });
      const editButton = editButtons.find((btn) =>
        btn.querySelector("svg.lucide-edit"),
      );

      if (editButton) {
        await user.click(editButton);

        await waitFor(() => {
          expect(screen.getByText("Editar Categoria")).toBeInTheDocument();
          expect(screen.getByDisplayValue("Categoria 1")).toBeInTheDocument();
          expect(
            screen.getByDisplayValue("Descrição da categoria 1"),
          ).toBeInTheDocument();
        });
      }
    });

    it("deve atualizar categoria com sucesso", async () => {
      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      // Abrir modal de edição
      const editButtons = screen.getAllByRole("button", { name: "" });
      const editButton = editButtons.find((btn) =>
        btn.querySelector("svg.lucide-edit"),
      );

      if (editButton) {
        await user.click(editButton);

        await waitFor(() => {
          expect(screen.getByText("Editar Categoria")).toBeInTheDocument();
        });

        // Editar campos
        const titleInput = screen.getByDisplayValue("Categoria 1");
        const descriptionInput = screen.getByDisplayValue(
          "Descrição da categoria 1",
        );

        await user.clear(titleInput);
        await user.type(titleInput, "Categoria Atualizada");

        await user.clear(descriptionInput);
        await user.type(descriptionInput, "Descrição atualizada da categoria");

        // Submeter formulário
        const saveButton = screen.getByText("Salvar");
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockUpdateCategory).toHaveBeenCalledWith({
            id: "cat1",
            title: "Categoria Atualizada",
            description: "Descrição atualizada da categoria",
            iconUrl: "https://example.com/icon1.png",
          });
        });

        expect(mockToast).toHaveBeenCalledWith({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso!",
        });
      }
    });

    it("deve validar título mínimo ao editar", async () => {
      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      const editButtons = screen.getAllByRole("button", { name: "" });
      const editButton = editButtons.find((btn) =>
        btn.querySelector("svg.lucide-edit"),
      );

      if (editButton) {
        await user.click(editButton);

        await waitFor(() => {
          expect(screen.getByText("Editar Categoria")).toBeInTheDocument();
        });

        const titleInput = screen.getByDisplayValue("Categoria 1");
        await user.clear(titleInput);
        await user.type(titleInput, "AB");

        const saveButton = screen.getByText("Salvar");
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockShowError).toHaveBeenCalledWith(
            "O título deve ter pelo menos 3 caracteres",
            "Título inválido",
          );
        });

        expect(mockUpdateCategory).not.toHaveBeenCalled();
      }
    });

    it("deve validar descrição mínima ao editar", async () => {
      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      const editButtons = screen.getAllByRole("button", { name: "" });
      const editButton = editButtons.find((btn) =>
        btn.querySelector("svg.lucide-edit"),
      );

      if (editButton) {
        await user.click(editButton);

        await waitFor(() => {
          expect(screen.getByText("Editar Categoria")).toBeInTheDocument();
        });

        const descriptionInput = screen.getByDisplayValue(
          "Descrição da categoria 1",
        );
        await user.clear(descriptionInput);
        await user.type(descriptionInput, "Curta");

        const saveButton = screen.getByText("Salvar");
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockShowError).toHaveBeenCalledWith(
            "A descrição deve ter pelo menos 10 caracteres",
            "Descrição inválida",
          );
        });

        expect(mockUpdateCategory).not.toHaveBeenCalled();
      }
    });

    it("deve cancelar edição ao clicar em Cancelar", async () => {
      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      const editButtons = screen.getAllByRole("button", { name: "" });
      const editButton = editButtons.find((btn) =>
        btn.querySelector("svg.lucide-edit"),
      );

      if (editButton) {
        await user.click(editButton);

        await waitFor(() => {
          expect(screen.getByText("Editar Categoria")).toBeInTheDocument();
        });

        const cancelButton = screen.getByText("Cancelar");
        await user.click(cancelButton);

        await waitFor(() => {
          expect(
            screen.queryByText("Editar Categoria"),
          ).not.toBeInTheDocument();
        });

        expect(mockUpdateCategory).not.toHaveBeenCalled();
      }
    });
  });

  describe("Exclusão de categoria", () => {
    it("deve chamar confirmação ao tentar deletar categoria", async () => {
      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      const deleteButtons = screen.getAllByRole("button", { name: "" });
      const deleteButton = deleteButtons.find((btn) =>
        btn.querySelector("svg.lucide-trash-2"),
      );

      if (deleteButton) {
        await user.click(deleteButton);

        await waitFor(() => {
          expect(mockShowConfirm).toHaveBeenCalled();
          const confirmCall = mockShowConfirm.mock.calls[0];
          expect(confirmCall[0]).toContain('A categoria "Categoria 1"');
          expect(confirmCall[0]).toContain("TODOS os módulos");
          expect(confirmCall[2]).toBe("DELETAR CATEGORIA E TODO SEU CONTEÚDO");
        });
      }
    });
  });

  describe("Modo de edição de ordem", () => {
    it("deve entrar em modo de edição ao clicar em Editar Ordem", async () => {
      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      const editOrderButton = screen.getByText("Editar Ordem");
      await user.click(editOrderButton);

      await waitFor(() => {
        expect(screen.getByText("Cancelar")).toBeInTheDocument();
        expect(screen.getByText("Salvar Ordem")).toBeInTheDocument();
      });
    });

    it("deve cancelar edição de ordem", async () => {
      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      const editOrderButton = screen.getByText("Editar Ordem");
      await user.click(editOrderButton);

      await waitFor(() => {
        expect(screen.getByText("Cancelar")).toBeInTheDocument();
      });

      const cancelButton = screen.getByText("Cancelar");
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText("Editar Ordem")).toBeInTheDocument();
      });

      expect(mockReorderCategories).not.toHaveBeenCalled();
    });

    it("deve salvar ordem das categorias", async () => {
      // Ensure reorder mock resolves correctly
      mockReorderCategories.mockResolvedValueOnce(undefined);

      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      const editOrderButton = screen.getByText("Editar Ordem");
      await user.click(editOrderButton);

      await waitFor(() => {
        expect(screen.getByText("Salvar Ordem")).toBeInTheDocument();
      });

      const saveButton = screen.getByText("Salvar Ordem");
      await user.click(saveButton);

      await waitFor(
        () => {
          expect(mockReorderCategories).toHaveBeenCalled();
        },
        { timeout: 5000 },
      );

      await waitFor(
        () => {
          expect(mockToast).toHaveBeenCalledWith({
            title: "Sucesso",
            description: "Ordem das categorias atualizada!",
          });
        },
        { timeout: 5000 },
      );
    });
  });

  describe("Tratamento de erros", () => {
    it("deve mostrar erro ao falhar na atualização", async () => {
      mockUpdateCategory.mockRejectedValueOnce(new Error("Erro ao atualizar"));
      const user = userEvent.setup();
      render(<CategoryList categories={mockCategories} />);

      const editButtons = screen.getAllByRole("button", { name: "" });
      const editButton = editButtons.find((btn) =>
        btn.querySelector("svg.lucide-edit"),
      );

      if (editButton) {
        await user.click(editButton);

        await waitFor(() => {
          expect(screen.getByText("Editar Categoria")).toBeInTheDocument();
        });

        const saveButton = screen.getByText("Salvar");
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockShowError).toHaveBeenCalledWith(
            "Erro ao atualizar",
            "Erro ao atualizar categoria",
          );
        });
      }
    });

    it("deve mostrar erro ao falhar na reordenação", async () => {
      const user = userEvent.setup();

      // Reset mock and set up rejection for this specific test
      mockReorderCategories.mockReset();
      mockReorderCategories.mockRejectedValueOnce(
        new Error("Erro ao reordenar"),
      );

      render(<CategoryList categories={mockCategories} />);

      const editOrderButton = screen.getByText("Editar Ordem");
      await user.click(editOrderButton);

      await waitFor(() => {
        expect(screen.getByText("Salvar Ordem")).toBeInTheDocument();
      });

      const saveButton = screen.getByText("Salvar Ordem");
      await user.click(saveButton);

      await waitFor(
        () => {
          expect(mockShowError).toHaveBeenCalledWith(
            "Erro ao reordenar",
            "Erro ao salvar ordem",
          );
        },
        { timeout: 3000 },
      );
    });
  });
});
