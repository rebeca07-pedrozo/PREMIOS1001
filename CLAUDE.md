
# CLAUDE.md — PREMIOS V2.0.0

## 1. CONTEXTO DEL PROYECTO

Estamos desarrollando PREMIOS V2.0.0, una aplicación web para la recepción, validación y almacenamiento de plantillas de información relacionadas con el proceso de premios de Davivienda.

El objetivo principal es garantizar la calidad, integridad y consistencia de los datos desde el momento en que las oficinas realizan sus cargas.

La aplicación debe permitir que los usuarios carguen sus archivos, validar automáticamente su estructura y contenido, identificar errores detalladamente y almacenar exclusivamente los archivos que cumplan con todas las reglas establecidas.

**No estamos desarrollando un simple formulario de carga de archivos. Estamos construyendo un mecanismo de control de calidad de datos.**

El requerimiento funcional completo se encuentra en:

`docs/REQUERIMIENTOS.md`

Este documento debe consultarse antes de implementar cualquier funcionalidad relacionada con el proceso.

---

## 2. STACK TECNOLÓGICO Y ENTORNO

La solución debe desarrollarse utilizando Google Apps Script como backend y su entorno de ejecución V8.

Se deben priorizar los servicios nativos de Google:

- Google Apps Script.
- Google Drive.
- Google Sheets, cuando sea necesario.
- HTML, CSS y JavaScript para la interfaz.

La implementación debe ser compatible con las restricciones y capacidades reales de Google Apps Script.

No introducir frameworks, dependencias o servicios externos sin una justificación técnica clara.

Antes de tomar decisiones sobre el stack, revisar el proyecto existente y determinar qué recursos ya están disponibles.

---

## 3. SKILLS DE DISEÑO: USO OBLIGATORIO

Para el desarrollo de la interfaz se deben utilizar las siguientes skills:

### 3.1. emil-design-eng

Utilizar la skill `anthropic-skills:emil-design-eng` como referencia para aplicar la filosofía de Emil sobre ingeniería de diseño.

Se debe prestar especial atención a:

- Pulido visual.
- Calidad de los detalles.
- Consistencia de los componentes.
- Jerarquía visual.
- Espaciado y alineación.
- Estados de interacción.
- Transiciones y microinteracciones.
- Sensación de calidad del producto.
- Coherencia entre diseño e implementación.

No basta con construir una interfaz funcional. Los detalles visuales y de interacción deben sentirse intencionales y profesionales.

### 3.2. /impeccable

Utilizar `anthropic-skills:impeccable` para diseñar, auditar, mejorar y endurecer la interfaz frontend.

Aplicar sus capacidades durante las etapas de:

- Diseño inicial de la interfaz.
- Definición del sistema visual.
- Organización del layout.
- Jerarquía tipográfica.
- Selección y aplicación de colores.
- Accesibilidad.
- Diseño responsive.
- Estados de carga, éxito y error.
- Auditoría y refinamiento visual.

No limitar el uso de esta skill a una revisión final. Debe formar parte del proceso de diseño y desarrollo.

**Instrucción:** antes de implementar la interfaz, consultar y aplicar las instrucciones disponibles de ambas skills. Si una skill no está disponible en el entorno, informar la limitación y no simular su utilización.

---

## 4. IDENTIDAD VISUAL DAVIVIENDA

La interfaz debe utilizar la identidad visual de Davivienda.

Se debe construir una experiencia institucional, moderna, limpia y profesional.

### 4.1. Paleta de colores oficial del proyecto

Los siguientes colores constituyen la paleta de referencia que debe utilizarse en toda la aplicación.

| Rol en la interfaz | Color | Código HEX | Uso recomendado |
|---|---|---|---|
| Primario (Marca) | Rojo Davivienda | `#E30518` | Botones principales (CTA), enlaces activos, íconos clave y encabezados de marca. |
| Primario Hover | Rojo oscuro | `#B80413` | Estado hover y active de botones rojos. |
| Acento cálido | Amarillo / Naranja | `#FFB800` | Alertas suaves, etiquetas destacadas y detalles gráficos secundarios. |
| Fondo principal | Blanco puro | `#FFFFFF` | Fondo general y tarjetas. |
| Fondo secundario | Gris muy claro | `#F5F5F7` | Secciones alternas, barras laterales y campos de formulario. |
| Texto principal | Carbón oscuro | `#2D2A26` | Títulos, encabezados y párrafos. |
| Texto secundario | Gris medio | `#6E6A66` | Subtítulos, ayudas, fechas y elementos secundarios. |

### 4.2. Reglas de aplicación del color

Aplicar la regla visual 60-30-10:

- 60%: fondos blancos y grises claros.
- 30%: textos, estructuras y elementos neutros.
- 10%: rojo institucional y acentos visuales.

El rojo Davivienda debe reservarse principalmente para acciones importantes y elementos que requieran atención.

**Reglas obligatorias:**

1. Los botones primarios deben utilizar fondo `#E30518` y texto blanco `#FFFFFF`.
2. Los botones primarios deben utilizar tipografía seminegrita o negrita.
3. El estado hover de los botones primarios debe utilizar `#B80413`.
4. No utilizar el rojo como fondo indiscriminado de toda la interfaz.
5. No abusar del amarillo/naranja.
6. Mantener suficiente contraste entre textos y fondos.
7. No introducir colores adicionales que compitan con la identidad institucional.
8. Los estados de éxito, advertencia y error deben distinguirse claramente sin alterar la identidad visual.

### 4.3. Sistema de diseño

Definir un sistema visual consistente para:

- Botones.
- Campos de formulario.
- Tarjetas.
- Tablas.
- Alertas.
- Indicadores de estado.
- Modales.
- Mensajes de validación.
- Componentes de carga.
- Elementos de navegación.

Evitar estilos duplicados y valores visuales dispersos.

Centralizar los colores, tipografías, espaciados, bordes y demás tokens de diseño cuando la arquitectura lo permita.

---

## 5. PRINCIPIOS DE UX/UI

La experiencia debe ser extremadamente sencilla para las oficinas.

El usuario no debería necesitar conocimientos técnicos para utilizar la aplicación.

El flujo principal debe ser:

1. Ingresar a la aplicación.
2. Seleccionar o arrastrar la plantilla.
3. Ejecutar la validación.
4. Consultar el resultado.
5. Corregir errores cuando existan.
6. Recibir confirmación cuando el archivo sea aceptado.

### Principios obligatorios

- Interfaz intuitiva.
- Diseño responsive.
- Navegación sencilla.
- Retroalimentación inmediata.
- Microinteracciones suaves.
- Estados de carga claramente identificables.
- Mensajes de error comprensibles.
- Jerarquía visual clara.
- Accesibilidad.
- Consistencia visual.

### Atención especial a los estados de la aplicación

Diseñar cuidadosamente los siguientes estados:

- Estado inicial: usuario aún no ha seleccionado un archivo.
- Archivo seleccionado: mostrar nombre, extensión y tamaño.
- Validando: mostrar progreso y evitar envíos duplicados.
- Validación exitosa: confirmar que el archivo cumple las reglas.
- Validación fallida: presentar los errores encontrados de manera organizada.
- Almacenando: informar que se está realizando el guardado en Drive.
- Carga completada: confirmar el almacenamiento y mostrar información relevante.
- Error de almacenamiento: informar que el archivo no pudo guardarse y permitir reintentar de forma segura.

No utilizar alertas nativas del navegador como mecanismo principal de comunicación.

Los mensajes deben estar integrados visualmente en la aplicación.

---

## 6. PRINCIPIOS DE ARQUITECTURA Y ORGANIZACIÓN

La arquitectura debe ser sencilla, mantenible y escalable.

**No quiero una cantidad innecesaria de archivos `.gs` y `.html`.**

No fragmentar el código artificialmente ni crear archivos sin una justificación funcional o técnica.

### Reglas de desarrollo

1. Mantener una estructura compacta.
2. Separar razonablemente la lógica de negocio, configuración e interfaz.
3. Centralizar las configuraciones del proyecto.
4. Evitar funciones duplicadas.
5. Reutilizar componentes y funciones.
6. Mantener nombres descriptivos.
7. Evitar dependencias innecesarias.
8. Implementar manejo centralizado de errores.
9. Evitar código muerto.
10. Mantener compatibilidad con Google Apps Script V8.

La modularidad debe responder a responsabilidades reales, no a la necesidad de crear más archivos.

**Antes de crear un nuevo archivo, evaluar si realmente aporta valor a la arquitectura.**

No modificar ni eliminar archivos existentes sin revisar primero sus dependencias y funcionalidades.

---

## 7. CONFIGURACIÓN CENTRALIZADA

Los identificadores de Google Drive, imágenes, carpetas y demás parámetros configurables deben administrarse de manera centralizada.

El ID del logo institucional debe recuperarse desde las Propiedades del script de Google Apps Script.

No escribir directamente identificadores de recursos en el HTML.

La configuración debe facilitar futuros cambios sin necesidad de modificar múltiples archivos.

---

## 8. CALIDAD Y SEGURIDAD DE LOS DATOS

La calidad de los datos es la prioridad funcional del proyecto.

Se deben cumplir las siguientes reglas:

- Validar en el servidor.
- No confiar exclusivamente en las validaciones del frontend.
- Rechazar registros incompletos.
- Validar los tipos de datos.
- Verificar la estructura de la plantilla.
- Conservar identificadores y códigos originales.
- Evitar conversiones que alteren la información.
- Evitar archivos duplicados.
- Prevenir operaciones de almacenamiento inconsistentes.
- No almacenar archivos rechazados como cargas válidas.

La validación debe ejecutarse antes de cualquier operación de almacenamiento definitivo.

---

## 9. MANEJO DE ERRORES Y TRAZABILIDAD

Toda operación importante debe tener un manejo de errores adecuado.

Los errores deben ser:

- Identificables.
- Comprensibles.
- Registrables.
- Trazables.

No ocultar excepciones ni presentar mensajes genéricos que dificulten el diagnóstico.

Considerar la trazabilidad de las cargas mediante información como:

- Usuario que realiza la carga.
- Fecha y hora.
- Nombre del archivo.
- Cantidad de registros.
- Resultado de la validación.
- Resultado del almacenamiento.

---

## 10. METODOLOGÍA DE TRABAJO

Antes de desarrollar cualquier funcionalidad:

1. Revisar la estructura actual del repositorio.
2. Leer este documento.
3. Consultar `docs/REQUERIMIENTOS.md`.
4. Inspeccionar los archivos y recursos existentes.
5. Identificar dependencias y restricciones técnicas.
6. Consultar las skills de diseño indicadas cuando se trabaje en frontend.
7. Definir la solución antes de modificar el código.

Durante el desarrollo:

- No asumir reglas de negocio.
- No inventar identificadores de Drive.
- No modificar la plantilla oficial sin autorización.
- No duplicar funcionalidades.
- No introducir dependencias innecesarias.
- No sacrificar calidad por rapidez.
- No realizar cambios ajenos al alcance solicitado.

Después de implementar:

1. Verificar el funcionamiento de las funcionalidades desarrolladas.
2. Probar escenarios válidos e inválidos.
3. Revisar el manejo de errores.
4. Auditar la interfaz con `/impeccable`.
5. Refinar los detalles visuales con `emil-design-eng`.
6. Verificar que la arquitectura siga siendo consistente.

---

## 11. CRITERIO GENERAL DE CALIDAD

El resultado debe sentirse como una herramienta institucional terminada, no como un prototipo académico o un formulario genérico.

Priorizar, en este orden:

1. Integridad y calidad de los datos.
2. Correctitud funcional.
3. Seguridad y confiabilidad.
4. Experiencia de usuario.
5. Calidad visual.
6. Mantenibilidad y escalabilidad.

**Principio rector: construir una solución funcional, robusta, visualmente impecable y técnicamente organizada, evitando complejidad innecesaria.**
