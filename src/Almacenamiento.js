/**
 * PREMIOS V2.0.0 · Almacenamiento.gs
 *
 * Google Drive (carpetas por año y mes, guardado del archivo original),
 * hoja de auditoría (cargas y usuarios), detección de duplicados,
 * idempotencia y bloqueo para operaciones concurrentes.
 *
 * Estructura de destino:  PREMIOS V2.0.0 / {AÑO} / {MES} /
 * El periodo lo define la columna MES del archivo cargado, no la fecha en que
 * se sube; el año se deduce de ese mes (ver periodoDelMes_).
 */

const ESTADO_ALMACENAMIENTO = Object.freeze({
  EN_PROCESO: 'EN_PROCESO',
  ALMACENADO: 'ALMACENADO',
  FALLIDO: 'FALLIDO',
  NO_APLICA: 'NO_APLICA'
});

/**
 * Columnas de la hoja CARGAS. PERIODO es el mes al que corresponde la
 * información (columna MES del archivo); la fecha en que se subió queda
 * registrada en FECHA Y HORA.
 */
const COL_CARGAS_ = Object.freeze({
  ENCABEZADOS: ['FOLIO', 'FECHA Y HORA', 'CORREO', 'OFICINA', 'ARCHIVO', 'HASH SHA-256', 'PERIODO',
    'REGISTROS REVISADOS', 'FILAS CON ERROR', 'TOTAL ERRORES', 'RESULTADO', 'ALMACENAMIENTO',
    'CARPETA', 'ID ARCHIVO', 'ENLACE', 'TOKEN', 'OBSERVACIONES'],
  FOLIO: 1, FECHA: 2, CORREO: 3, OFICINA: 4, ARCHIVO: 5, HASH: 6, PERIODO: 7, REGISTROS: 8,
  FILAS_ERROR: 9, ERRORES: 10, RESULTADO: 11, ALMACENAMIENTO: 12, CARPETA: 13, ID_ARCHIVO: 14,
  ENLACE: 15, TOKEN: 16, OBSERVACIONES: 17
});

const COL_USUARIOS_ = Object.freeze({
  ENCABEZADOS: ['CORREO', 'PRIMER ACCESO', 'ÚLTIMO ACCESO', 'ACCESOS', 'CARGAS APROBADAS', 'CARGAS RECHAZADAS'],
  CORREO: 1, PRIMER: 2, ULTIMO: 3, ACCESOS: 4, APROBADAS: 5, RECHAZADAS: 6
});

/* ------------------------------------------------------------------------ */
/* Guardado de una carga válida                                              */
/* ------------------------------------------------------------------------ */

/**
 * Guarda el archivo original en la carpeta del periodo y deja la traza.
 * Se ejecuta bajo bloqueo: dos cargas simultáneas no crean carpetas
 * duplicadas y un reintento con el mismo token no crea dos archivos.
 */
function guardarCarga_(datos) {
  // Sin periodo no hay carpeta destino posible: antes que guardar en un lugar
  // equivocado, no se guarda nada.
  if (!datos.reporte || !datos.reporte.periodo) {
    throw new ErrorApp('PERIODO_NO_DETERMINADO',
      'No fue posible establecer el mes al que corresponde la información del archivo, así que no se guardó nada. ' +
      'Valide el archivo de nuevo.');
  }
  return conBloqueo_(CONFIG.ESPERA_BLOQUEO_MS, function () {
    const hoja = hojaAuditoria_(CONFIG.AUDITORIA.HOJA_CARGAS, true);
    const archivo = datos.archivo;
    let fila = buscarFila_(hoja, COL_CARGAS_.TOKEN, datos.token);

    if (fila) {
      const previo = registroCarga_(hoja, fila);
      if (previo.almacenamiento === ESTADO_ALMACENAMIENTO.ALMACENADO) return resultadoAlmacenamiento_(previo, true);
      // Un intento anterior pudo crear el archivo y fallar antes de confirmarlo.
      const recuperado = previo.archivoId ? archivoIntacto_(previo.archivoId, archivo.tamano) : null;
      if (recuperado) {
        escribirCampos_(hoja, fila, {
          ALMACENAMIENTO: ESTADO_ALMACENAMIENTO.ALMACENADO,
          ENLACE: recuperado.getUrl(),
          OBSERVACIONES: 'Confirmado en un reintento.'
        });
        actualizarUsuario_(datos.correo, { aprobada: true });
        SpreadsheetApp.flush();
        return resultadoAlmacenamiento_(registroCarga_(hoja, fila), true);
      }
    } else {
      fila = agregarFilaCarga_(hoja, {
        token: datos.token,
        correo: datos.correo,
        archivo: archivo,
        reporte: datos.reporte,
        resultado: 'APROBADO',
        almacenamiento: ESTADO_ALMACENAMIENTO.EN_PROCESO,
        observaciones: datos.duplicadoConfirmado ? 'Contenido duplicado: el usuario confirmó continuar.' : ''
      });
    }
    SpreadsheetApp.flush();

    let creado = null;
    try {
      const periodo = datos.reporte.periodo;
      const carpeta = conReintentos_(function () { return carpetaDelPeriodo_(periodo); });
      escribirCampos_(hoja, fila, { PERIODO: periodo.clave, CARPETA: periodo.ruta });

      creado = carpeta.createFile(Utilities.newBlob(archivo.bytes, CONFIG.MIME_XLSX, archivo.nombre));
      escribirCampos_(hoja, fila, { ID_ARCHIVO: creado.getId() });
      SpreadsheetApp.flush();

      if (creado.getSize() !== archivo.tamano) {
        creado.setTrashed(true);
        throw new ErrorApp('VERIFICACION_FALLIDA',
          'Google Drive no confirmó el archivo completo, así que se descartó. Presione «Reintentar guardado».');
      }

      escribirCampos_(hoja, fila, {
        ALMACENAMIENTO: ESTADO_ALMACENAMIENTO.ALMACENADO,
        ENLACE: creado.getUrl()
      });
      actualizarUsuario_(datos.correo, { aprobada: true });
      SpreadsheetApp.flush();
      return resultadoAlmacenamiento_(registroCarga_(hoja, fila), false);
    } catch (e) {
      escribirCampos_(hoja, fila, {
        ALMACENAMIENTO: ESTADO_ALMACENAMIENTO.FALLIDO,
        OBSERVACIONES: recortar_('Fallo al guardar: ' + (e && e.message ? e.message : e), 480)
      });
      SpreadsheetApp.flush();
      if (e instanceof ErrorApp) throw e;
      throw new ErrorApp('ERROR_ALMACENAMIENTO',
        'Google Drive no respondió al guardar el archivo. No quedó ningún archivo guardado a medias. ' +
        'Presione «Reintentar guardado»; si el problema continúa, informe al administrador.', { detalle: String(e) });
    }
  });
}

/** Comprueba si un archivo creado en un intento anterior quedó completo. */
function archivoIntacto_(id, tamano) {
  try {
    const archivo = DriveApp.getFileById(id);
    return !archivo.isTrashed() && archivo.getSize() === tamano ? archivo : null;
  } catch (e) {
    return null;
  }
}

function resultadoAlmacenamiento_(registro, repetido) {
  return {
    folio: registro.folio,
    archivo: registro.archivo,
    carpeta: 'PREMIOS V2.0.0 / ' + registro.carpeta,
    fecha: registro.fecha,
    registros: registro.registros,
    repetido: !!repetido
  };
}

/* ------------------------------------------------------------------------ */
/* Carpetas                                                                  */
/* ------------------------------------------------------------------------ */

function periodo_(anio, mes) {
  const nombreMes = CONFIG.MESES[mes - 1];
  return {
    anio: String(anio),
    mes: nombreMes,
    numero: mes,
    clave: anio + '-' + (mes < 10 ? '0' : '') + mes,
    ruta: anio + ' / ' + nombreMes
  };
}

/**
 * Deduce el año del mes que trae el archivo tomando el periodo vencido más
 * reciente: un mes igual o anterior al actual pertenece al año en curso y un
 * mes posterior al actual pertenece al año anterior. Así, un archivo con
 * MES = 11 cargado en diciembre se guarda en noviembre del mismo año, y uno
 * con MES = 12 cargado en enero se guarda en diciembre del año anterior.
 */
function periodoDelMes_(mes, referencia) {
  const hoy = referencia || new Date();
  const anioActual = Number(formatearFecha_(hoy, 'yyyy'));
  const mesActual = Number(formatearFecha_(hoy, 'M'));
  return periodo_(mes <= mesActual ? anioActual : anioActual - 1, mes);
}

function carpetaDelPeriodo_(periodo) {
  const raiz = DriveApp.getFolderById(propiedad_(CONFIG.PROPIEDADES.CARPETA_RAIZ, true));
  const carpetaAnio = obtenerOCrearCarpeta_(raiz, periodo.anio);
  return obtenerOCrearCarpeta_(carpetaAnio, periodo.mes);
}

/** Reutiliza la carpeta si existe; si hay varias con el mismo nombre, usa la más antigua. */
function obtenerOCrearCarpeta_(padre, nombre) {
  const iterador = padre.getFoldersByName(nombre);
  const encontradas = [];
  while (iterador.hasNext()) {
    const carpeta = iterador.next();
    if (!carpeta.isTrashed()) encontradas.push(carpeta);
  }
  if (!encontradas.length) return padre.createFolder(nombre);
  if (encontradas.length > 1) {
    console.warn('Hay ' + encontradas.length + ' carpetas «' + nombre + '» en «' + padre.getName() + '»; se usa la más antigua.');
    encontradas.sort(function (a, b) { return a.getDateCreated() - b.getDateCreated(); });
  }
  return encontradas[0];
}

/* ------------------------------------------------------------------------ */
/* Plantilla oficial                                                         */
/* ------------------------------------------------------------------------ */

function contenidoPlantilla_() {
  let archivo;
  try {
    archivo = DriveApp.getFileById(propiedad_(CONFIG.PROPIEDADES.PLANTILLA, true));
  } catch (e) {
    if (e instanceof ErrorApp) throw e;
    throw new ErrorApp('PLANTILLA_NO_DISPONIBLE',
      'No fue posible obtener la plantilla oficial en este momento. Intente de nuevo; si el problema continúa, ' +
      'informe al administrador.', { detalle: String(e) });
  }
  if (archivo.getMimeType() === MimeType.GOOGLE_SHEETS) {
    throw new ErrorApp('PLANTILLA_NO_XLSX',
      'La plantilla configurada es una hoja de Google y no un archivo .xlsx. Informe al administrador.');
  }
  return {
    nombre: archivo.getName(),
    base64: Utilities.base64Encode(archivo.getBlob().getBytes()),
    mime: CONFIG.MIME_XLSX
  };
}

/* ------------------------------------------------------------------------ */
/* Auditoría                                                                 */
/* ------------------------------------------------------------------------ */

/** Busca una carga ya almacenada con el mismo contenido (hash SHA-256). */
function buscarDuplicado_(hash) {
  const hoja = hojaAuditoria_(CONFIG.AUDITORIA.HOJA_CARGAS, false);
  if (!hoja) return null;
  const filas = buscarFilas_(hoja, COL_CARGAS_.HASH, hash);
  for (let i = filas.length - 1; i >= 0; i--) {
    const registro = registroCarga_(hoja, filas[i]);
    if (registro.almacenamiento === ESTADO_ALMACENAMIENTO.ALMACENADO) {
      return {
        archivo: registro.archivo,
        fecha: registro.fecha,
        correo: registro.correo,
        oficina: registro.oficina,
        carpeta: 'PREMIOS V2.0.0 / ' + registro.carpeta,
        folio: registro.folio
      };
    }
  }
  return null;
}

function buscarCargaPorToken_(token) {
  const hoja = hojaAuditoria_(CONFIG.AUDITORIA.HOJA_CARGAS, false);
  if (!hoja) return null;
  const fila = buscarFila_(hoja, COL_CARGAS_.TOKEN, token);
  return fila ? registroCarga_(hoja, fila) : null;
}

/** Registra el ingreso a la aplicación. Si la auditoría falla, la aplicación sigue. */
function registrarAcceso_(correo) {
  if (!correo) return;
  try {
    conBloqueo_(CONFIG.ESPERA_BLOQUEO_AUDITORIA_MS, function () {
      actualizarUsuario_(correo, { acceso: true });
      SpreadsheetApp.flush();
    });
  } catch (e) {
    console.warn('No fue posible registrar el acceso de ' + correo + ': ' + (e && e.message ? e.message : e));
  }
}

/** Registra un archivo rechazado (no se guarda el archivo, solo la traza). */
function registrarRechazo_(datos) {
  try {
    conBloqueo_(CONFIG.ESPERA_BLOQUEO_AUDITORIA_MS, function () {
      const hoja = hojaAuditoria_(CONFIG.AUDITORIA.HOJA_CARGAS, true);
      agregarFilaCarga_(hoja, {
        token: '',
        correo: datos.correo,
        archivo: datos.archivo,
        reporte: datos.reporte,
        resultado: 'RECHAZADO',
        almacenamiento: ESTADO_ALMACENAMIENTO.NO_APLICA,
        observaciones: datos.duplicadoConfirmado ? 'Contenido duplicado: el usuario confirmó continuar.' : ''
      });
      actualizarUsuario_(datos.correo, { rechazada: true });
      SpreadsheetApp.flush();
    });
  } catch (e) {
    console.warn('No fue posible registrar el rechazo: ' + (e && e.message ? e.message : e));
  }
}

function agregarFilaCarga_(hoja, d) {
  const ahora = new Date();
  const periodo = d.reporte && d.reporte.periodo ? d.reporte.periodo : null;
  const valores = [];
  valores[COL_CARGAS_.FOLIO - 1] = 'PRM-' + formatearFecha_(ahora, 'yyyyMMdd-HHmmss') + '-' +
    Utilities.getUuid().slice(0, 4).toUpperCase();
  valores[COL_CARGAS_.FECHA - 1] = ahora;
  valores[COL_CARGAS_.CORREO - 1] = celdaSegura_(d.correo || '(no disponible)');
  valores[COL_CARGAS_.OFICINA - 1] = celdaSegura_(d.archivo.oficina);
  valores[COL_CARGAS_.ARCHIVO - 1] = celdaSegura_(d.archivo.nombre);
  valores[COL_CARGAS_.HASH - 1] = d.archivo.hash;
  valores[COL_CARGAS_.PERIODO - 1] = periodo ? periodo.clave : '';
  valores[COL_CARGAS_.REGISTROS - 1] = d.reporte.registrosRevisados;
  valores[COL_CARGAS_.FILAS_ERROR - 1] = d.reporte.filasConError;
  valores[COL_CARGAS_.ERRORES - 1] = d.reporte.totalErrores;
  valores[COL_CARGAS_.RESULTADO - 1] = d.resultado;
  valores[COL_CARGAS_.ALMACENAMIENTO - 1] = d.almacenamiento;
  valores[COL_CARGAS_.CARPETA - 1] = periodo && d.almacenamiento !== ESTADO_ALMACENAMIENTO.NO_APLICA ? periodo.ruta : '';
  valores[COL_CARGAS_.ID_ARCHIVO - 1] = '';
  valores[COL_CARGAS_.ENLACE - 1] = '';
  valores[COL_CARGAS_.TOKEN - 1] = d.token || '';
  valores[COL_CARGAS_.OBSERVACIONES - 1] = celdaSegura_(d.observaciones || '');
  const fila = hoja.getLastRow() + 1;
  hoja.getRange(fila, 1, 1, valores.length).setValues([valores]);
  return fila;
}

function escribirCampos_(hoja, fila, campos) {
  Object.keys(campos).forEach(function (nombre) {
    hoja.getRange(fila, COL_CARGAS_[nombre]).setValue(celdaSegura_(campos[nombre]));
  });
}

function registroCarga_(hoja, fila) {
  const v = hoja.getRange(fila, 1, 1, COL_CARGAS_.ENCABEZADOS.length).getValues()[0];
  const campo = function (nombre) { return v[COL_CARGAS_[nombre] - 1]; };
  const fecha = campo('FECHA');
  return {
    fila: fila,
    folio: String(campo('FOLIO')),
    fecha: fecha instanceof Date ? formatearFecha_(fecha, 'yyyy-MM-dd HH:mm') : String(fecha),
    correo: String(campo('CORREO')),
    oficina: String(campo('OFICINA')).replace(/^'/, ''),
    archivo: String(campo('ARCHIVO')).replace(/^'/, ''),
    carpeta: String(campo('CARPETA')),
    registros: Number(campo('REGISTROS')) || 0,
    almacenamiento: String(campo('ALMACENAMIENTO')),
    archivoId: String(campo('ID_ARCHIVO'))
  };
}

/**
 * Actualiza los contadores del usuario. Debe llamarse con el bloqueo tomado.
 */
function actualizarUsuario_(correo, cambios) {
  if (!correo) return;
  const hoja = hojaAuditoria_(CONFIG.AUDITORIA.HOJA_USUARIOS, true);
  const ahora = new Date();
  const fila = buscarFila_(hoja, COL_USUARIOS_.CORREO, correo);
  if (!fila) {
    hoja.getRange(hoja.getLastRow() + 1, 1, 1, COL_USUARIOS_.ENCABEZADOS.length).setValues([[
      celdaSegura_(correo), ahora, ahora,
      cambios.acceso ? 1 : 0, cambios.aprobada ? 1 : 0, cambios.rechazada ? 1 : 0
    ]]);
    return;
  }
  const rango = hoja.getRange(fila, 1, 1, COL_USUARIOS_.ENCABEZADOS.length);
  const v = rango.getValues()[0];
  const sumar = function (col) { v[col - 1] = (Number(v[col - 1]) || 0) + 1; };
  if (cambios.acceso) {
    v[COL_USUARIOS_.ULTIMO - 1] = ahora;
    sumar(COL_USUARIOS_.ACCESOS);
  }
  if (cambios.aprobada) sumar(COL_USUARIOS_.APROBADAS);
  if (cambios.rechazada) sumar(COL_USUARIOS_.RECHAZADAS);
  rango.setValues([v]);
}

let auditoriaMemo_ = null;

/**
 * Abre la hoja de auditoría. Si no existe y crear es true, la crea en la
 * carpeta raíz (requiere tener el bloqueo). Con crear en false devuelve null.
 */
function abrirAuditoria_(crear) {
  if (auditoriaMemo_) return auditoriaMemo_;
  const propiedades = PropertiesService.getScriptProperties();
  const id = propiedades.getProperty(CONFIG.PROPIEDADES.AUDITORIA);
  if (id) {
    try {
      auditoriaMemo_ = SpreadsheetApp.openById(id);
      return auditoriaMemo_;
    } catch (e) {
      throw new ErrorApp('AUDITORIA_NO_DISPONIBLE',
        'No fue posible abrir la hoja de auditoría. Informe al administrador.', { detalle: String(e) });
    }
  }
  if (!crear) return null;
  auditoriaMemo_ = crearAuditoria_();
  propiedades.setProperty(CONFIG.PROPIEDADES.AUDITORIA, auditoriaMemo_.getId());
  return auditoriaMemo_;
}

function hojaAuditoria_(nombre, crear) {
  const libro = abrirAuditoria_(crear);
  if (!libro) return null;
  const hoja = libro.getSheetByName(nombre);
  if (hoja) return hoja;
  if (!crear) return null;
  return prepararHojaAuditoria_(libro.insertSheet(nombre), nombre);
}

function crearAuditoria_() {
  const raiz = DriveApp.getFolderById(propiedad_(CONFIG.PROPIEDADES.CARPETA_RAIZ, true));
  const libro = SpreadsheetApp.create(CONFIG.AUDITORIA.NOMBRE);
  DriveApp.getFileById(libro.getId()).moveTo(raiz);
  prepararHojaAuditoria_(libro.getSheets()[0].setName(CONFIG.AUDITORIA.HOJA_CARGAS), CONFIG.AUDITORIA.HOJA_CARGAS);
  prepararHojaAuditoria_(libro.insertSheet(CONFIG.AUDITORIA.HOJA_USUARIOS), CONFIG.AUDITORIA.HOJA_USUARIOS);
  return libro;
}

function prepararHojaAuditoria_(hoja, nombre) {
  const esCargas = nombre === CONFIG.AUDITORIA.HOJA_CARGAS;
  const encabezados = esCargas ? COL_CARGAS_.ENCABEZADOS : COL_USUARIOS_.ENCABEZADOS;
  const filas = hoja.getMaxRows();
  hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados])
    .setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#2D2A26');
  hoja.setFrozenRows(1);
  if (esCargas) {
    [COL_CARGAS_.FOLIO, COL_CARGAS_.CORREO, COL_CARGAS_.OFICINA, COL_CARGAS_.ARCHIVO, COL_CARGAS_.HASH,
      COL_CARGAS_.PERIODO, COL_CARGAS_.ID_ARCHIVO, COL_CARGAS_.TOKEN].forEach(function (col) {
      hoja.getRange(2, col, filas - 1, 1).setNumberFormat('@');
    });
    hoja.getRange(2, COL_CARGAS_.FECHA, filas - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  } else {
    hoja.getRange(2, COL_USUARIOS_.CORREO, filas - 1, 1).setNumberFormat('@');
    hoja.getRange(2, COL_USUARIOS_.PRIMER, filas - 1, 2).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  }
  hoja.autoResizeColumns(1, encabezados.length);
  return hoja;
}

function buscarFila_(hoja, columna, valor) {
  const filas = buscarFilas_(hoja, columna, valor);
  return filas.length ? filas[filas.length - 1] : 0;
}

function buscarFilas_(hoja, columna, valor) {
  if (!valor) return [];
  const ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  return hoja.getRange(2, columna, ultima - 1, 1)
    .createTextFinder(String(valor))
    .matchEntireCell(true)
    .matchCase(false)
    .findAll()
    .map(function (rango) { return rango.getRow(); })
    .sort(function (a, b) { return a - b; });
}

/** Evita que un texto del usuario se interprete como fórmula en la hoja. */
function celdaSegura_(valor) {
  if (typeof valor !== 'string') return valor;
  return /^[=+\-@]/.test(valor) ? "'" + valor : valor;
}

/* ------------------------------------------------------------------------ */
/* Concurrencia y reintentos                                                 */
/* ------------------------------------------------------------------------ */

function conBloqueo_(esperaMs, operacion) {
  const bloqueo = LockService.getScriptLock();
  if (!bloqueo.tryLock(esperaMs)) {
    throw new ErrorApp('SISTEMA_OCUPADO',
      'Hay otras cargas guardándose en este momento. Espere unos segundos e intente de nuevo; no se guardó nada.');
  }
  try {
    return operacion();
  } finally {
    bloqueo.releaseLock();
  }
}

/** Reintenta operaciones idempotentes ante fallas transitorias de Google. */
function conReintentos_(operacion, intentos) {
  const maximo = intentos || 3;
  for (let i = 0; ; i++) {
    try {
      return operacion();
    } catch (e) {
      if (e instanceof ErrorApp || i >= maximo - 1) throw e;
      Utilities.sleep(500 * Math.pow(2, i) + Math.floor(Math.random() * 250));
    }
  }
}
