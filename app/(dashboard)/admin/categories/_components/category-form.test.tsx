import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { CategoryForm } from "./category-form";

// Mock functions
const mockCreateCategory = vi.fn(() => Promise.resolve());
const mockToast = vi.fn();
const mockShowError = vi.fn();
const mockOnSuccess = vi.fn();

// Mock tenant hooks
vi.mock("@/hooks/use-tenant-convex", () => ({
  useTenantMutation: vi.fn(() => mockCreateCategory),
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

// Mock ImageUpload component
vi.mock("@/components/ui/image-upload", () => ({
  ImageUpload: ({
    value,
    onChange,
    onUploadStateChange,
  }: {
    value?: string;
    onChange: (value: string) => void;
    onUploadStateChange: (uploading: boolean) => void;
  }) => (
    <div>
      <input
        data-testid="image-upload"
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => onUploadStateChange(true)}
        data-testid="start-upload"
      >
        Start Upload
      </button>
      <button
        type="button"
        onClick={() => onUploadStateChange(false)}
        data-testid="end-upload"
      >
        End Upload
      </button>
    </div>
  ),
}));

describe("CategoryForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderização", () => {
    it("deve renderizar o formulário com todos os campos", () => {
      render(<CategoryForm />);

      expect(screen.getByText("Nova Categoria")).toBeInTheDocument();
      expect(screen.getByText("Título")).toBeInTheDocument();
      expect(screen.getByText("Descrição")).toBeInTheDocument();
      expect(
        screen.getByText("Ícone da Categoria (opcional)"),
      ).toBeInTheDocument();
      expect(screen.getByText("Limpar")).toBeInTheDocument();
      expect(screen.getByText("Criar Categoria")).toBeInTheDocument();
    });

    it("deve renderizar os placeholders corretos", () => {
      render(<CategoryForm />);

      expect(
        screen.getByPlaceholderText("Ex: Ciências Básicas em Ortopedia"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Breve descrição da categoria"),
      ).toBeInTheDocument();
    });
  });

  describe("Validações", () => {
    it("deve mostrar erro quando título tem menos de 3 caracteres", async () => {
      const user = userEvent.setup();
      render(<CategoryForm />);

      const titleInput = screen.getByPlaceholderText(
        "Ex: Ciências Básicas em Ortopedia",
      );
      const descriptionInput = screen.getByPlaceholderText(
        "Breve descrição da categoria",
      );
      const submitButton = screen.getByText("Criar Categoria");

      await user.type(titleInput, "AB");
      await user.type(
        descriptionInput,
        "Descrição válida com mais de 10 chars",
      );
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Título deve ter pelo menos 3 caracteres"),
        ).toBeInTheDocument();
      });

      expect(mockCreateCategory).not.toHaveBeenCalled();
    });

    it("deve mostrar erro quando descrição tem menos de 10 caracteres", async () => {
      const user = userEvent.setup();
      render(<CategoryForm />);

      const titleInput = screen.getByPlaceholderText(
        "Ex: Ciências Básicas em Ortopedia",
      );
      const descriptionInput = screen.getByPlaceholderText(
        "Breve descrição da categoria",
      );
      const submitButton = screen.getByText("Criar Categoria");

      await user.type(titleInput, "Título válido");
      await user.type(descriptionInput, "Curta");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Descrição deve ter pelo menos 10 caracteres"),
        ).toBeInTheDocument();
      });

      expect(mockCreateCategory).not.toHaveBeenCalled();
    });

    it("deve mostrar erro quando URL do ícone é inválida", async () => {
      const user = userEvent.setup();
      render(<CategoryForm />);

      const titleInput = screen.getByPlaceholderText(
        "Ex: Ciências Básicas em Ortopedia",
      );
      const descriptionInput = screen.getByPlaceholderText(
        "Breve descrição da categoria",
      );
      const iconInput = screen.getByTestId("image-upload");
      const submitButton = screen.getByText("Criar Categoria");

      await user.type(titleInput, "Título válido");
      await user.type(
        descriptionInput,
        "Descrição válida com mais de 10 chars",
      );
      await user.type(iconInput, "url-invalida");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("URL do ícone deve ser válida"),
        ).toBeInTheDocument();
      });

      expect(mockCreateCategory).not.toHaveBeenCalled();
    });
  });

  describe("Criação de categoria", () => {
    it("deve criar categoria com sucesso quando dados são válidos", async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSuccess={mockOnSuccess} />);

      const titleInput = screen.getByPlaceholderText(
        "Ex: Ciências Básicas em Ortopedia",
      );
      const descriptionInput = screen.getByPlaceholderText(
        "Breve descrição da categoria",
      );
      const submitButton = screen.getByText("Criar Categoria");

      await user.type(titleInput, "Nova Categoria");
      await user.type(descriptionInput, "Descrição da nova categoria");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith({
          title: "Nova Categoria",
          description: "Descrição da nova categoria",
          iconUrl: undefined,
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "✅ Categoria criada com sucesso!",
        description: "Nova Categoria foi criada.",
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("deve criar categoria com iconUrl quando fornecido", async () => {
      const user = userEvent.setup();
      render(<CategoryForm />);

      const titleInput = screen.getByPlaceholderText(
        "Ex: Ciências Básicas em Ortopedia",
      );
      const descriptionInput = screen.getByPlaceholderText(
        "Breve descrição da categoria",
      );
      const iconInput = screen.getByTestId("image-upload");
      const submitButton = screen.getByText("Criar Categoria");

      await user.type(titleInput, "Categoria com Ícone");
      await user.type(descriptionInput, "Descrição da categoria com ícone");
      await user.type(iconInput, "https://example.com/icon.png");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith({
          title: "Categoria com Ícone",
          description: "Descrição da categoria com ícone",
          iconUrl: "https://example.com/icon.png",
        });
      });
    });

    it("deve limpar o formulário após criação bem-sucedida", async () => {
      const user = userEvent.setup();
      render(<CategoryForm />);

      const titleInput = screen.getByPlaceholderText(
        "Ex: Ciências Básicas em Ortopedia",
      ) as HTMLInputElement;
      const descriptionInput = screen.getByPlaceholderText(
        "Breve descrição da categoria",
      ) as HTMLInputElement;
      const submitButton = screen.getByText("Criar Categoria");

      await user.type(titleInput, "Categoria Teste");
      await user.type(descriptionInput, "Descrição da categoria teste");
      await user.click(submitButton);

      await waitFor(() => {
        expect(titleInput.value).toBe("");
        expect(descriptionInput.value).toBe("");
      });
    });

    it("deve mostrar mensagem de erro quando criação falhar", async () => {
      mockCreateCategory.mockRejectedValueOnce(new Error("Erro ao criar"));
      const user = userEvent.setup();
      render(<CategoryForm />);

      const titleInput = screen.getByPlaceholderText(
        "Ex: Ciências Básicas em Ortopedia",
      );
      const descriptionInput = screen.getByPlaceholderText(
        "Breve descrição da categoria",
      );
      const submitButton = screen.getByText("Criar Categoria");

      await user.type(titleInput, "Categoria Falha");
      await user.type(
        descriptionInput,
        "Descrição da categoria que vai falhar",
      );
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          "Erro ao criar",
          "Erro ao criar categoria",
        );
      });
    });
  });

  describe("Interações do usuário", () => {
    it("deve limpar formulário quando botão Limpar é clicado", async () => {
      const user = userEvent.setup();
      render(<CategoryForm />);

      const titleInput = screen.getByPlaceholderText(
        "Ex: Ciências Básicas em Ortopedia",
      ) as HTMLInputElement;
      const descriptionInput = screen.getByPlaceholderText(
        "Breve descrição da categoria",
      ) as HTMLInputElement;
      const clearButton = screen.getByText("Limpar");

      await user.type(titleInput, "Título Teste");
      await user.type(descriptionInput, "Descrição Teste");

      expect(titleInput.value).toBe("Título Teste");
      expect(descriptionInput.value).toBe("Descrição Teste");

      await user.click(clearButton);

      expect(titleInput.value).toBe("");
      expect(descriptionInput.value).toBe("");
    });

    it("deve desabilitar botões durante upload de imagem", async () => {
      const user = userEvent.setup();
      render(<CategoryForm />);

      const startUploadButton = screen.getByTestId("start-upload");
      const submitButton = screen.getByText("Criar Categoria");
      const clearButton = screen.getByText("Limpar");

      await user.click(startUploadButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(clearButton).toBeDisabled();
        expect(screen.getByText("Enviando imagem...")).toBeInTheDocument();
      });
    });

    it("deve desabilitar botões durante submissão", async () => {
      const user = userEvent.setup();
      mockCreateCategory.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<CategoryForm />);

      const titleInput = screen.getByPlaceholderText(
        "Ex: Ciências Básicas em Ortopedia",
      );
      const descriptionInput = screen.getByPlaceholderText(
        "Breve descrição da categoria",
      );
      const submitButton = screen.getByText("Criar Categoria");
      const clearButton = screen.getByText("Limpar");

      await user.type(titleInput, "Categoria Async");
      await user.type(descriptionInput, "Descrição da categoria async");
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(clearButton).toBeDisabled();
        expect(screen.getByText("Criando...")).toBeInTheDocument();
      });
    });
  });

  describe("Estado de sucesso", () => {
    it("deve mostrar mensagem de sucesso após criação", async () => {
      const user = userEvent.setup();
      render(<CategoryForm />);

      const titleInput = screen.getByPlaceholderText(
        "Ex: Ciências Básicas em Ortopedia",
      );
      const descriptionInput = screen.getByPlaceholderText(
        "Breve descrição da categoria",
      );
      const submitButton = screen.getByText("Criar Categoria");

      await user.type(titleInput, "Categoria Sucesso");
      await user.type(descriptionInput, "Descrição da categoria sucesso");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("✅ Categoria criada com sucesso!"),
        ).toBeInTheDocument();
        expect(screen.getByText("Categoria Criada!")).toBeInTheDocument();
      });
    });
  });
});
