# language: es
@api
Característica: Gestión de documentos tributarios
  Como usuario autorizado
  Quiero administrar documentos tributarios
  Para mantener información correcta durante su ciclo de vida

  Antecedentes:
    Dado que tengo una sesión válida para gestionar documentos

  @crear
  Escenario: API-CRUD-01 Crear un documento tributario
    Cuando registro un documento tributario con los siguientes datos:
      | Tipo de documento | DTE 33                         |
      | Monto (CLP)       | 450000                         |
      | Observaciones     | Creación de prueba automatizada |
    Entonces la respuesta refleja exactamente los datos enviados y los datos asignados por el sistema
    Y puedo consultar el documento creado y recibir exactamente los mismos datos

  @leer
  Escenario: API-CRUD-02 Leer documentos por receptor y tipo
    Dado que existen dos documentos propios con el mismo receptor y tipo
    Cuando consulto los documentos del receptor y tipo del documento elegido
    Entonces la lista devuelve exactamente los dos documentos propios y su total
    Y puedo abrir el detalle del documento elegido y recibir todos sus datos
    Y un identificador inexistente devuelve el error completo de documento no encontrado

  @editar
  Escenario: API-CRUD-03 Editar un documento tributario
    Dado que existe un documento tributario propio
    Cuando actualizo parcialmente el documento con estos cambios:
      | Monto (CLP)       | 452500                           |
      | Observaciones     | Documento actualizado por prueba |
    Entonces la lectura posterior confirma el documento completo actualizado

  @eliminar
  Escenario: API-CRUD-04 Eliminar un documento tributario
    Dado que existe un documento tributario propio
    Cuando elimino el documento tributario propio
    Entonces la eliminación confirma éxito sin cuerpo
    Y el documento eliminado ya no existe ni aparece en la lista
