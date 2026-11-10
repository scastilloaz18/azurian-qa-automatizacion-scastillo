# language: es
@ui
Característica: Gestión de documentos tributarios desde el portal
  Como usuario del portal
  Quiero administrar documentos tributarios
  Para asegurar que cada cambio se refleje en pantalla

  Antecedentes:
    Dado que inicié sesión en el portal

  @crear
  Escenario: UI-CRUD-01 Emitir un documento tributario
    Cuando emito un documento tributario con los siguientes datos:
      | Tipo de documento | DTE 33                       |
      | Monto (CLP)       | 450000                       |
      | Observaciones     | Documento creado en el portal |
    Entonces el portal muestra el aviso correcto y la fila completa del documento

  @leer
  Escenario: UI-CRUD-02 Leer el documento correcto entre documentos relacionados
    Dado que existen dos documentos propios con el mismo receptor y tipo
    Cuando busco los documentos del receptor por tipo y selecciono el folio esperado
    Entonces el detalle muestra todos los datos del documento elegido

  @editar
  Escenario: UI-CRUD-03 Editar un documento y conservar el cambio
    Dado que existe un documento tributario propio
    Cuando actualizo el documento desde su formulario con estos cambios:
      | Monto (CLP)       | 452500                         |
      | Observaciones     | Cambio guardado desde el portal |
    Entonces el portal muestra los cambios y los conserva al recargar

  @eliminar
  Escenario: UI-CRUD-04 Eliminar un documento y comprobar su ausencia
    Dado que existe un documento tributario propio
    Cuando elimino el documento desde el portal y confirmo la acción
    Entonces el documento desaparece del filtro y continúa ausente después de recargar
