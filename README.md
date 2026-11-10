# Prueba de automatizador QA Azurian

prueba automatizada para probar el ciclo de documentos tributarios del lab de Azurian.

```
Automatizador : Samuel Castillo

```

## Estructura del proyecto

```text
azurian-qa-automation/
├── api/
│   ├── clients/
│   │   ├── cliente-api.ts
│   │   ├── transporte-api.ts
│   │   ├── cliente-autenticacion.ts
│   │   └── cliente-documentos.ts
│   ├── features/
│   ├── fixtures/
│   │   ├── documento.fixture.ts
│   │   └── sesion.fixture.ts
│   ├── models/
│   │   └── documento.ts
│   └── steps/
├── ui/
│   ├── features/
│   ├── fixtures/
│   ├── pages/
│   │   ├── inicio-sesion.page.ts
│   │   ├── documentos.page.ts
│   │   ├── formulario-documento.page.ts
│   │   ├── detalle-documento.dialog.ts
│   │   ├── confirmacion-eliminacion.dialog.ts
│   │   └── evidencia-api.ts
│   └── steps/
├── shared/
│   ├── verificaciones.ts
│   ├── datos-prueba.ts
│   └── steps/
├── support/
├── scripts/
├── cucumber.cjs
├── package.json
└── tsconfig.json
```

Cada escenario crea su propio `runId`, folios y RUT. Los flujos de UI inicializan `azurian_lab_run_id` antes de abrir el portal para que las llamadas del navegador compartan el mismo aislamiento que la API.

## 1. Levantar el ambiente

Abre Docker Desktop. Desde la carpeta `TestPlaywright`, que contiene ambos proyectos:

```powershell
cd .\com-azurian-qa-evaluacion
docker compose up --build
```

Mantén esa ventana abierta. En una segunda ventana comprueba el ambiente:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Deberias recibir status OK.

Si el puerto 3000 no está disponible en Windows, ejecuta este comando desde la carpeta del portal y luego levanta Docker de nuevo:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

El archivo de ejemplo configura el puerto 3100. En ese caso, más adelante cambia `BASE_URL` a `http://localhost:3100`.

## 2. Preparar la automatización

Abre otra ventana de PowerShell en `TestPlaywright` y entra al proyecto independiente:

```powershell
cd .\azurian-qa-automation
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

En `.env`, confirma que `BASE_URL` coincide con el puerto del portal y completa `AZURIAN_USERNAME` y `AZURIAN_PASSWORD` con las credenciales de prueba que corresponden. El archivo `.env.example` deja esos campos vacíos para no publicar credenciales. `.env` está excluido de Git; por eso no se sube al repo por un tema de claves en el repo publico.

Instala las dependencias y el navegador de Playwright:

```powershell
npm.cmd install
npm.cmd exec -- playwright install chromium
```

En PowerShell usamos `npm.cmd`.

## 3. Ejecutar la suite de automatizacion

Primero puedes revisar el tipado estricto:

```powershell
npm.cmd run typecheck
```

La suite completa:

```powershell
npm.cmd test
```

También puedes ejecutar por cada una por separado:

```powershell
npm.cmd run test:api
npm.cmd run test:ui
npm.cmd run test:crear
npm.cmd run test:leer
npm.cmd run test:editar
npm.cmd run test:eliminar
```

Para ejecutar un solo escenario por su título:

```powershell
npm.cmd run test:scenario -- --name "API-CRUD-01 Crear un documento tributario"
```

Para elegir una operación dentro de una capa:

```powershell
npm.cmd run test:scenario -- --tags "@api and @crear"
npm.cmd run test:scenario -- --tags "@ui and @leer"
```

La interfaz se ejecuta sin mostrar la ventana del navegador. Para observarla desde el navegador, cambia `HEADLESS=false` en `.env`.

## 4. Abrir el reporte Allure

Después de una ejecución:

```powershell
npm.cmd run allure:generate
npm.cmd run allure:open
```

Los pasos de API y UI adjuntan las llamadas y respuestas observadas. Las aserciones adjuntan lo esperado y lo recibido; si un escenario de UI falla, se adjunta una captura.

## Flujo híbrido incluido

En `UI-CRUD-02`, el escenario prepara dos documentos por API, con el mismo RUT y tipo y folios distintos. Luego los busca desde el portal, verifica la fila del folio elegido y abre su detalle. La API y el navegador usan el mismo `runId` para ese escenario.

## Cobertura

- API: crear y leer el cuerpo completo, filtrar y comparar listas completas, leer un identificador inexistente, actualizar con `PATCH`, y eliminar comprobando `204`, error posterior y lista vacía.
- UI: emitir y comprobar aviso/fila, filtrar por RUT y tipo para escoger el folio exacto, abrir el detalle, editar y confirmar persistencia tras recargar, y eliminar con diálogo y comprobar que sigue ausente al recargar.
- Los documentos se localizan por la fila que contiene folio, RUT y monto. Los localizadores usan roles, etiquetas y texto accesible.
- No se usan pausas fijas ni se depende del orden de la tabla.

gracias por revisar el repo, cualquier duda o retro quedo atento
Saludos,
Samuel Castillo
Analista QA 
