/**
 * PREMIOS V2.0.0 · Main.gs
 *
 * Publicación de la aplicación web, configuración centralizada, API pública
 * que consume la interfaz y manejo central de errores.
 *
 * Propiedades del script (Configuración del proyecto → Propiedades del script):
 *   CARPETA_RAIZ_ID  Carpeta «PREMIOS V2.0.0».
 *   PLANTILLA_ID     Archivo «1. Plantilla_Guia.xlsx».
 *   LOGO_ID          Logo institucional.
 *   AUDITORIA_ID     Hoja de auditoría. No hace falta crearla: la aplicación
 *                    la crea en la carpeta raíz la primera vez y guarda su ID.
 *
 * Solo las funciones sin guion bajo final (doGet, api*, verificarConfiguracion)
 * pueden invocarse desde la interfaz o desde el editor.
 */

const CONFIG = Object.freeze({
  VERSION: '2.0.0',
  ZONA_HORARIA: 'America/Bogota',
  MIME_XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  // Límites de la carga.
  MAX_BYTES: 5 * 1024 * 1024,
  MAX_FILAS: 20000,
  MAX_ERRORES_DETALLE: 5000,

  // Detección de la estructura de la plantilla.
  FILAS_BUSQUEDA_ENCABEZADO: 10,
  MIN_COINCIDENCIAS_ESTRUCTURA: 8,
  SIMILITUD_MINIMA_ENCABEZADO: 0.7,

  // Reglas de negocio aprobadas.
  DOMINIOS_CORREO: ['davivienda.com'],
  MESES: ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO',
    'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'],

  // Operación.
  TOKEN_TTL_SEG: 21600,
  ESPERA_BLOQUEO_MS: 30000,
  ESPERA_BLOQUEO_AUDITORIA_MS: 10000,

  PROPIEDADES: Object.freeze({
    CARPETA_RAIZ: 'CARPETA_RAIZ_ID',
    PLANTILLA: 'PLANTILLA_ID',
    LOGO: 'LOGO_ID',
    AUDITORIA: 'AUDITORIA_ID'
  }),

  AUDITORIA: Object.freeze({
    NOMBRE: 'PREMIOS_AUDITORIA',
    HOJA_CARGAS: 'CARGAS',
    HOJA_USUARIOS: 'USUARIOS'
  })
});

const TIPOS_LOGO_ = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];

/* ------------------------------------------------------------------------ */
/* Errores controlados                                                       */
/* ------------------------------------------------------------------------ */

/**
 * Error de negocio con un mensaje apto para el usuario.
 * Todo lo que no sea ErrorApp se trata como error interno.
 */
class ErrorApp extends Error {
  constructor(codigo, mensaje, opciones) {
    super(mensaje);
    this.name = 'ErrorApp';
    this.codigo = codigo;
    this.recomendacion = (opciones && opciones.recomendacion) || '';
    this.detalle = (opciones && opciones.detalle) || '';
  }
}

/**
 * Ejecuta una operación de la API y normaliza la respuesta:
 *   { ok: true, datos } | { ok: false, error: { codigo, mensaje, referencia? } }
 */
function ejecutar_(nombre, operacion) {
  try {
    return { ok: true, datos: operacion() };
  } catch (e) {
    if (e instanceof ErrorApp) {
      if (e.detalle) console.warn(JSON.stringify({ operacion: nombre, codigo: e.codigo, detalle: e.detalle }));
      return { ok: false, error: { codigo: e.codigo, mensaje: e.message } };
    }
    const referencia = Utilities.getUuid().slice(0, 8).toUpperCase();
    console.error(JSON.stringify({
      referencia: referencia,
      operacion: nombre,
      error: String(e && e.message ? e.message : e),
      pila: e && e.stack ? String(e.stack) : ''
    }));
    return {
      ok: false,
      error: {
        codigo: 'ERROR_INTERNO',
        referencia: referencia,
        mensaje: 'Ocurrió un problema inesperado en el servidor y la operación no se completó. ' +
          'Intente de nuevo en unos minutos. Si el problema continúa, informe al administrador ' +
          'la referencia ' + referencia + '.'
      }
    };
  }
}

/* ------------------------------------------------------------------------ */
/* Publicación                                                               */
/* ------------------------------------------------------------------------ */

function doGet() {
  const plantilla = HtmlService.createTemplateFromFile('Index');
  plantilla.inicial = datosIniciales_();
  return plantilla.evaluate()
    .setTitle('PREMIOS · Recepción de plantillas')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function datosIniciales_() {
  return {
    correo: usuarioActual_(),
    logo: logoDataUri_(),
    version: CONFIG.VERSION,
    maxBytes: CONFIG.MAX_BYTES,
    obligatorios: ESQUEMA.filter(function (c) { return c.obligatorio; })
      .map(function (c) { return c.encabezado; })
  };
}

/** Serializa datos para incrustarlos de forma segura dentro de <script>. */
function jsonSeguro_(valor) {
  return JSON.stringify(valor)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Devuelve el logo como data URI. El ID vive solo en las propiedades del
 * script y nunca llega al navegador.
 */
function logoDataUri_() {
  try {
    const id = propiedad_(CONFIG.PROPIEDADES.LOGO, false);
    if (!id) return '';
    const cache = CacheService.getScriptCache();
    const clave = 'logo:' + id;
    const enCache = cache.get(clave);
    if (enCache) return enCache;

    const blob = DriveApp.getFileById(id).getBlob();
    const tipo = String(blob.getContentType() || '').toLowerCase();
    if (TIPOS_LOGO_.indexOf(tipo) === -1) {
      console.warn('El logo configurado no es una imagen compatible: ' + tipo);
      return '';
    }
    const uri = 'data:' + tipo + ';base64,' + Utilities.base64Encode(blob.getBytes());
    if (uri.length < 95000) cache.put(clave, uri, 21600);
    return uri;
  } catch (e) {
    console.warn('No fue posible cargar el logo: ' + e);
    return '';
  }
}

/* ------------------------------------------------------------------------ */
/* API pública (google.script.run)                                           */
/* ------------------------------------------------------------------------ */

/** Registra el ingreso del usuario en la hoja de auditoría. */
function apiRegistrarAcceso() {
  return ejecutar_('apiRegistrarAcceso', function () {
    registrarAcceso_(usuarioActual_());
    return true;
  });
}

/**
 * Valida un archivo.
 * @param {{nombre:string, base64:string, oficina:string, confirmarDuplicado:boolean}} solicitud
 * @return estado DUPLICADO | RECHAZADO | VALIDO (con token para almacenar).
 */
function apiValidar(solicitud) {
  return ejecutar_('apiValidar', function () { return validarCarga_(solicitud); });
}

/**
 * Guarda en Drive un archivo previamente validado. El servidor lo valida de
 * nuevo antes de guardar; el token garantiza que un reintento no duplique.
 * @param {{nombre:string, base64:string, oficina:string, token:string}} solicitud
 */
function apiAlmacenar(solicitud) {
  return ejecutar_('apiAlmacenar', function () { return almacenarCarga_(solicitud); });
}

/** Genera el reporte de inconsistencias en Excel. */
function apiDescargarReporte(reporte) {
  return ejecutar_('apiDescargarReporte', function () {
    const blob = generarReporteXlsx_(reporte);
    return { nombre: blob.getName(), base64: Utilities.base64Encode(blob.getBytes()), mime: CONFIG.MIME_XLSX };
  });
}

/** Entrega la plantilla oficial sin que el usuario necesite acceso a Drive. */
function apiDescargarPlantilla() {
  return ejecutar_('apiDescargarPlantilla', function () { return contenidoPlantilla_(); });
}

/**
 * Diagnóstico para el administrador. Ejecútela desde el editor después de
 * configurar las propiedades: revisa accesos y crea la hoja de auditoría.
 */
function verificarConfiguracion() {
  const lineas = [];
  const revisar = function (etiqueta, prueba) {
    try {
      lineas.push('OK    ' + etiqueta + ': ' + prueba());
    } catch (e) {
      lineas.push('FALLA ' + etiqueta + ': ' + (e && e.message ? e.message : e));
    }
  };
  revisar('Carpeta raíz', function () {
    return DriveApp.getFolderById(propiedad_(CONFIG.PROPIEDADES.CARPETA_RAIZ, true)).getName();
  });
  revisar('Plantilla oficial', function () {
    const archivo = DriveApp.getFileById(propiedad_(CONFIG.PROPIEDADES.PLANTILLA, true));
    return archivo.getName() + ' (' + archivo.getMimeType() + ')';
  });
  revisar('Logo', function () {
    const archivo = DriveApp.getFileById(propiedad_(CONFIG.PROPIEDADES.LOGO, true));
    return archivo.getName() + ' (' + archivo.getMimeType() + ')';
  });
  revisar('Hoja de auditoría', function () {
    return conBloqueo_(CONFIG.ESPERA_BLOQUEO_MS, function () {
      const libro = abrirAuditoria_(true);
      return libro.getName() + ' · ' + libro.getUrl();
    });
  });
  revisar('Carpeta destino del periodo actual', function () {
    return 'PREMIOS V2.0.0 / ' + periodoDe_(new Date()).ruta + ' (se crea en la primera carga si no existe)';
  });
  revisar('Usuario que ejecuta', function () { return usuarioActual_() || '(no disponible)'; });
  const texto = lineas.join('\n');
  console.log(texto);
  return texto;
}

/* ------------------------------------------------------------------------ */
/* Orquestación del flujo                                                    */
/* ------------------------------------------------------------------------ */

function validarCarga_(solicitud) {
  const correo = usuarioActual_();
  const archivo = prepararArchivo_(solicitud);
  const confirmarDuplicado = !!(solicitud && solicitud.confirmarDuplicado === true);

  if (!confirmarDuplicado) {
    const previo = buscarDuplicado_(archivo.hash);
    if (previo) return { estado: 'DUPLICADO', duplicado: previo };
  }

  const reporte = validarLibro_(archivo.bytes, archivo.nombre);
  if (!reporte.aprobado) {
    registrarRechazo_({ correo: correo, archivo: archivo, reporte: reporte, duplicadoConfirmado: confirmarDuplicado });
    return { estado: 'RECHAZADO', reporte: reporte };
  }

  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('tok:' + token, JSON.stringify({
    hash: archivo.hash,
    confirmarDuplicado: confirmarDuplicado
  }), CONFIG.TOKEN_TTL_SEG);
  return { estado: 'VALIDO', reporte: reporte, token: token };
}

function almacenarCarga_(solicitud) {
  const token = String((solicitud && solicitud.token) || '');
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    throw new ErrorApp('VALIDACION_REQUERIDA',
      'Este archivo no tiene una validación vigente. Presione «Validar archivo» de nuevo; no se guardó nada.');
  }
  const correo = usuarioActual_();
  const archivo = prepararArchivo_(solicitud);

  // Idempotencia: un reintento de una carga ya guardada devuelve el resultado original.
  const previo = buscarCargaPorToken_(token);
  if (previo && previo.almacenamiento === ESTADO_ALMACENAMIENTO.ALMACENADO) {
    return { estado: 'ALMACENADO', almacenamiento: resultadoAlmacenamiento_(previo, true) };
  }

  const datosToken = leerToken_(token);
  if (!datosToken) {
    throw new ErrorApp('VALIDACION_VENCIDA',
      'La validación de este archivo venció antes de guardarlo. Valide el archivo de nuevo; no se guardó nada.');
  }
  if (datosToken.hash !== archivo.hash) {
    throw new ErrorApp('ARCHIVO_MODIFICADO',
      'El archivo enviado para guardar es distinto del que se validó. Valídelo de nuevo; no se guardó nada.');
  }
  if (!datosToken.confirmarDuplicado) {
    const duplicado = buscarDuplicado_(archivo.hash);
    if (duplicado) return { estado: 'DUPLICADO', duplicado: duplicado };
  }

  // La validación en el servidor es la única autoridad: se repite antes de guardar.
  const reporte = validarLibro_(archivo.bytes, archivo.nombre);
  if (!reporte.aprobado) {
    registrarRechazo_({ correo: correo, archivo: archivo, reporte: reporte, duplicadoConfirmado: !!datosToken.confirmarDuplicado });
    return { estado: 'RECHAZADO', reporte: reporte };
  }

  const almacenamiento = guardarCarga_({
    token: token,
    correo: correo,
    archivo: archivo,
    reporte: reporte,
    duplicadoConfirmado: !!datosToken.confirmarDuplicado
  });
  return { estado: 'ALMACENADO', almacenamiento: almacenamiento };
}

/**
 * Verifica y decodifica la solicitud del cliente. El cliente nunca decide si
 * el archivo es válido; aquí solo se comprueba que la solicitud sea utilizable.
 */
function prepararArchivo_(solicitud) {
  if (!solicitud || typeof solicitud !== 'object') {
    throw new ErrorApp('SOLICITUD_INVALIDA', 'La solicitud llegó incompleta. Recargue la página e intente de nuevo.');
  }
  const oficina = limpiarTexto_(solicitud.oficina, 120);
  if (!oficina) {
    throw new ErrorApp('OFICINA_REQUERIDA', 'Escriba el nombre de su oficina antes de validar el archivo.');
  }
  const nombre = limpiarNombreArchivo_(solicitud.nombre);
  if (!/\.xlsx$/i.test(nombre)) {
    throw new ErrorApp('EXTENSION_NO_PERMITIDA',
      '«' + (nombre || 'El archivo') + '» no es un libro de Excel .xlsx. Solo se aceptan archivos .xlsx; ' +
      'si su archivo es .xls o .csv, ábralo en Excel y use «Guardar como» → «Libro de Excel (.xlsx)».');
  }
  const base64 = solicitud.base64;
  if (typeof base64 !== 'string' || !base64) {
    throw new ErrorApp('ARCHIVO_VACIO', 'El archivo llegó vacío. Selecciónelo de nuevo.');
  }
  if (base64.length > Math.ceil(CONFIG.MAX_BYTES / 3) * 4 + 4) {
    throw new ErrorApp('ARCHIVO_MUY_GRANDE', 'El archivo supera el máximo permitido de ' + tamanoLegible_(CONFIG.MAX_BYTES) + '.');
  }
  let bytes;
  try {
    bytes = Utilities.base64Decode(base64);
  } catch (e) {
    throw new ErrorApp('ARCHIVO_ILEGIBLE', 'El archivo no llegó completo al servidor. Selecciónelo y valídelo de nuevo.', { detalle: String(e) });
  }
  if (!bytes.length) throw new ErrorApp('ARCHIVO_VACIO', 'El archivo está vacío (0 bytes). Selecciónelo de nuevo.');
  if (bytes.length > CONFIG.MAX_BYTES) {
    throw new ErrorApp('ARCHIVO_MUY_GRANDE', 'El archivo supera el máximo permitido de ' + tamanoLegible_(CONFIG.MAX_BYTES) + '.');
  }
  return { nombre: nombre, oficina: oficina, bytes: bytes, tamano: bytes.length, hash: hashHex_(bytes) };
}

function leerToken_(token) {
  const valor = CacheService.getScriptCache().get('tok:' + token);
  if (!valor) return null;
  try { return JSON.parse(valor); } catch (e) { return null; }
}

/* ------------------------------------------------------------------------ */
/* Utilidades compartidas                                                    */
/* ------------------------------------------------------------------------ */

function propiedad_(clave, requerida) {
  const valor = PropertiesService.getScriptProperties().getProperty(clave);
  if (!valor && requerida) {
    throw new ErrorApp('CONFIGURACION_INCOMPLETA',
      'La aplicación no está configurada por completo (falta la propiedad ' + clave + '). Informe al administrador.');
  }
  return valor || '';
}

function usuarioActual_() {
  try { return String(Session.getActiveUser().getEmail() || '').toLowerCase(); } catch (e) { return ''; }
}

function limpiarTexto_(valor, maximo) {
  return String(valor == null ? '' : valor)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximo || 500);
}

function limpiarNombreArchivo_(valor) {
  const nombre = limpiarTexto_(String(valor == null ? '' : valor).split(/[\\/]/).pop(), 255);
  if (nombre.length <= 200) return nombre;
  const extension = (nombre.match(/\.[^.]{1,10}$/) || [''])[0];
  return nombre.slice(0, 200 - extension.length) + extension;
}

function hashHex_(bytes) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes)
    .map(function (b) { return ((b + 256) % 256).toString(16).padStart(2, '0'); })
    .join('');
}

function tamanoLegible_(bytes) {
  return bytes >= 1048576 ? (Math.round(bytes / 104857.6) / 10) + ' MB' : Math.round(bytes / 1024) + ' KB';
}

function formatearFecha_(fecha, patron) {
  return Utilities.formatDate(fecha, CONFIG.ZONA_HORARIA, patron || 'yyyy-MM-dd HH:mm:ss');
}
