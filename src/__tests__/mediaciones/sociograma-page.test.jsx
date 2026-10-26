import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import SociogramaCursoPage from "@/pages/SociogramaCursoPage";
vi.mock("@/components/layout/DashboardLayout", () => ({
  default: ({ children }) => <main>{children}</main>,
}));
vi.mock("@/services/sprint9Service", () => ({
  obtenerCursosSociograma: vi
    .fn()
    .mockResolvedValue([{ id: "curso", nombre: "7° A" }]),
  obtenerSociograma: vi.fn().mockResolvedValue({
    data: {
      curso: { nombre: "7° A" },
      nodes: [
        { id: "a", nombre: "Ana Rojas" },
        { id: "b", nombre: "Luis Pérez" },
      ],
      links: [
        {
          source: "a",
          target: "b",
          incidentes_count: 2,
          mediaciones_count: 1,
          weight: 1,
        },
      ],
      metricas: {
        estudiantes_en_riesgo: [
          { id: "a", nombre: "Ana Rojas", nivel_acompanamiento: "Seguimiento" },
        ],
        pares_criticos: [
          {
            source_id: "a",
            target_id: "b",
            source_nombre: "Ana Rojas",
            target_nombre: "Luis Pérez",
            weight: 1,
          },
        ],
      },
    },
  }),
}));
it("muestra las interacciones compartidas y las orientaciones a partir de los datos del curso", async () => {
  render(
    <MemoryRouter initialEntries={["/sociograma?curso=curso"]}>
      <SociogramaCursoPage />
    </MemoryRouter>,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Ver estudiante Ana Rojas" }),
  );
  const dialog = screen.getByRole("dialog", { name: "Ana Rojas" });
  expect(
    within(dialog).getByText("Interacciones compartidas registradas"),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByText(/Incidentes compartidos: 2/),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByText(/Mediaciones compartidas: 1/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Revisión de acompañamiento" }),
  ).toBeInTheDocument();
});
