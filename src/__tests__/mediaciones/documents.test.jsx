import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import DocumentosMediacion from "@/components/mediaciones/DocumentosMediacion";
import HistorialInformesMedicosCard from "@/components/estudiantes/HistorialInformesMedicosCard";
import * as med from "@/services/mediacionesService";
import * as salud from "@/services/sprint9Service";
vi.mock("@/services/mediacionesService", () => ({
  listarDocumentosMediacion: vi.fn(),
  subirDocumentoMediacion: vi.fn(),
  descargarDocumentoMediacion: vi.fn(),
}));
vi.mock("@/services/sprint9Service", () => ({
  listarInformesEspecialista: vi.fn(),
  obtenerInformeOriginal: vi.fn(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  med.listarDocumentosMediacion.mockResolvedValue([]);
});
it("rechaza un adjunto físico distinto de PDF sin enviarlo", async () => {
  render(
    <DocumentosMediacion
      mediacion={{ id: "m", version_documental: "version-revisada" }}
      canWrite
      onUpdated={() => {}}
    />,
  );
  const file = new File(["html"], "acta.html", { type: "text/html" });
  fireEvent.change(screen.getByLabelText("Acta física firmada en PDF"), {
    target: { files: [file] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar acta física" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("PDF"),
  );
  expect(med.subirDocumentoMediacion).not.toHaveBeenCalled();
});
it("conserva el error de guardado y no confirma persistencia si falla el servidor", async () => {
  med.subirDocumentoMediacion.mockRejectedValue(
    new Error("No se pudo guardar"),
  );
  const updated = vi.fn();
  render(
    <DocumentosMediacion
      mediacion={{ id: "m", version_documental: "version-revisada" }}
      canWrite
      onUpdated={updated}
    />,
  );
  fireEvent.change(screen.getByLabelText("Acta física firmada en PDF"), {
    target: {
      files: [new File(["%PDF-1.7"], "acta.pdf", { type: "application/pdf" })],
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar acta física" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo guardar"),
  );
  expect(updated).not.toHaveBeenCalled();
});
it("descarga el original por ID y muestra error sin regenerarlo", async () => {
  salud.listarInformesEspecialista.mockResolvedValue({
    items: [
      {
        id: "i",
        especialista_destino: "Profesional",
        archivo_disponible: true,
      },
    ],
    pagination: { totalPages: 1 },
  });
  salud.obtenerInformeOriginal.mockRejectedValue(
    new Error("Archivo original no disponible"),
  );
  render(<HistorialInformesMedicosCard estudianteId="e" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Descargar original" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Archivo original no disponible",
    ),
  );
  expect(salud.obtenerInformeOriginal).toHaveBeenCalledWith("e", "i");
});

it("mantiene usable el expediente con la API actual sin solicitar anexos no habilitados", () => {
  render(
    <DocumentosMediacion
      mediacion={{ id: "actual" }}
      canWrite
      onUpdated={() => {}}
    />,
  );
  expect(med.listarDocumentosMediacion).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Guardar acta física" }),
  ).toBeDisabled();
  expect(
    screen.getByText(/guardado de firmas y actas todavía no está habilitado/i),
  ).toBeInTheDocument();
});
