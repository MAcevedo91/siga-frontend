import { test, expect } from "@playwright/test";
const ids = {
  med: "11111111-1111-4111-8111-111111111111",
  a: "22222222-2222-4222-8222-222222222222",
  b: "33333333-3333-4333-8333-333333333333",
  c: "44444444-4444-4444-8444-444444444444",
};
const students = [
  { id: ids.a, nombre: "Ana", apellido: "Rojas", rut: "11.111.111-1" },
  { id: ids.b, nombre: "Luis", apellido: "Pérez", rut: "22.222.222-2" },
];
const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
const mediation = () => ({
  id: ids.med,
  version_documental: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  folio: "MED-2026-001",
  motivo: "Resolver diferencias mediante diálogo formativo.",
  fecha_programada: `${future}T13:00:00Z`,
  estado: "programada",
  lugar_sesion: "Sala de convivencia",
  mediacion_participantes: students.map((estudiantes, i) => ({
    id: `p${i}`,
    estudiante_id: estudiantes.id,
    estudiantes,
  })),
  mediacion_compromisos: [],
  cerrada_at: null,
});
async function setup(
  page,
  { role = "Administrador", noticeFail = false, documentsEnabled = true } = {},
) {
  let documents = [];
  let med = mediation(),
    creates = 0;
  if (!documentsEnabled) delete med.version_documental;
  await page.addInitScript(
    ({ role }) => {
      localStorage.setItem("token", "local-test-token");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "test-user",
          nombre: "Daniel",
          rol: role,
          tenant_id: "test-tenant",
        }),
      );
    },
    { role },
  );
  await page.route("**/socket.io/**", (r) => r.abort());
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname.replace(/^\/api(?:\/v1)?/, "");
    const json = (body, status = 200) => route.fulfill({ status, json: body });
    if (path === "/notificaciones/contador")
      return json({ data: { count: 0 } });
    if (path === "/notificaciones") return json({ data: [] });
    if (path === "/estudiantes") return json({ data: students });
    if (path === "/cursos")
      return json({ data: [{ id: "curso-1", nombre: "7° Básico A" }] });
    if (path.endsWith("/documentos")) {
      if (req.method() === "POST") {
        const signature = (req.postData() || "").includes("image/png");
        const doc = {
          id: ids.c,
          tipo: signature ? "firma" : "acta_fisica",
          mime_type: signature ? "image/png" : "application/pdf",
          created_at: new Date().toISOString(),
          vigente: true,
        };
        documents = [doc, ...documents];
        return json({ data: doc }, 201);
      }
      return json({ data: documents });
    }
    if (path === "/mediaciones" && req.method() === "POST") {
      creates++;
      med = { ...med, ...req.postDataJSON() };
      return json({ data: med }, 201);
    }
    if (path === "/mediaciones")
      return json({ data: [med], total: 1, page: 1, limit: 12, totalPages: 1 });
    if (path.endsWith("/notificar-apoderados"))
      return noticeFail
        ? json({ message: "Correo no disponible" }, 503)
        : json({ data: { total_notificados: 2, notificados: [] } });
    if (path.endsWith("/compromisos")) {
      med = {
        ...med,
        mediacion_compromisos: req.postDataJSON().compromisos.map((c, i) => ({
          ...c,
          id: `c${i}`,
          estado: "pendiente",
        })),
        estado: "acordada",
      };
      return json({ data: med });
    }
    if (path.endsWith("/evaluar-compromisos"))
      return json({ data: { total_evaluados: 1 } });
    if (path.endsWith("/cerrar")) {
      med = {
        ...med,
        ...req.postDataJSON(),
        cerrada_at: new Date().toISOString(),
      };
      return json({ data: med });
    }
    if (path === `/mediaciones/${ids.med}`) return json({ data: med });
    if (path === "/sociograma/curso/curso-1")
      return json({
        data: {
          curso: { id: "curso-1", nombre: "7° Básico A" },
          nodes: students.map((s) => ({
            ...s,
            nombre: `${s.nombre} ${s.apellido}`,
            conflictividad_total: 2,
          })),
          links: [{ source: ids.a, target: ids.b, weight: 2 }],
          metricas: {
            total_estudiantes: 2,
            densidad_red_pct: 100,
            tasa_integracion_pct: 100,
          },
        },
      });
    return json({ data: [] });
  });
  return { getCreates: () => creates };
}
test("registra mediación, guarda acuerdos y cierra el expediente", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/mediaciones/nueva");
  await page.getByLabel("Buscar estudiantes").fill("Ana");
  await page.getByRole("button", { name: /Agregar Ana Rojas/ }).click();
  await page.getByRole("button", { name: /Agregar Luis Pérez/ }).click();
  await page
    .getByLabel("Motivo de la mediación")
    .fill("Resolver un conflicto con diálogo y reparación.");
  await page.getByLabel("Fecha y hora de la sesión").fill(`${future}T10:00`);
  await page
    .getByRole("button", { name: "Crear mediación", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/mediaciones/${ids.med}$`));
  await page
    .getByRole("button", { name: "Agregar acuerdo personalizado" })
    .click();
  await page
    .getByLabel("Descripción del acuerdo 1")
    .fill("Conversar respetuosamente y reparar el daño acordado.");
  await page.getByLabel("Fecha límite del acuerdo 1").fill(future);
  await page
    .getByRole("button", { name: "Guardar acuerdos", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Acuerdos guardados" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Evaluar y cerrar", exact: true })
    .click();
  await page.getByLabel("Evaluación del compromiso 1").selectOption("cumplido");
  await page
    .getByLabel("Reflexión y conclusiones de cierre")
    .fill("Se verificó el cumplimiento y el diálogo entre las partes.");
  await page
    .getByRole("button", { name: "Evaluar y cerrar expediente", exact: true })
    .click();
  await expect(
    page.getByText("Conclusiones del cierre", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Guardar acuerdos", exact: true }),
  ).toHaveCount(0);
});
test("un aviso fallido conserva la mediación y no duplica su creación", async ({
  page,
}) => {
  const state = await setup(page, { noticeFail: true });
  await page.goto("/mediaciones/nueva");
  await page.getByLabel("Buscar estudiantes").fill("Ana");
  await page.getByRole("button", { name: /Agregar Ana Rojas/ }).click();
  await page.getByRole("button", { name: /Agregar Luis Pérez/ }).click();
  await page
    .getByLabel("Motivo de la mediación")
    .fill("Resolver diferencias en una sesión de diálogo.");
  await page.getByLabel("Fecha y hora de la sesión").fill(`${future}T10:00`);
  await page
    .getByRole("button", { name: "Crear mediación", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "La mediación fue creada",
  );
  await page.getByRole("button", { name: "Reintentar aviso" }).click();
  await expect(
    page.getByRole("button", { name: "Reintentar aviso" }),
  ).toBeEnabled();
  expect(state.getCreates()).toBe(1);
});
test("sociograma permite seleccionar estudiante y exportar imagen", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/sociograma");
  await page.getByLabel("Curso", { exact: true }).selectOption("curso-1");
  await page.getByRole("button", { name: "Ver estudiante Ana Rojas" }).click();
  await expect(page.getByRole("dialog", { name: "Ana Rojas" })).toBeVisible();
  await page.getByRole("button", { name: "Cerrar ventana" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar imagen" }).click();
  expect((await download).suggestedFilename()).toBe("sociograma-curso.png");
});
test("impide acceder a mediaciones a un rol no autorizado por la API", async ({
  page,
}) => {
  await setup(page, { role: "Psicólogo" });
  await page.goto("/mediaciones");
  await expect(page).toHaveURL(/no-autorizado/);
});
test("el tablero conserva diseño sin desbordamiento en móvil", async ({
  page,
}) => {
  await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/mediaciones");
  await expect(page.getByText("MED-2026-001")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/siga-s9-mobile.png", fullPage: true });
});

test("guarda una firma manuscrita y un acta física en el expediente", async ({
  page,
}) => {
  await setup(page);
  await page.goto(`/mediaciones/${ids.med}`);
  await page
    .getByRole("button", { name: "Capturar firma", exact: true })
    .click();
  const canvas = page.getByLabel("Lienzo para firma manuscrita");
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 35, box.y + 40);
  await page.mouse.down();
  await page.mouse.move(box.x + 180, box.y + 65, { steps: 12 });
  await page.mouse.up();
  await page.getByRole("checkbox", { name: /El firmante confirma/ }).check();
  await page
    .getByRole("button", { name: "Guardar firma en expediente" })
    .click();
  await expect(
    page.getByRole("button", { name: "Descargar firma", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Acta física firmada en PDF").setInputFiles({
    name: "acta.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\nActa de prueba\n%%EOF"),
  });
  await page
    .getByRole("button", { name: "Guardar acta física", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Descargar acta física", exact: true }),
  ).toBeVisible();
});

test("la API sin anexos mantiene el expediente operativo y desactiva persistencia de firmas", async ({
  page,
}) => {
  await setup(page, { documentsEnabled: false });
  let calls = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/documentos")) calls++;
  });
  await page.goto(`/mediaciones/${ids.med}`);
  await expect(
    page.getByRole("button", { name: "Guardar acta física", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Capturar firma", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Guardar firma en expediente",
      exact: true,
    }),
  ).toBeDisabled();
  expect(calls).toBe(0);
});
