
# REQUERIMIENTOS FUNCIONALES Y TÉCNICOS
# PREMIOS V2.0.0
**Módulo de recepción, validación y almacenamiento de plantillas**

---

## 1. OBJETIVO DEL PROYECTO

Desarrollar una aplicación web que permita a las diferentes oficinas realizar la carga de sus plantillas de información correspondientes al proceso de PREMIOS, garantizando la calidad, integridad y consistencia de los datos antes de almacenarlos en Google Drive.

Actualmente, las oficinas cuentan con acceso a una carpeta compartida donde pueden depositar directamente sus archivos, sin que exista un mecanismo previo que garantice que la información esté completa y correctamente estructurada.

Esta situación ha generado inconsistencias, registros incompletos, problemas en los cruces de información y reprocesos durante las etapas posteriores del proceso.

Por lo anterior, se requiere implementar una interfaz que centralice la recepción de archivos y ejecute validaciones automáticas antes de permitir su almacenamiento.

### Principio fundamental

**Ningún archivo debe almacenarse como una carga válida si no ha superado la totalidad de las validaciones establecidas.**

El comportamiento esperado es:

- Si el archivo cumple todas las validaciones, el sistema debe permitir su almacenamiento automático en la ubicación correspondiente de Google Drive.
- Si el archivo presenta errores, debe rechazarse la operación y mostrarse un reporte detallado de las inconsistencias.
- El usuario debe poder corregir su archivo y volver a cargarlo sin necesidad de iniciar nuevamente todo el proceso.
- No deben almacenarse archivos parcialmente válidos ni permitir que las oficinas omitan los controles establecidos.

El propósito no es simplemente habilitar una carga de archivos, sino establecer un mecanismo de control de calidad de datos desde su origen.

---

## 2. CONTEXTO TECNOLÓGICO

La solución se desarrollará utilizando Google Apps Script, con su entorno de ejecución V8.

La aplicación debe aprovechar los servicios nativos de Google, especialmente:

- Google Apps Script.
- Google Drive.
- Google Sheets, cuando sea necesario.
- HTML, CSS y JavaScript para la interfaz.

Se debe priorizar una implementación compatible con las capacidades reales de Google Apps Script, evitando dependencias innecesarias y servicios externos que no aporten valor funcional.

---

## 3. PLANTILLA OFICIAL Y ESTRUCTURA DE LOS DATOS

La plantilla oficial ya fue definida por las compañeras responsables del proceso.

**No se debe modificar su estructura, crear una plantilla alternativa ni establecer encabezados diferentes sin autorización.**

El archivo de referencia es:

**1. Plantilla_Guia.xlsx**

https://docs.google.com/spreadsheets/d/1-t7E12lQN8C6MuLFaVRWCs5zarYCkgH8/edit

Antes de implementar las validaciones, se debe inspeccionar esta plantilla para identificar:

- Hojas existentes.
- Encabezados reales.
- Orden de las columnas.
- Tipos de datos.
- Formatos de las celdas.
- Posibles listas desplegables.
- Particularidades de los datos.
- Filas que contienen encabezados y registros.
- Cualquier elemento adicional que pueda afectar la lectura de la información.

La plantilla oficial constituye la referencia estructural del proceso.

### 3.1. Campos obligatorios

Los siguientes 15 campos son obligatorios:

| N.º | Campo |
|---:|---|
| 1 | MES |
| 2 | CORREO DE QUIEN INGRESA LA INFORMACIÓN |
| 3 | NOMBRE DE LA COMPAÑÍA |
| 4 | ÁREA DUEÑA DE LA CAMPAÑA |
| 5 | MES DE ENTREGA EL PREMIO |
| 6 | AÑO DE ENTREGA DEL PREMIO |
| 7 | CUENTA CONTABLE DEL GASTO U OTRA |
| 8 | CENTRO DE COSTOS |
| 9 | SUBPROYECTO |
| 10 | REGISTRADO EN COLJUEGOS (SÍ O NO) |
| 11 | TIPO ID BENEFICIARIO DEL PREMIO |
| 12 | NÚMERO ID BENEFICIARIO DEL PREMIO |
| 13 | NOMBRES Y APELLIDOS O RAZÓN SOCIAL BENEFICIARIO DEL PREMIO |
| 14 | VALOR TOTAL DEL PREMIO BASE |
| 15 | IMPUESTO ASUMIDO (SÍ / NO) |

Todos estos campos deben existir en la estructura de la plantilla y contener información válida en cada registro.

### 3.2. Validación de estructura

El sistema debe verificar que el archivo cargado corresponda a la estructura de la plantilla oficial.

Como mínimo:

1. Identificar la hoja que contiene la información.
2. Verificar la existencia de los encabezados obligatorios.
3. Detectar columnas faltantes.
4. Detectar encabezados duplicados.
5. Identificar encabezados que no correspondan a los definidos.
6. Verificar que existan registros para procesar.
7. Evitar que una estructura diferente sea interpretada incorrectamente como una plantilla válida.

No basta con verificar que existan 15 columnas. Se debe comprobar que los nombres y la correspondencia de los encabezados sean correctos.

Si se identifican diferencias en los encabezados, el sistema debe reportarlas indicando cuáles faltan, cuáles sobran o cuáles presentan inconsistencias.

No realizar equivalencias automáticas entre columnas con nombres diferentes sin una regla previamente aprobada.

### 3.3. Validación a nivel de registro

La validación debe ejecutarse sobre cada fila que contenga información.

Si una sola fila presenta un campo obligatorio vacío o inválido, el archivo completo debe rechazarse.

Ejemplo:

Si un archivo contiene 150 registros y únicamente el registro 87 tiene vacío el campo CENTRO DE COSTOS, se debe rechazar la totalidad del archivo.

No se deben almacenar parcialmente los registros correctos.

### 3.4. Reglas de validación de datos

Cada columna debe tener reglas de validación acordes con su naturaleza.

Se deben implementar, como mínimo, las siguientes:

| Campo | Validación requerida |
|---|---|
| MES | Debe corresponder a un mes válido. |
| CORREO DE QUIEN INGRESA LA INFORMACIÓN | Debe contener una dirección de correo electrónico con estructura válida. |
| NOMBRE DE LA COMPAÑÍA | No puede estar vacío. |
| ÁREA DUEÑA DE LA CAMPAÑA | No puede estar vacío. |
| MES DE ENTREGA EL PREMIO | Debe corresponder a un mes válido. |
| AÑO DE ENTREGA DEL PREMIO | Debe ser un año numérico válido. |
| CUENTA CONTABLE DEL GASTO U OTRA | No puede estar vacío y debe conservar su estructura original. |
| CENTRO DE COSTOS | No puede estar vacío y debe conservar su estructura original. |
| SUBPROYECTO | No puede estar vacío. |
| REGISTRADO EN COLJUEGOS | Solo debe aceptar SÍ o NO. |
| TIPO ID BENEFICIARIO DEL PREMIO | No puede estar vacío. |
| NÚMERO ID BENEFICIARIO DEL PREMIO | No puede estar vacío y debe conservar su identificación original. |
| NOMBRES Y APELLIDOS O RAZÓN SOCIAL BENEFICIARIO DEL PREMIO | No puede estar vacío. |
| VALOR TOTAL DEL PREMIO BASE | Debe ser un valor numérico válido. |
| IMPUESTO ASUMIDO | Solo debe aceptar SÍ o NO. |

Estas reglas constituyen la validación inicial. Si la plantilla contiene restricciones adicionales, deben identificarse y evaluarse antes de incorporarlas.

### 3.5. Consideraciones sobre los tipos de datos

Se debe prestar especial atención a los siguientes aspectos:

**Identificaciones y códigos**

Los campos correspondientes a identificaciones, cuentas contables, centros de costos y subproyectos pueden contener códigos con ceros a la izquierda.

Por lo tanto:

- No deben convertirse indiscriminadamente a números.
- Se debe conservar su representación original.
- No se deben eliminar ceros iniciales.
- No se deben utilizar conversiones que alteren los identificadores.

**Campos SÍ / NO**

Los campos REGISTRADO EN COLJUEGOS e IMPUESTO ASUMIDO deben aceptar exclusivamente los valores definidos.

Se debe determinar, a partir de la plantilla oficial, si existen variaciones de escritura autorizadas, como:

- SÍ.
- SI.
- NO.

Cualquier normalización debe ser controlada y no debe aceptar valores arbitrarios.

**Meses**

Los campos MES y MES DE ENTREGA EL PREMIO deben validarse de manera independiente.

Es importante no confundir ambos campos, ya que pueden representar periodos diferentes.

**Valores económicos**

El campo VALOR TOTAL DEL PREMIO BASE requiere una validación especial.

Se tienen como valores de referencia:

| Concepto | UVT | Valor de referencia |
|---|---:|---:|
| Premio base | 48 UVT | $2.514.000 |
| Otros ingresos tributarios | 10 UVT | $524.000 |

Estos valores deben considerarse dentro de la lógica de negocio correspondiente.

No se debe asumir que todos los registros necesariamente deben coincidir con alguno de estos dos valores. Primero se debe verificar la regla de negocio aplicable en la plantilla y el proceso.

---

## 4. REPORTE DE ERRORES Y RECHAZO DE ARCHIVOS

Esta funcionalidad es prioritaria.

Cuando un archivo presente inconsistencias, el sistema debe rechazar la carga y proporcionar un reporte detallado que permita al usuario corregirlas.

No se deben mostrar mensajes genéricos como:

- El archivo contiene errores.
- Formato inválido.
- No fue posible procesar el archivo.

El usuario debe conocer exactamente qué está mal.

### 4.1. Información del reporte

Cada inconsistencia debe incluir:

- Número de fila.
- Nombre de la columna.
- Valor encontrado, cuando corresponda.
- Tipo de error.
- Descripción del problema.
- Recomendación para corregirlo.

### 4.2. Ejemplo de reporte

**Archivo rechazado:** `plantilla_premios_noviembre.xlsx`

| Fila | Columna | Valor encontrado | Error |
|---:|---|---|---|
| 8 | CORREO DE QUIEN INGRESA LA INFORMACIÓN | Vacío | Campo obligatorio sin diligenciar. |
| 15 | CENTRO DE COSTOS | Vacío | No contiene información. |
| 23 | REGISTRADO EN COLJUEGOS | TAL VEZ | Valor inválido. Se esperaba SÍ o NO. |
| 31 | VALOR TOTAL DEL PREMIO BASE | ABC | Se esperaba un valor numérico. |
| 42 | NÚMERO ID BENEFICIARIO DEL PREMIO | Vacío | Campo obligatorio sin diligenciar. |

### 4.3. Comportamiento del reporte

El sistema debe:

1. Detectar todos los errores posibles en una misma ejecución.
2. Agruparlos en un reporte organizado.
3. Identificar claramente la fila y columna afectadas.
4. Mostrar el total de registros revisados.
5. Mostrar el número de filas con inconsistencias.
6. Mostrar el número total de errores detectados.
7. Permitir al usuario volver a cargar el archivo corregido.

No obligar al usuario a realizar múltiples intentos para descubrir errores que podían detectarse en una misma validación.

### 4.4. Descarga del reporte

Se recomienda incorporar la posibilidad de descargar un reporte de inconsistencias en Excel.

Este reporte debe incluir:

- Número de fila original.
- Nombre de la columna.
- Valor encontrado.
- Tipo de error.
- Descripción del error.

La descarga debe ser independiente del archivo original y no debe alterar la información cargada.

---

## 5. INTERFAZ DE USUARIO

Se requiere una aplicación web moderna, intuitiva, profesional y altamente interactiva.

La experiencia debe ser sencilla para cualquier oficina, independientemente de sus conocimientos técnicos.

El usuario debe poder realizar todo el proceso desde una única interfaz, sin necesidad de acceder directamente a las carpetas de Google Drive.

### 5.1. Pantalla principal

Debe incluir:

- Logo institucional de Davivienda.
- Identificación del módulo PREMIOS.
- Descripción breve de la herramienta.
- Área principal para cargar archivos.
- Acceso a la plantilla oficial.
- Instrucciones de carga.
- Información sobre los formatos permitidos.

### 5.2. Zona de carga

Implementar una zona de carga que permita:

- Seleccionar archivos desde el equipo.
- Arrastrar y soltar archivos (Drag & Drop).
- Visualizar el nombre del archivo seleccionado.
- Visualizar su extensión y tamaño.
- Eliminar la selección y elegir otro archivo.
- Iniciar la validación.

Se deben restringir los formatos a los que realmente soporte la implementación y que correspondan a la plantilla oficial.

No aceptar extensiones únicamente por su nombre: se debe comprobar que el archivo pueda leerse correctamente.

### 5.3. Estados de la interfaz

La interfaz debe contemplar diferentes estados:

| Estado | Comportamiento esperado |
|---|---|
| Inicial | Mostrar la zona de carga y las instrucciones. |
| Archivo seleccionado | Mostrar los datos del archivo seleccionado. |
| Validando | Mostrar progreso y evitar envíos duplicados. |
| Archivo válido | Mostrar confirmación de validación exitosa. |
| Archivo rechazado | Mostrar el reporte completo de errores. |
| Almacenando | Informar que el archivo está siendo guardado en Drive. |
| Carga completada | Mostrar confirmación de almacenamiento exitoso. |
| Error de almacenamiento | Informar el problema y permitir un reintento seguro. |

### 5.4. Experiencia de corrección

Cuando un archivo sea rechazado:

- No se debe limpiar innecesariamente la interfaz.
- Se deben conservar los datos del archivo rechazado mientras el usuario revisa el resultado.
- Debe existir una acción clara para seleccionar una versión corregida.
- Se debe permitir ejecutar nuevamente la validación.
- No se debe almacenar el archivo rechazado en las carpetas de destino.

---

## 6. IDENTIDAD VISUAL Y RECURSOS

La interfaz debe utilizar la paleta institucional de Davivienda.

La siguiente tabla establece los colores de referencia del proyecto:

| Rol en la interfaz | Color | Código HEX | Uso |
|---|---|---|---|
| Primario (Marca) | Rojo Davivienda | `#E30518` | Botones principales, CTA, enlaces activos e íconos clave. |
| Primario Hover | Rojo oscuro | `#B80413` | Estados hover y active. |
| Acento cálido | Amarillo / Naranja | `#FFB800` | Alertas suaves y detalles secundarios. |
| Fondo principal | Blanco puro | `#FFFFFF` | Fondo general y tarjetas. |
| Fondo secundario | Gris muy claro | `#F5F5F7` | Secciones alternas y campos de formulario. |
| Texto principal | Carbón oscuro | `#2D2A26` | Títulos y contenido principal. |
| Texto secundario | Gris medio | `#6E6A66` | Subtítulos, ayudas y elementos secundarios. |

### 6.1. Reglas de aplicación

Aplicar la regla 60-30-10:

- 60% fondos blancos y grises claros.
- 30% textos y estructuras neutras.
- 10% rojo institucional y acentos.

Los botones principales deben tener fondo `#E30518` y texto blanco `#FFFFFF`.

El estado hover debe utilizar `#B80413`.

No utilizar el rojo como fondo indiscriminado de toda la aplicación.

Los colores de éxito, advertencia y error deben distinguirse claramente, manteniendo la coherencia con la identidad visual.

### 6.2. Logo institucional

El logo que se utilizará en la interfaz se encuentra en Google Drive:

https://drive.google.com/file/d/1lHl_BYp0-X8XS_WiiVNS9zlJKGGzhGSX/view

ID del archivo:

`1lHl_BYp0-X8XS_WiiVNS9zlJKGGzhGSX`

**Requisito:** el identificador del logo debe almacenarse en las Propiedades del script de Google Apps Script.

No escribir el ID directamente en el código HTML.

La aplicación debe recuperar el identificador desde la configuración del proyecto y utilizarlo para mostrar el recurso visual.

---

## 7. ESTRUCTURA DE GOOGLE DRIVE

La aplicación debe trabajar sobre las carpetas existentes.

No crear estructuras paralelas ni duplicar carpetas innecesariamente.

### 7.1. Carpeta principal

**PREMIOS V2.0.0**

https://drive.google.com/drive/folders/1kELMnS4RuM_PEpW8POMW5WRIS8A7BumH

Dentro de esta carpeta se encuentra:

**2026**

https://drive.google.com/drive/folders/1DlL1MkqHb6Lg__207NRXiDD3_Hpibqch

Dentro de 2026 se encuentra:

**1. Plantilla_Guia.xlsx**

https://docs.google.com/spreadsheets/d/1-t7E12lQN8C6MuLFaVRWCs5zarYCkgH8/edit

### 7.2. Carpetas mensuales de recepción

Dentro de la carpeta 2026 se deben crear las carpetas correspondientes a cada mes:

```text
2026/
│
├── 1. Plantilla_Guia.xlsx
├── ENERO/
├── FEBRERO/
├── MARZO/
├── ABRIL/
├── MAYO/
├── JUNIO/
├── JULIO/
├── AGOSTO/
├── SEPTIEMBRE/
├── OCTUBRE/
├── NOVIEMBRE/
└── DICIEMBRE/
```

El sistema debe crear automáticamente las carpetas cuando sean necesarias.

Reglas:

- Verificar si la carpeta del mes existe antes de crearla.
- Evitar carpetas duplicadas.
- Guardar los archivos en el periodo correspondiente.
- Mantener la organización por año y mes.
- Evitar sobrescribir archivos existentes.

La carpeta correspondiente debe determinarse mediante la lógica de periodo de carga definida para el proceso, diferenciándola del mes de entrega del premio.

### 7.3. Carpeta PROCESOS

Ubicación:

https://drive.google.com/drive/folders/1b7sUD2PUgLdRT-QxWbNWotAzbIIW7vt8

Esta carpeta contiene dos subcarpetas principales.

#### A. SALIDA

https://drive.google.com/drive/folders/1x1SF7rjyhA0chLgnp3F54hP0ZLQMs-9J

En esta ubicación se almacenarán los archivos de salida generados por el proceso.

Se deben crear automáticamente carpetas mensuales para facilitar que los usuarios encuentren sus archivos.

Ejemplo:

```text
SALIDA/
│
├── ENERO/
├── FEBRERO/
├── MARZO/
├── ABRIL/
├── MAYO/
├── JUNIO/
├── JULIO/
├── AGOSTO/
├── SEPTIEMBRE/
├── OCTUBRE/
├── NOVIEMBRE/
└── DICIEMBRE/
```

#### B. PROCESADOS

https://drive.google.com/drive/folders/1jpyWjvH4_WXJI80BqU02ac9Ujt3M29qv

En esta ubicación deben organizarse los archivos que hayan sido procesados correctamente.

La organización debe conservar el orden cronológico por mes y año.

Ejemplo:

```text
PROCESADOS/
│
├── ENERO/
├── FEBRERO/
├── MARZO/
├── ABRIL/
├── MAYO/
├── JUNIO/
├── JULIO/
├── AGOSTO/
├── SEPTIEMBRE/
├── OCTUBRE/
├── NOVIEMBRE/
└── DICIEMBRE/
```

La creación de las carpetas debe ser automática cuando corresponda.

### 7.4. Reglas generales de almacenamiento

1. No almacenar archivos rechazados como cargas válidas.
2. Guardar exclusivamente archivos que hayan superado todas las validaciones.
3. Conservar el archivo original.
4. Evitar sobrescrituras accidentales.
5. Verificar la existencia de las carpetas antes de crear nuevas.
6. Organizar los archivos por año y mes.
7. Manejar adecuadamente los errores de Google Drive.
8. Evitar que una operación fallida deje archivos incompletos o inconsistentes.
9. Confirmar al usuario el almacenamiento únicamente cuando este haya finalizado correctamente.

---

## 8. FLUJO FUNCIONAL COMPLETO

El flujo esperado de la aplicación es el siguiente:

```text
INICIO
   |
   v
Usuario ingresa a la aplicación
   |
   v
Selecciona o arrastra la plantilla
   |
   v
Sistema recibe el archivo
   |
   v
Verifica extensión y estructura del archivo
   |
   v
Verifica encabezados obligatorios
   |
   v
Valida los registros y tipos de datos
   |
   v
¿Existen errores?
   |
   |----------------------|
   |                      |
  SÍ                     NO
   |                      |
   v                      v
Rechazar archivo       Preparar almacenamiento
   |                      |
   v                      v
Generar reporte        Verificar carpeta destino
de inconsistencias        |
   |                      v
   v                   Guardar archivo
Mostrar errores           |
   |                      v
   v                   Confirmar carga
Usuario corrige           |
   |                      v
   v                     FIN
Volver a cargar
   |
   v
Ejecutar validación nuevamente
```

### Reglas del flujo

- No debe existir almacenamiento antes de finalizar la validación.
- El proceso debe ejecutarse de manera segura.
- Se deben evitar operaciones duplicadas.
- La confirmación de éxito debe producirse únicamente después de verificar el almacenamiento.
- Si falla el almacenamiento, se debe informar al usuario y permitir una recuperación segura.

---

## 9. SEGURIDAD Y CONTROL DE ACCESO

Actualmente existe un correo o mecanismo de acceso predeterminado que permite a las personas ingresar a las carpetas y depositar archivos sin validación.

La nueva solución debe eliminar esa dependencia como mecanismo de recepción.

Se debe considerar:

- La interfaz como único punto de entrada para las nuevas cargas.
- La validación en el servidor.
- El control de permisos sobre las carpetas de Google Drive.
- La protección de los identificadores y configuraciones.
- La prevención de cargas duplicadas.
- El manejo seguro de errores.
- La separación entre archivos rechazados y archivos válidos.

Es importante revisar los permisos actuales de Google Drive y determinar qué cambios administrativos son necesarios para evitar que los usuarios sigan depositando archivos directamente en las carpetas de recepción.

No asumir que desarrollar la interfaz elimina automáticamente los permisos de acceso existentes.

---

## 10. TRAZABILIDAD Y AUDITORÍA

Se recomienda incorporar un registro de las operaciones de carga.

Cada operación debería permitir identificar:

| Dato | Descripción |
|---|---|
| Fecha y hora | Momento en que se realizó la carga. |
| Usuario | Correo de quien realizó la operación, cuando esté disponible. |
| Nombre del archivo | Nombre original del archivo cargado. |
| Periodo | Mes y año de la carga. |
| Registros revisados | Cantidad de filas evaluadas. |
| Resultado | Aprobado o rechazado. |
| Errores | Cantidad de inconsistencias detectadas. |
| Almacenamiento | Confirmación del resultado en Google Drive. |

La trazabilidad debe facilitar el seguimiento de las cargas y la identificación de posibles problemas operativos.

---

## 11. ARQUITECTURA Y ORGANIZACIÓN DEL CÓDIGO

Se requiere una arquitectura compacta, organizada y escalable.

**No se debe fragmentar innecesariamente la implementación en múltiples archivos `.gs` y `.html`.**

Se debe mantener una cantidad reducida de archivos, con responsabilidades claramente definidas.

Como mínimo, deben contemplarse:

- Inicialización y publicación de la aplicación.
- Configuración centralizada.
- Lógica de validación.
- Gestión de Google Drive.
- Interfaz de usuario.

Estas responsabilidades pueden organizarse en pocos archivos siempre que se conserve la legibilidad y mantenibilidad.

### Reglas obligatorias

- No crear archivos innecesarios.
- No duplicar funciones.
- No dispersar configuraciones.
- No introducir dependencias sin justificación.
- No modificar archivos existentes sin inspeccionarlos.
- No implementar soluciones difíciles de mantener.
- Mantener compatibilidad con Apps Script V8.
- Separar la lógica del servidor y la presentación del frontend.
- Centralizar el manejo de errores.
- Utilizar funciones reutilizables.

La arquitectura debe permitir incorporar posteriormente nuevas reglas de validación y funcionalidades sin tener que reconstruir toda la aplicación.

---

## 12. PRUEBAS Y CRITERIOS DE ACEPTACIÓN

La solución no se considerará terminada únicamente porque la interfaz permita seleccionar y subir archivos.

Se deben ejecutar pruebas que permitan comprobar el funcionamiento real de las validaciones y del almacenamiento.

### 12.1. Pruebas de estructura

| Caso | Resultado esperado |
|---|---|
| Plantilla con todos los encabezados | Continuar con las validaciones. |
| Falta un encabezado obligatorio | Rechazar e identificar el encabezado faltante. |
| Encabezado duplicado | Rechazar e identificar la inconsistencia. |
| Encabezado diferente | Reportar la diferencia. |
| Archivo sin registros | Rechazar. |
| Archivo con estructura no compatible | Rechazar. |

### 12.2. Pruebas de contenido

| Caso | Resultado esperado |
|---|---|
| Todos los campos completos | Continuar con las validaciones. |
| Una celda obligatoria vacía | Rechazar el archivo. |
| Varias celdas obligatorias vacías | Reportar todos los errores. |
| Correo inválido | Reportar fila y columna. |
| Año inválido | Reportar fila y columna. |
| Mes inválido | Reportar fila y columna. |
| Valor económico con texto | Reportar fila y columna. |
| Coljuegos con valor diferente de SÍ o NO | Rechazar. |
| Impuesto asumido con valor diferente de SÍ o NO | Rechazar. |
| Identificador con ceros iniciales | Conservar su contenido. |

### 12.3. Pruebas de almacenamiento

| Caso | Resultado esperado |
|---|---|
| Archivo completamente válido | Guardar en la carpeta correspondiente. |
| Archivo rechazado | No almacenar como carga válida. |
| Carpeta mensual inexistente | Crear automáticamente la carpeta. |
| Carpeta mensual existente | Reutilizarla. |
| Archivo con nombre repetido | Evitar sobrescritura accidental. |
| Error durante el almacenamiento | Informar y permitir recuperación segura. |
| Operación duplicada | Evitar doble almacenamiento. |

### 12.4. Criterios generales de aceptación

La aplicación debe cumplir las siguientes condiciones:

1. Permitir la carga de las plantillas oficiales.
2. Validar la estructura de los archivos.
3. Validar los 15 campos obligatorios.
4. Ejecutar validaciones por cada registro.
5. Identificar todos los errores encontrados.
6. Mostrar reportes comprensibles y detallados.
7. Rechazar archivos con inconsistencias.
8. Permitir volver a cargar archivos corregidos.
9. Almacenar automáticamente los archivos válidos.
10. Organizar las cargas por mes y año.
11. Mantener la estructura de Google Drive definida.
12. Evitar sobrescrituras y cargas duplicadas.
13. Proporcionar retroalimentación clara durante todo el proceso.
14. Garantizar que la validación se ejecute en el servidor.

---

## 13. PLAN DE IMPLEMENTACIÓN

Antes de escribir código, realizar las siguientes actividades:

### Fase 1. Análisis

1. Inspeccionar la plantilla oficial.
2. Identificar sus hojas, columnas y formatos.
3. Revisar las reglas de negocio disponibles.
4. Inspeccionar la estructura de carpetas de Google Drive.
5. Identificar restricciones de permisos y acceso.
6. Definir las reglas definitivas de validación.

### Fase 2. Diseño técnico

1. Definir la arquitectura de la aplicación.
2. Establecer el flujo de carga.
3. Diseñar el motor de validación.
4. Definir el mecanismo de almacenamiento.
5. Establecer el manejo de errores.
6. Diseñar la interfaz y sus estados.

### Fase 3. Desarrollo

1. Implementar la configuración centralizada.
2. Implementar la interfaz de carga.
3. Implementar la recepción de archivos.
4. Implementar las validaciones de estructura.
5. Implementar las validaciones por registro.
6. Implementar el reporte de inconsistencias.
7. Implementar la integración con Google Drive.
8. Implementar la trazabilidad.

### Fase 4. Pruebas

1. Probar archivos válidos.
2. Probar archivos con columnas faltantes.
3. Probar archivos con campos vacíos.
4. Probar tipos de datos incorrectos.
5. Probar archivos con múltiples errores.
6. Probar cargas repetidas.
7. Probar errores de almacenamiento.
8. Verificar la organización final en Google Drive.

---

## 14. CONSIDERACIONES FINALES

El objetivo de PREMIOS V2.0.0 es establecer un proceso confiable de recepción de información, eliminando la dependencia de cargas manuales sin controles de calidad.

La aplicación debe garantizar que los datos que ingresan al proceso cumplan con la estructura y las condiciones establecidas.

**La calidad de los datos debe garantizarse desde el momento de la recepción, no después de que los archivos hayan sido almacenados.**

No se debe priorizar únicamente la apariencia de la interfaz ni la rapidez de implementación. La solución debe combinar:

- Correctitud funcional.
- Integridad de los datos.
- Seguridad.
- Trazabilidad.
- Facilidad de uso.
- Organización del código.
- Mantenibilidad.
- Escalabilidad.

El resultado esperado es una herramienta institucional funcional, confiable y preparada para operar de manera recurrente con las diferentes oficinas.
