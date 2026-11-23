/**
 * PREMIOS V2.0.0 · Validacion.gs
 *
 * Esquema oficial de la plantilla, lectura del archivo .xlsx, reglas de
 * validación por registro y reporte de inconsistencias (en pantalla y Excel).
 *
 * El .xlsx se lee directamente desde su contenido (Utilities.unzip): no se
 * convierte a Google Sheets ni se crea ningún archivo temporal en Drive.
 */

/* ------------------------------------------------------------------------ */
/* Esquema oficial (1. Plantilla_Guia.xlsx · hoja «Hoja1» · fila 1 · A:V)    */
/* ------------------------------------------------------------------------ */
/*
 * encabezado: texto exacto de la plantilla oficial.
 * alias:      nombres aprobados que también se aceptan (los del documento de
 *             requerimientos y la corrección COMPAÑIA / CAMPAÑIA).
 * etiqueta:   nombre corto que se muestra en el reporte.
 * letra:      columna en la plantilla oficial (solo para orientar al usuario).
 * regla:      validación que se aplica a cada registro (solo si es obligatoria).
 *
 * Para agregar una regla: implemente la función en REGLAS_ y asígnela aquí.
 */
const ESQUEMA = Object.freeze([
  { clave: 'mes', letra: 'A', obligatorio: true, regla: 'mes',
    encabezado: 'MES' },
  { clave: 'correo', letra: 'B', obligatorio: true, regla: 'correo',
    encabezado: 'CORREO DE QUIEN INGRESA LA INFORMACION' },
  { clave: 'compania', letra: 'C', obligatorio: true, regla: 'texto',
    encabezado: 'NOMBRE DE LA CAMPAÑIA', alias: ['NOMBRE DE LA COMPAÑIA'] },
  { clave: 'area', letra: 'D', obligatorio: true, regla: 'texto',
    encabezado: 'AREA DUEÑA DE LA CAMPAÑA' },
  { clave: 'mesEntrega', letra: 'E', obligatorio: true, regla: 'mes',
    encabezado: 'MES DE ENTREGA EL PREMIO', alias: ['MES DE ENTREGA DEL PREMIO'] },
  { clave: 'anioEntrega', letra: 'F', obligatorio: true, regla: 'anio',
    encabezado: 'AÑO DE ENTREGA DEL PREMIO' },
  { clave: 'cuentaContable', letra: 'G', obligatorio: true, regla: 'codigo',
    encabezado: 'CUENTA CONTABLE DEL GASTO U OTRA' },
  { clave: 'centroCostos', letra: 'H', obligatorio: true, regla: 'codigo',
    encabezado: 'CENTRO DE COSTOS' },
  { clave: 'subproyecto', letra: 'I', obligatorio: true, regla: 'codigo',
    encabezado: 'SUBPROYECTO' },
  { clave: 'coljuegos', letra: 'J', obligatorio: true, regla: 'siNo',
    encabezado: 'REGISTRADO EN COLJUEGOS (SI O NO)', etiqueta: 'REGISTRADO EN COLJUEGOS' },
  { clave: 'tipoId', letra: 'K', obligatorio: true, regla: 'texto',
    encabezado: 'TIPO ID BENEFICIARIO DEL PREMIO' },
  { clave: 'numeroId', letra: 'L', obligatorio: true, regla: 'digitos',
    encabezado: 'NUMERO ID BENEFICIARIO DEL PREMIO' },
  { clave: 'beneficiario', letra: 'M', obligatorio: true, regla: 'texto',
    encabezado: 'NOMBRES Y APELLIDOS O RAZON SOCIAL BENEFICIARIO DEL PREMIO' },
  { clave: 'direccion', letra: 'N', obligatorio: false,
    encabezado: 'DIRECCION  DEL BENEFICIARIO DEL PREMIO' },
  { clave: 'ciudad', letra: 'O', obligatorio: false,
    encabezado: 'CIUDAD DE LA DIRECCIÓN DEL BENEFICIARIO DEL PREMIO' },
  { clave: 'correoBeneficiario', letra: 'P', obligatorio: false,
    encabezado: 'CORREO ELECTRONICO DEL BENEFICIARIO DEL PREMIO' },
  { clave: 'telefono', letra: 'Q', obligatorio: false,
    encabezado: 'TELEFONO DEL BENEFICIARIO DEL PREMIO' },
  { clave: 'valor', letra: 'R', obligatorio: true, regla: 'valor',
    encabezado: 'VALOR TOTAL DEL PREMIO BASE (2.514.000) 48 UVT // OTROS INGR TRIB (524.000) 10 UVT',
    alias: ['VALOR TOTAL DEL PREMIO BASE'], etiqueta: 'VALOR TOTAL DEL PREMIO BASE' },
  { clave: 'impuesto', letra: 'S', obligatorio: true, regla: 'siNo',
    encabezado: 'IMPTO ASUMIDO SI / NO', alias: ['IMPUESTO ASUMIDO (SÍ / NO)'], etiqueta: 'IMPTO ASUMIDO' },
  { clave: 'otorgante', letra: 'T', obligatorio: false,
    encabezado: 'PREMIO OTORGADO POR EL BANCO O POR UN 3RO.' },
  { clave: 'nitTercero', letra: 'U', obligatorio: false,
    encabezado: 'NIT DEL TERCERO cuando no sea a cargo del Banco' },
  { clave: 'nombreTercero', letra: 'V', obligatorio: false,
    encabezado: 'NOMBRE DEL TERCERO (cuando no sea a cargo del Banco)' }
].map(function (c) {
  return Object.freeze(Object.assign({ etiqueta: c.encabezado.replace(/\s+/g, ' '), alias: [] }, c));
}));

const TIPOS_ERROR = Object.freeze({
  // Archivo y estructura
  NO_ES_LIBRO_EXCEL: 'No es un libro de Excel',
  FORMATO_ANTIGUO_O_PROTEGIDO: 'Formato .xls o archivo protegido',
  ARCHIVO_DANADO: 'Archivo dañado o incompleto',
  ARCHIVO_NO_PROCESABLE: 'Archivo con demasiados registros',
  ESTRUCTURA_NO_RECONOCIDA: 'Estructura no reconocida',
  HOJAS_AMBIGUAS: 'Más de una hoja con la plantilla',
  ENCABEZADO_FALTANTE: 'Encabezado faltante',
  ENCABEZADO_DIFERENTE: 'Encabezado diferente',
  ENCABEZADO_DUPLICADO: 'Encabezado duplicado',
  SIN_REGISTROS: 'Archivo sin registros',
  MESES_MEZCLADOS: 'Varios meses en un mismo archivo',
  DEMASIADAS_FILAS: 'Demasiados registros',
  // Registros
  CAMPO_VACIO: 'Campo obligatorio vacío',
  MES_INVALIDO: 'Mes inválido',
  ANIO_INVALIDO: 'Año inválido',
  CORREO_INVALIDO: 'Correo inválido',
  CORREO_DOMINIO: 'Correo no institucional',
  SI_NO_INVALIDO: 'Se esperaba SÍ o NO',
  SOLO_DIGITOS: 'Identificación con caracteres no permitidos',
  NUMERO_REDONDEADO: 'Número alterado por Excel',
  VALOR_NO_NUMERICO: 'Valor no numérico',
  VALOR_NO_POSITIVO: 'Valor menor o igual a cero',
  ERROR_FORMULA: 'Error de fórmula',
  // Advertencias (no bloquean)
  COLUMNA_ADICIONAL: 'Columna adicional'
});

const CELDA_VACIA_ = Object.freeze({ tipo: 'vacio', texto: '' });

/* ------------------------------------------------------------------------ */
/* Punto de entrada                                                          */
/* ------------------------------------------------------------------------ */

/**
 * Valida un libro .xlsx completo y devuelve el reporte. Nunca se detiene en
 * el primer error: recorre todas las filas y acumula todas las inconsistencias.
 */
function validarLibro_(bytes, nombreArchivo) {
  const reporte = nuevoReporte_(nombreArchivo);

  let libro;
  let candidatos;
  try {
    libro = abrirLibro_(bytes);
    // La lectura de las hojas va dentro del try porque también puede fallar
    // por tamaño: así el usuario recibe una recomendación y no un error interno.
    candidatos = detectarEncabezados_(libro);
  } catch (e) {
    const fallo = e instanceof ErrorApp ? e : errorArchivoNoProcesable_(bytes.length, e);
    agregarErrorEstructura_(reporte, { tipo: fallo.codigo, descripcion: fallo.message, recomendacion: fallo.recomendacion });
    return cerrarReporte_(reporte);
  }

  const mejor = candidatos[0];
  const totalObligatorios = ESQUEMA.filter(function (c) { return c.obligatorio; }).length;

  if (!mejor || mejor.coincidencias < CONFIG.MIN_COINCIDENCIAS_ESTRUCTURA) {
    const hojas = libro.hojas.map(function (h) { return '«' + h.nombre + '»'; }).join(', ');
    agregarErrorEstructura_(reporte, {
      tipo: 'ESTRUCTURA_NO_RECONOCIDA',
      descripcion: 'No se encontraron los encabezados de la plantilla oficial en las primeras ' +
        CONFIG.FILAS_BUSQUEDA_ENCABEZADO + ' filas de ' + (hojas || 'ninguna hoja') + '.' +
        (mejor ? ' La mayor coincidencia fue la fila ' + mejor.numero + ' de la hoja «' + mejor.hoja.nombre +
          '», con ' + mejor.coincidencias + ' de ' + ESQUEMA.length + ' encabezados.' : ''),
      recomendacion: 'Descargue la plantilla oficial desde esta página y copie sus datos debajo de los ' +
        'encabezados, sin cambiarlos.'
    });
    return cerrarReporte_(reporte);
  }

  const completos = candidatos.filter(function (c) { return c.obligatorias === totalObligatorios; });
  if (completos.length > 1) {
    agregarErrorEstructura_(reporte, {
      tipo: 'HOJAS_AMBIGUAS',
      descripcion: 'Las hojas ' + completos.map(function (c) { return '«' + c.hoja.nombre + '»'; }).join(' y ') +
        ' tienen la estructura de la plantilla, y no es posible saber cuál contiene la información a cargar.',
      recomendacion: 'Deje en el archivo una sola hoja con la plantilla diligenciada y elimine las demás.'
    });
    return cerrarReporte_(reporte);
  }

  const elegido = completos[0] || mejor;
  reporte.hoja = elegido.hoja.nombre;
  reporte.filaEncabezado = elegido.numero;

  const columnas = analizarEncabezados_(elegido, reporte);
  validarRegistros_(libro, elegido, columnas, reporte);
  return cerrarReporte_(reporte);
}

/* ------------------------------------------------------------------------ */
/* Estructura                                                                */
/* ------------------------------------------------------------------------ */

/** Busca, en cada hoja, la fila que más se parece al encabezado oficial. */
function detectarEncabezados_(libro) {
  const indice = indiceEsquema_();
  const candidatos = [];
  libro.hojas.forEach(function (hoja) {
    hoja.xml = libro.leer(hoja.ruta);
    if (!hoja.xml) return;
    let mejor = null;
    recorrerFilas_(libro, hoja.xml, 1, CONFIG.FILAS_BUSQUEDA_ENCABEZADO, function (numero, celdas) {
      const claves = {};
      Object.keys(celdas).forEach(function (i) {
        const col = indice[normalizarEncabezado_(celdas[i].texto)];
        if (col) claves[col.clave] = true;
      });
      const coincidencias = Object.keys(claves).length;
      const obligatorias = ESQUEMA.filter(function (c) { return c.obligatorio && claves[c.clave]; }).length;
      if (!mejor || coincidencias > mejor.coincidencias) {
        mejor = { hoja: hoja, numero: numero, celdas: celdas, coincidencias: coincidencias, obligatorias: obligatorias };
      }
    });
    if (mejor) candidatos.push(mejor);
  });
  return candidatos.sort(function (a, b) { return b.coincidencias - a.coincidencias; });
}

/**
 * Compara la fila de encabezados con el esquema: detecta faltantes,
 * duplicados, diferentes y adicionales. Devuelve las columnas reconocidas.
 */
function analizarEncabezados_(elegido, reporte) {
  const indice = indiceEsquema_();
  const fila = elegido.numero;
  const porClave = {};
  const columnas = [];
  const desconocidos = [];

  Object.keys(elegido.celdas).map(Number).sort(function (a, b) { return a - b; }).forEach(function (i) {
    const texto = String(elegido.celdas[i].texto || '').trim();
    if (!texto) return;
    const letra = letraColumna_(i);
    const norm = normalizarEncabezado_(texto);
    const col = indice[norm];
    if (!col) {
      desconocidos.push({ indice: i, letra: letra, texto: texto, norm: norm });
      return;
    }
    if (porClave[col.clave]) {
      agregarErrorEstructura_(reporte, {
        tipo: 'ENCABEZADO_DUPLICADO', fila: fila, letra: letra, columna: col.etiqueta, valor: texto,
        descripcion: 'El encabezado «' + col.encabezado + '» aparece más de una vez: columnas ' +
          porClave[col.clave].letra + ' y ' + letra + '.',
        recomendacion: 'Deje una sola columna «' + col.encabezado + '» y elimine o corrija la columna ' + letra + '.'
      });
      return;
    }
    porClave[col.clave] = { col: col, indice: i, letra: letra };
    columnas.push(porClave[col.clave]);
  });

  const usados = {};
  ESQUEMA.forEach(function (col) {
    if (porClave[col.clave]) return;
    const esperado = normalizarEncabezado_(col.encabezado);
    let parecido = null;
    desconocidos.forEach(function (d) {
      if (usados[d.indice]) return;
      const s = similitud_(d.norm, esperado);
      if (s >= CONFIG.SIMILITUD_MINIMA_ENCABEZADO && (!parecido || s > parecido.s)) parecido = { d: d, s: s };
    });
    if (parecido) {
      usados[parecido.d.indice] = true;
      agregarErrorEstructura_(reporte, {
        tipo: 'ENCABEZADO_DIFERENTE', fila: fila, letra: parecido.d.letra, columna: col.etiqueta, valor: parecido.d.texto,
        descripcion: 'Se esperaba el encabezado «' + col.encabezado + '» y la columna ' + parecido.d.letra +
          ' dice «' + parecido.d.texto + '».',
        recomendacion: 'Escriba en la celda ' + parecido.d.letra + fila + ' el encabezado tal como aparece en la ' +
          'plantilla oficial: «' + col.encabezado + '».'
      });
    } else {
      agregarErrorEstructura_(reporte, {
        tipo: 'ENCABEZADO_FALTANTE', fila: fila, letra: '', columna: col.etiqueta, valor: '',
        descripcion: 'Falta la columna «' + col.encabezado + '»' + (col.obligatorio ? ', que es obligatoria' : '') +
          '. En la plantilla oficial es la columna ' + col.letra + '.',
        recomendacion: 'Agregue la columna con ese encabezado o copie sus datos en la plantilla oficial.'
      });
    }
  });

  desconocidos.forEach(function (d) {
    if (usados[d.indice]) return;
    agregarAdvertencia_(reporte, {
      tipo: 'COLUMNA_ADICIONAL', fila: fila, letra: d.letra, columna: '', valor: d.texto,
      descripcion: 'La columna ' + d.letra + ' («' + d.texto + '») no pertenece a la plantilla oficial; su contenido no se valida.',
      recomendacion: 'Si la agregó por error, elimínela. Si la necesita, puede conservarla: no impide la carga.'
    });
  });

  return columnas;
}

/* ------------------------------------------------------------------------ */
/* Registros                                                                 */
/* ------------------------------------------------------------------------ */

function validarRegistros_(libro, elegido, columnas, reporte) {
  const anioActual = Number(formatearFecha_(new Date(), 'yyyy'));
  const contexto = { anios: [anioActual, anioActual - 1] };
  const filasConError = {};
  const columnaMes = columnas.filter(function (c) { return c.col.clave === 'mes'; })[0] || null;
  const meses = {};
  let registros = 0;
  let excedido = false;

  recorrerFilas_(libro, elegido.hoja.xml, elegido.numero + 1, 0, function (numero, celdas) {
    const tieneInformacion = columnas.some(function (c) { return !esVacia_(celdas[c.indice]); });
    if (!tieneInformacion) return true;
    registros++;
    if (registros > CONFIG.MAX_FILAS) {
      excedido = true;
      return false;
    }
    columnas.forEach(function (c) {
      if (!c.col.obligatorio) return;
      const celda = celdas[c.indice] || CELDA_VACIA_;
      const hallazgo = evaluarCelda_(c.col, celda, contexto);
      if (!hallazgo) return;
      filasConError[numero] = true;
      agregarErrorRegistro_(reporte, Object.assign({
        fila: numero,
        letra: c.letra,
        columna: c.col.etiqueta,
        valor: recortar_(celda.texto, 200)
      }, hallazgo));
    });
    if (columnaMes) acumularMes_(meses, celdas[columnaMes.indice], numero);
    return true;
  });

  reporte.registrosRevisados = Math.min(registros, CONFIG.MAX_FILAS);
  reporte.filasConError = Object.keys(filasConError).length;

  if (excedido) {
    agregarErrorEstructura_(reporte, {
      tipo: 'DEMASIADAS_FILAS',
      descripcion: 'El archivo tiene más de ' + numeroTexto_(CONFIG.MAX_FILAS) +
        ' registros, el máximo que se puede validar en una sola carga.',
      recomendacion: 'Divida la información en varios archivos —uno por mes y, si hace falta, uno por oficina— y ' +
        'cárguelos por separado.'
    });
  } else if (registros === 0) {
    agregarErrorEstructura_(reporte, {
      tipo: 'SIN_REGISTROS', fila: reporte.filaEncabezado,
      descripcion: 'La hoja «' + reporte.hoja + '» tiene los encabezados, pero no hay registros debajo de la fila ' +
        reporte.filaEncabezado + '.',
      recomendacion: 'Diligencie al menos un registro debajo de los encabezados y vuelva a cargar el archivo.'
    });
  }

  determinarPeriodo_(reporte, meses, columnaMes);
}

/** Cuenta los meses válidos encontrados en la columna MES. */
function acumularMes_(meses, celda, fila) {
  const mes = mesDeCelda_(celda);
  if (!mes) return;
  const registro = meses[mes] || (meses[mes] = { mes: mes, total: 0, primeraFila: fila });
  registro.total++;
}

/** Número de mes (1 a 12) que contiene la celda; 0 si no es un mes válido. */
function mesDeCelda_(celda) {
  if (!celda || esVacia_(celda) || celda.esFecha) return 0;
  const texto = String(celda.texto).trim();
  const n = celda.tipo === 'numero' ? celda.numero : (/^\d{1,2}$/.test(texto) ? Number(texto) : NaN);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : 0;
}

/**
 * El periodo de la carga lo define la columna MES del archivo y no la fecha en
 * que se sube: en los primeros días de un mes es normal cargar la información
 * del mes anterior. Un archivo con varios meses se rechaza, porque entonces
 * ninguna carpeta representa su contenido.
 */
function determinarPeriodo_(reporte, meses, columnaMes) {
  const detectados = Object.keys(meses).map(function (k) { return meses[k]; })
    .sort(function (a, b) { return a.mes - b.mes; });
  if (!detectados.length) return;
  if (detectados.length === 1) {
    reporte.periodo = periodoDelMes_(detectados[0].mes);
    return;
  }
  agregarErrorEstructura_(reporte, {
    tipo: 'MESES_MEZCLADOS',
    letra: columnaMes ? columnaMes.letra : '',
    columna: 'MES',
    descripcion: 'La columna MES tiene ' + detectados.length + ' meses distintos en el mismo archivo: ' +
      unirLista_(detectados.map(function (d) {
        return CONFIG.MESES[d.mes - 1] + ' (' + d.mes + ') en ' + numeroTexto_(d.total) +
          (d.total === 1 ? ' registro, fila ' : ' registros, desde la fila ') + d.primeraFila;
      })) + '.',
    recomendacion: 'Cada carga se guarda en la carpeta del mes que indica la columna MES, así que un mismo archivo ' +
      'no puede mezclar meses. Separe la información en un archivo por mes y cárguelos uno por uno.'
  });
}

function evaluarCelda_(col, celda, contexto) {
  if (esVacia_(celda)) {
    return hallazgo_('CAMPO_VACIO', 'El campo es obligatorio y está vacío.',
      'Diligencie «' + col.etiqueta + '» en esta fila.');
  }
  if (celda.tipo === 'error') {
    return hallazgo_('ERROR_FORMULA', 'La celda muestra el error ' + celda.texto + '.',
      'Corrija la fórmula o escriba el valor directamente en la celda.');
  }
  const regla = REGLAS_[col.regla];
  return regla ? regla(celda, contexto) : null;
}

const REGLAS_ = Object.freeze({
  texto: function () { return null; },

  // Cuenta contable, centro de costos y subproyecto: se leen tal como están
  // guardados, sin convertirlos ni recortar ceros.
  codigo: function () { return null; },

  mes: function (celda) {
    if (mesDeCelda_(celda)) return null;
    const texto = celda.texto.trim();
    if (celda.esFecha) {
      return hallazgo_('MES_INVALIDO', 'La celda tiene formato de fecha; este campo debe contener solo el número del mes.',
        'Cambie el formato de la celda a «General» o «Número» y escriba el mes de 1 a 12 (por ejemplo, 9 para septiembre).');
    }
    const posicion = CONFIG.MESES.indexOf(normalizarEncabezado_(texto) === 'SETIEMBRE' ? 'SEPTIEMBRE' : normalizarEncabezado_(texto));
    if (posicion !== -1) {
      return hallazgo_('MES_INVALIDO', 'Se escribió el nombre del mes («' + texto + '»), pero este campo debe ser numérico.',
        'Escriba ' + (posicion + 1) + ' en lugar de «' + texto + '».');
    }
    return hallazgo_('MES_INVALIDO', '«' + texto + '» no es un mes válido. Se esperaba un número entero de 1 a 12.',
      'Escriba el número del mes, de 1 (enero) a 12 (diciembre).');
  },

  anio: function (celda, contexto) {
    const texto = celda.texto.trim();
    if (celda.esFecha) {
      return hallazgo_('ANIO_INVALIDO', 'La celda tiene formato de fecha; este campo debe contener solo el año.',
        'Cambie el formato de la celda a «General» o «Número» y escriba el año con cuatro dígitos (por ejemplo, ' +
        contexto.anios[0] + ').');
    }
    const n = celda.tipo === 'numero' ? celda.numero : (/^\d{4}$/.test(texto) ? Number(texto) : NaN);
    if (!Number.isInteger(n) || n < 1000 || n > 9999) {
      return hallazgo_('ANIO_INVALIDO', '«' + texto + '» no es un año válido. Se esperaba un año numérico de cuatro dígitos.',
        'Escriba el año de entrega del premio, por ejemplo ' + contexto.anios[0] + '.');
    }
    if (contexto.anios.indexOf(n) === -1) {
      return hallazgo_('ANIO_INVALIDO', 'El año ' + n + ' está fuera del periodo vigente. Se aceptan ' +
        contexto.anios[0] + ' y ' + contexto.anios[1] + '.',
        'Verifique el año de entrega del premio: debe ser ' + contexto.anios[0] + ' o ' + contexto.anios[1] + '.');
    }
    return null;
  },

  correo: function (celda) {
    const texto = celda.texto.trim();
    const estructura = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
    if (!estructura.test(texto)) {
      return hallazgo_('CORREO_INVALIDO', '«' + texto + '» no tiene la estructura de un correo electrónico.',
        'Escriba un correo completo y sin espacios, por ejemplo nombre.apellido@' + CONFIG.DOMINIOS_CORREO[0] + '.');
    }
    const dominio = texto.split('@')[1].toLowerCase();
    if (CONFIG.DOMINIOS_CORREO.indexOf(dominio) === -1) {
      return hallazgo_('CORREO_DOMINIO', 'El correo pertenece al dominio «' + dominio + '»; solo se aceptan correos @' +
        CONFIG.DOMINIOS_CORREO.join(', @') + '.',
        'Escriba el correo institucional de la persona que ingresa la información.');
    }
    return null;
  },

  siNo: function (celda) {
    const normalizado = normalizarEncabezado_(celda.texto);
    if (normalizado === 'SI' || normalizado === 'NO') return null;
    return hallazgo_('SI_NO_INVALIDO', '«' + celda.texto.trim() + '» no es un valor permitido. Se esperaba SÍ o NO.',
      'Escriba SÍ o NO. Se aceptan mayúsculas, minúsculas y la palabra con o sin tilde.');
  },

  digitos: function (celda) {
    if (celda.tipo === 'numero') {
      if (celda.esFecha) {
        return hallazgo_('SOLO_DIGITOS', 'La celda tiene formato de fecha; se esperaba un número de identificación.',
          'Cambie el formato de la celda a «Texto» y escriba la identificación solo con dígitos.');
      }
      if (!Number.isInteger(celda.numero) || celda.numero < 0) {
        return hallazgo_('SOLO_DIGITOS', '«' + celda.texto + '» no es una identificación válida: debe tener solo dígitos, ' +
          'sin decimales ni signos.', 'Escriba el número de identificación solo con dígitos.');
      }
      if (celda.numero >= 1e15) {
        return hallazgo_('NUMERO_REDONDEADO', 'La identificación tiene más de 15 dígitos y Excel solo conserva 15 en las ' +
          'celdas numéricas, así que el valor pudo quedar alterado.',
          'Dé formato «Texto» a la columna y vuelva a escribir la identificación completa.');
      }
      return null;
    }
    const texto = celda.texto.trim();
    if (/^\d+$/.test(texto)) return null;
    const encontrados = [];
    if (/\./.test(texto)) encontrados.push('puntos');
    if (/,/.test(texto)) encontrados.push('comas');
    if (/\s/.test(texto)) encontrados.push('espacios');
    if (/-/.test(texto)) encontrados.push('guiones');
    if (/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(texto)) encontrados.push('letras');
    if (/[^\d.,\s\-A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(texto)) encontrados.push('otros símbolos');
    return hallazgo_('SOLO_DIGITOS', '«' + texto + '» contiene caracteres distintos de dígitos' +
      (encontrados.length ? ' (' + unirLista_(encontrados) + ')' : '') + '.',
      'Escriba solo números, sin puntos, comas, espacios, guiones ni letras.');
  },

  valor: function (celda) {
    if (celda.esFecha) {
      return hallazgo_('VALOR_NO_NUMERICO', 'La celda tiene formato de fecha; se esperaba un valor numérico.',
        'Cambie el formato de la celda a «Número» o «Moneda» y escriba el valor del premio.');
    }
    let n;
    if (celda.tipo === 'numero') {
      n = celda.numero;
    } else {
      const texto = celda.texto.trim();
      if (!/^\d+$/.test(texto)) {
        const conSimbolos = /\d/.test(texto) && /[$.,]/.test(texto);
        return hallazgo_('VALOR_NO_NUMERICO', '«' + texto + '» está escrito como texto' +
          (conSimbolos ? ' con símbolos o separadores' : '') + '; se esperaba un valor numérico.',
          'Escriba solo el número, sin $ ni puntos de miles (por ejemplo, 2514000). Si tiene decimales, ' +
          'use una celda con formato de número.');
      }
      n = Number(texto);
    }
    if (!(n > 0)) {
      return hallazgo_('VALOR_NO_POSITIVO', 'El valor ' + celda.texto.trim() + ' no es válido: el valor del premio debe ser mayor que cero.',
        'Escriba el valor total del premio base, mayor que cero.');
    }
    return null;
  }
});

/* ------------------------------------------------------------------------ */
/* Reporte                                                                   */
/* ------------------------------------------------------------------------ */

function nuevoReporte_(archivo) {
  return {
    archivo: archivo,
    hoja: '',
    filaEncabezado: null,
    periodo: null,
    aprobado: false,
    registrosRevisados: 0,
    filasConError: 0,
    totalErrores: 0,
    erroresEstructura: [],
    errores: [],
    advertencias: [],
    truncado: false,
    maxDetalle: CONFIG.MAX_ERRORES_DETALLE,
    resumenColumnas: [],
    resumenTipos: [],
    fechaValidacion: '',
    _porColumna: {},
    _porTipo: {}
  };
}

function hallazgo_(tipo, descripcion, recomendacion) {
  return { tipo: tipo, tipoTexto: TIPOS_ERROR[tipo] || tipo, descripcion: descripcion, recomendacion: recomendacion };
}

function agregarErrorEstructura_(reporte, error) {
  reporte.totalErrores++;
  reporte.erroresEstructura.push(Object.assign({
    ambito: 'estructura', fila: null, letra: '', columna: '', valor: '', tipoTexto: TIPOS_ERROR[error.tipo] || error.tipo
  }, error));
}

function agregarAdvertencia_(reporte, advertencia) {
  reporte.advertencias.push(Object.assign({
    ambito: 'advertencia', tipoTexto: TIPOS_ERROR[advertencia.tipo] || advertencia.tipo
  }, advertencia));
}

function agregarErrorRegistro_(reporte, error) {
  reporte.totalErrores++;
  const claveColumna = error.letra + '|' + error.columna;
  const porColumna = reporte._porColumna[claveColumna] ||
    (reporte._porColumna[claveColumna] = { letra: error.letra, columna: error.columna, total: 0 });
  porColumna.total++;
  const porTipo = reporte._porTipo[error.tipo] ||
    (reporte._porTipo[error.tipo] = { tipo: error.tipo, tipoTexto: error.tipoTexto, total: 0 });
  porTipo.total++;
  if (reporte.errores.length < CONFIG.MAX_ERRORES_DETALLE) {
    reporte.errores.push(Object.assign({ ambito: 'registro' }, error));
  } else {
    reporte.truncado = true;
  }
}

function cerrarReporte_(reporte) {
  const valores = function (objeto) { return Object.keys(objeto).map(function (k) { return objeto[k]; }); };
  reporte.resumenColumnas = valores(reporte._porColumna).sort(function (a, b) {
    return indiceColumna_(a.letra) - indiceColumna_(b.letra);
  });
  reporte.resumenTipos = valores(reporte._porTipo).sort(function (a, b) { return b.total - a.total; });
  delete reporte._porColumna;
  delete reporte._porTipo;
  reporte.aprobado = reporte.totalErrores === 0;
  reporte.fechaValidacion = formatearFecha_(new Date());
  return reporte;
}

/**
 * Construye el reporte de inconsistencias como libro .xlsx (dos hojas:
 * Resumen e Inconsistencias). No toca el archivo original ni crea nada en Drive.
 */
function generarReporteXlsx_(entrada) {
  const r = entrada && typeof entrada === 'object' ? entrada : {};
  const texto = function (v) { return recortar_(String(v == null ? '' : v), 1000); };
  const entero = function (v) { const n = Number(v); return Number.isFinite(n) ? Math.round(n) : ''; };
  const lista = function (v) { return Array.isArray(v) ? v.slice(0, CONFIG.MAX_ERRORES_DETALLE + 500) : []; };

  const resumen = [
    ['Archivo', texto(r.archivo)],
    ['Resultado', r.aprobado ? 'Aprobado' : 'Rechazado'],
    ['Fecha de validación', texto(r.fechaValidacion)],
    ['Hoja revisada', texto(r.hoja)],
    ['Fila de encabezados', entero(r.filaEncabezado)],
    ['Mes de la información', r.periodo ? texto(r.periodo.mes + ' ' + r.periodo.anio) : '(no determinado)'],
    ['Registros revisados', entero(r.registrosRevisados)],
    ['Filas con inconsistencias', entero(r.filasConError)],
    ['Errores detectados', entero(r.totalErrores)],
    ['Advertencias', lista(r.advertencias).length]
  ];
  if (r.truncado) {
    resumen.push(['Nota', 'El detalle incluye los primeros ' + entero(r.maxDetalle) + ' errores de registro de un total de ' +
      entero(r.totalErrores) + '. Corríjalos y vuelva a validar para ver los siguientes.']);
  }

  const detalle = [['Fila', 'Columna', 'Letra', 'Valor encontrado', 'Tipo de error', 'Descripción', 'Recomendación']];
  lista(r.erroresEstructura).concat(lista(r.errores), lista(r.advertencias)).forEach(function (e) {
    if (!e || typeof e !== 'object') return;
    detalle.push([
      entero(e.fila),
      texto(e.columna),
      texto(e.letra),
      e.tipo === 'CAMPO_VACIO' ? '(vacío)' : texto(e.valor),
      (e.ambito === 'advertencia' ? 'Advertencia: ' : '') + texto(e.tipoTexto),
      texto(e.descripcion),
      texto(e.recomendacion)
    ]);
  });

  const base = String(r.archivo || 'archivo').replace(/\.xlsx$/i, '').replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ.-]+/g, '_').slice(0, 80);
  const nombre = 'Reporte_inconsistencias_' + base + '_' + formatearFecha_(new Date(), 'yyyyMMdd-HHmm') + '.xlsx';

  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const NS_PR = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const ultimaFila = detalle.length;

  const partes = {
    '[Content_Types].xml': DECL +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '</Types>',
    '_rels/.rels': DECL +
      '<Relationships xmlns="' + NS_PR + '">' +
      '<Relationship Id="rId1" Type="' + NS_R + '/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>',
    'xl/workbook.xml': DECL +
      '<workbook xmlns="' + NS + '" xmlns:r="' + NS_R + '"><sheets>' +
      '<sheet name="Resumen" sheetId="1" r:id="rId1"/>' +
      '<sheet name="Inconsistencias" sheetId="2" r:id="rId2"/>' +
      '</sheets><definedNames>' +
      '<definedName name="_xlnm._FilterDatabase" localSheetId="1" hidden="1">Inconsistencias!$A$1:$G$' + ultimaFila + '</definedName>' +
      '</definedNames></workbook>',
    'xl/_rels/workbook.xml.rels': DECL +
      '<Relationships xmlns="' + NS_PR + '">' +
      '<Relationship Id="rId1" Type="' + NS_R + '/worksheet" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Type="' + NS_R + '/worksheet" Target="worksheets/sheet2.xml"/>' +
      '<Relationship Id="rId3" Type="' + NS_R + '/styles" Target="styles.xml"/>' +
      '</Relationships>',
    'xl/styles.xml': DECL +
      '<styleSheet xmlns="' + NS + '">' +
      '<fonts count="3">' +
      '<font><sz val="11"/><color rgb="FF2D2A26"/><name val="Calibri"/><family val="2"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>' +
      '<font><b/><sz val="11"/><color rgb="FF2D2A26"/><name val="Calibri"/><family val="2"/></font>' +
      '</fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FF2D2A26"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="4">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top"/></xf>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top"/></xf>' +
      '</cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>',
    'xl/worksheets/sheet1.xml': hojaReporteXml_(resumen, [28, 90], function (fila, col) {
      return col === 0 ? 3 : 2;
    }, false),
    'xl/worksheets/sheet2.xml': hojaReporteXml_(detalle, [8, 34, 7, 30, 30, 60, 60], function (fila, col) {
      if (fila === 0) return 1;
      return col >= 3 ? 2 : 0;
    }, true)
  };

  const blobs = Object.keys(partes).map(function (ruta) {
    return Utilities.newBlob(partes[ruta], 'application/xml', ruta);
  });
  const zip = Utilities.zip(blobs, nombre);
  zip.setContentType(CONFIG.MIME_XLSX);
  return zip;
}

function hojaReporteXml_(filas, anchos, estilo, conEncabezado) {
  const columnas = anchos.map(function (ancho, i) {
    return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + ancho + '" customWidth="1"/>';
  }).join('');
  const datos = filas.map(function (fila, i) {
    const celdas = fila.map(function (valor, j) {
      const ref = letraColumna_(j) + (i + 1);
      const s = estilo(i, j);
      if (typeof valor === 'number' && Number.isFinite(valor)) {
        return '<c r="' + ref + '" s="' + s + '"><v>' + valor + '</v></c>';
      }
      if (valor === '' || valor == null) return '<c r="' + ref + '" s="' + s + '"/>';
      return '<c r="' + ref + '" s="' + s + '" t="inlineStr"><is><t xml:space="preserve">' +
        escaparXml_(valor) + '</t></is></c>';
    }).join('');
    return '<row r="' + (i + 1) + '">' + celdas + '</row>';
  }).join('');
  const vista = conEncabezado
    ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>';
  const filtro = conEncabezado && filas.length > 1
    ? '<autoFilter ref="A1:' + letraColumna_(filas[0].length - 1) + filas.length + '"/>'
    : '';
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    vista + '<cols>' + columnas + '</cols><sheetData>' + datos + '</sheetData>' + filtro + '</worksheet>';
}

/* ------------------------------------------------------------------------ */
/* Lectura del .xlsx                                                         */
/* ------------------------------------------------------------------------ */

/**
 * Un fallo al descomprimir o leer el libro tiene dos causas posibles: el
 * archivo está dañado, o tiene tantos registros que Apps Script no puede
 * sostener la hoja descomprimida en memoria (cerca de 1 KB por registro).
 * Se distinguen por el peso del archivo para no dar una recomendación falsa.
 */
function errorArchivoNoProcesable_(bytes, causa) {
  console.error(JSON.stringify({
    operacion: 'abrirLibro',
    bytes: bytes,
    error: String(causa && causa.message ? causa.message : causa)
  }));
  if (bytes > CONFIG.BYTES_RIESGO_MEMORIA) {
    return new ErrorApp('ARCHIVO_NO_PROCESABLE',
      'El archivo (' + tamanoLegible_(bytes) + ') no se pudo abrir. Si está completo, tiene más registros de los que ' +
      'se pueden validar en una sola carga: la hoja descomprimida no cabe en la memoria disponible.', {
        recomendacion: 'Divida la información en varios archivos —uno por mes y, si hace falta, uno por oficina— de ' +
          'máximo ' + numeroTexto_(CONFIG.MAX_FILAS) + ' registros cada uno, y cárguelos por separado.',
        detalle: String(causa)
      });
  }
  return new ErrorApp('ARCHIVO_DANADO', 'El archivo está dañado o incompleto y no se pudo abrir.', {
    recomendacion: 'Ábralo en Excel, guárdelo de nuevo como «Libro de Excel (.xlsx)» y vuelva a cargarlo.',
    detalle: String(causa)
  });
}

/**
 * Abre el paquete .xlsx y prepara lo necesario para leer sus hojas.
 * Lanza ErrorApp (con recomendación) si el archivo no es un libro legible.
 */
function abrirLibro_(bytes) {
  const b = function (i) { return bytes[i] & 0xFF; };
  if (!bytes || bytes.length < 4) {
    throw new ErrorApp('ARCHIVO_DANADO', 'El archivo está vacío o incompleto.', {
      recomendacion: 'Abra el archivo en Excel para comprobar que está completo, guárdelo y vuelva a cargarlo.'
    });
  }
  if (b(0) === 0xD0 && b(1) === 0xCF && b(2) === 0x11 && b(3) === 0xE0) {
    throw new ErrorApp('FORMATO_ANTIGUO_O_PROTEGIDO',
      'Aunque su nombre termina en .xlsx, el archivo está en formato Excel antiguo (.xls) o protegido con contraseña.', {
        recomendacion: 'Ábralo en Excel, quite la contraseña si la tiene y use «Guardar como» → «Libro de Excel (.xlsx)».'
      });
  }
  if (b(0) !== 0x50 || b(1) !== 0x4B) {
    throw new ErrorApp('NO_ES_LIBRO_EXCEL', 'Aunque su nombre termina en .xlsx, el contenido no corresponde a un libro de Excel.', {
      recomendacion: 'Abra la plantilla en Excel y use «Guardar como» → «Libro de Excel (.xlsx)». No cambie la extensión a mano.'
    });
  }

  let entradas;
  try {
    entradas = Utilities.unzip(Utilities.newBlob(bytes, 'application/zip', 'libro.zip'));
  } catch (e) {
    throw errorArchivoNoProcesable_(bytes.length, e);
  }
  const partes = {};
  entradas.forEach(function (blob) {
    partes[String(blob.getName()).replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase()] = blob;
  });
  const leer = function (ruta) {
    const blob = ruta ? partes[String(ruta).toLowerCase()] : null;
    return blob ? blob.getDataAsString('UTF-8') : null;
  };

  const relRaiz = leerRelaciones_(leer('_rels/.rels'), '');
  const principal = Object.keys(relRaiz).map(function (k) { return relRaiz[k]; })
    .filter(function (r) { return r.tipo === 'officeDocument'; })[0];
  const rutaLibro = principal ? principal.ruta : 'xl/workbook.xml';
  const xmlLibro = leer(rutaLibro);
  if (!xmlLibro) {
    throw new ErrorApp('NO_ES_LIBRO_EXCEL', 'El archivo es un paquete comprimido, pero no contiene un libro de Excel.', {
      recomendacion: 'Abra la plantilla en Excel y use «Guardar como» → «Libro de Excel (.xlsx)».'
    });
  }

  const baseLibro = rutaLibro.indexOf('/') === -1 ? '' : rutaLibro.slice(0, rutaLibro.lastIndexOf('/') + 1);
  const relLibro = leerRelaciones_(leer(baseLibro + '_rels/' + rutaLibro.slice(baseLibro.length) + '.rels'), baseLibro);
  const porTipo = function (tipo) {
    const r = Object.keys(relLibro).map(function (k) { return relLibro[k]; }).filter(function (x) { return x.tipo === tipo; })[0];
    return r ? r.ruta : null;
  };

  const hojas = [];
  buscarEtiquetas_(xmlLibro, 'sheet').forEach(function (atributos) {
    const destino = relLibro[atributoId_(atributos)];
    if (!destino || destino.tipo !== 'worksheet') return;
    hojas.push({
      nombre: decodificarXml_(atributos.name || ''),
      oculta: !!atributos.state && atributos.state !== 'visible',
      ruta: destino.ruta,
      xml: null
    });
  });

  return {
    hojas: hojas,
    textos: leerTextosCompartidos_(leer(porTipo('sharedStrings'))),
    estilosFecha: leerEstilosFecha_(leer(porTipo('styles'))),
    leer: leer
  };
}

/**
 * Recorre las filas de una hoja entre desde y hasta (0 = sin límite).
 * El callback recibe (numeroFila, celdas) y puede devolver false para detenerse.
 */
function recorrerFilas_(libro, xml, desde, hasta, alVisitar) {
  const reFila = /<(?:[\w.-]+:)?row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?row>)/g;
  let m;
  let anterior = 0;
  while ((m = reFila.exec(xml))) {
    const atributos = parsearAtributos_(m[1]);
    const numero = atributos.r ? Number(atributos.r) : anterior + 1;
    anterior = numero;
    if (numero < desde) continue;
    if (hasta && numero > hasta) break;
    if (!m[2]) continue;
    if (alVisitar(numero, leerCeldas_(libro, m[2])) === false) break;
  }
}

function leerCeldas_(libro, xmlFila) {
  const reCelda = /<(?:[\w.-]+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?c>)/g;
  const celdas = {};
  let m;
  let anterior = -1;
  while ((m = reCelda.exec(xmlFila))) {
    const atributos = parsearAtributos_(m[1]);
    const columna = atributos.r ? indiceColumna_(atributos.r) : anterior + 1;
    anterior = columna;
    celdas[columna] = construirCelda_(libro, atributos, m[2] || '');
  }
  return celdas;
}

/**
 * Convierte una celda XML en { tipo, texto, numero?, esFecha? }.
 * «texto» es la representación tal como está guardada: los textos no se
 * convierten a número y los números no se reformatean.
 */
function construirCelda_(libro, atributos, interior) {
  const tipo = atributos.t || 'n';
  const v = contenidoEtiqueta_(interior, 'v');
  switch (tipo) {
    case 's': {
      const texto = v === null ? '' : (libro.textos[Number(v)] || '');
      return texto === '' ? CELDA_VACIA_ : { tipo: 'texto', texto: texto };
    }
    case 'inlineStr': {
      const coincidencia = interior.match(/<(?:[\w.-]+:)?is\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?is>/);
      const texto = coincidencia ? textoDeRuns_(coincidencia[1]) : '';
      return texto === '' ? CELDA_VACIA_ : { tipo: 'texto', texto: texto };
    }
    case 'str':
      return v ? { tipo: 'texto', texto: v } : CELDA_VACIA_;
    case 'b':
      return v === null ? CELDA_VACIA_ : { tipo: 'booleano', texto: v === '1' ? 'VERDADERO' : 'FALSO' };
    case 'e':
      return { tipo: 'error', texto: v || '#ERROR' };
    case 'd':
      return v ? { tipo: 'fecha', texto: v, esFecha: true } : CELDA_VACIA_;
    default: {
      if (v === null || v.trim() === '') return CELDA_VACIA_;
      const numero = Number(v);
      if (!Number.isFinite(numero)) return { tipo: 'texto', texto: v };
      return {
        tipo: 'numero',
        texto: String(numero),
        numero: numero,
        esFecha: !!libro.estilosFecha[atributos.s ? Number(atributos.s) : 0]
      };
    }
  }
}

function leerTextosCompartidos_(xml) {
  const textos = [];
  if (!xml) return textos;
  const re = /<(?:[\w.-]+:)?si\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?si>)/g;
  let m;
  while ((m = re.exec(xml))) textos.push(textoDeRuns_(m[1] || ''));
  return textos;
}

/** Une los fragmentos <t> de un texto enriquecido, sin la guía fonética. */
function textoDeRuns_(xml) {
  const limpio = xml.replace(/<(?:[\w.-]+:)?rPh\b[\s\S]*?<\/(?:[\w.-]+:)?rPh>/g, '');
  const re = /<(?:[\w.-]+:)?t\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?t>)/g;
  let salida = '';
  let m;
  while ((m = re.exec(limpio))) salida += m[1] || '';
  return decodificarXml_(salida);
}

/** Devuelve, por índice de estilo de celda, si su formato numérico es de fecha u hora. */
function leerEstilosFecha_(xml) {
  const resultado = [];
  if (!xml) return resultado;
  const personalizados = {};
  buscarEtiquetas_(xml, 'numFmt').forEach(function (a) {
    personalizados[Number(a.numFmtId)] = decodificarXml_(a.formatCode || '');
  });
  const bloque = (xml.match(/<(?:[\w.-]+:)?cellXfs\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?cellXfs>/) || [])[1] || '';
  buscarEtiquetas_(bloque, 'xf').forEach(function (a) {
    const id = Number(a.numFmtId || 0);
    resultado.push(esFormatoFecha_(id, personalizados[id]));
  });
  return resultado;
}

function esFormatoFecha_(id, codigo) {
  if ((id >= 14 && id <= 22) || (id >= 27 && id <= 36) || (id >= 45 && id <= 47) || (id >= 50 && id <= 58)) return true;
  if (!codigo) return false;
  const limpio = codigo.replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, '').replace(/\\./g, '');
  return /[dmyhs]/i.test(limpio);
}

function leerRelaciones_(xml, base) {
  const relaciones = {};
  if (!xml) return relaciones;
  buscarEtiquetas_(xml, 'Relationship').forEach(function (a) {
    if (!a.Id || !a.Target || a.TargetMode === 'External') return;
    relaciones[a.Id] = {
      tipo: String(a.Type || '').split('/').pop(),
      ruta: resolverRuta_(base, decodificarXml_(a.Target))
    };
  });
  return relaciones;
}

function resolverRuta_(base, destino) {
  let ruta = destino;
  try { ruta = decodeURIComponent(destino); } catch (e) { /* se usa tal cual */ }
  if (ruta.charAt(0) === '/') return ruta.slice(1);
  const pila = [];
  (base + ruta).split('/').forEach(function (parte) {
    if (parte === '..') pila.pop();
    else if (parte && parte !== '.') pila.push(parte);
  });
  return pila.join('/');
}

/* ------------------------------------------------------------------------ */
/* Utilidades                                                                */
/* ------------------------------------------------------------------------ */

let indiceEsquemaMemo_ = null;

/** Índice de encabezados normalizados (oficiales y alias) → definición. */
function indiceEsquema_() {
  if (indiceEsquemaMemo_) return indiceEsquemaMemo_;
  const indice = {};
  ESQUEMA.forEach(function (col) {
    [col.encabezado].concat(col.alias).forEach(function (texto) { indice[normalizarEncabezado_(texto)] = col; });
  });
  indiceEsquemaMemo_ = indice;
  return indice;
}

const TILDES_ = {
  'Á': 'A', 'À': 'A', 'Ä': 'A', 'Â': 'A', 'É': 'E', 'È': 'E', 'Ë': 'E', 'Ê': 'E', 'Í': 'I', 'Ì': 'I', 'Ï': 'I',
  'Î': 'I', 'Ó': 'O', 'Ò': 'O', 'Ö': 'O', 'Ô': 'O', 'Ú': 'U', 'Ù': 'U', 'Ü': 'U', 'Û': 'U', 'Ñ': 'N',
  'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a', 'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e', 'í': 'i', 'ì': 'i', 'ï': 'i',
  'î': 'i', 'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o', 'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u', 'ñ': 'n'
};

/**
 * Normalización tolerante para comparar encabezados y valores SÍ/NO:
 * ignora mayúsculas, tildes, espacios repetidos y signos de puntuación.
 * No hace equivalencias entre palabras distintas.
 */
function normalizarEncabezado_(valor) {
  return String(valor == null ? '' : valor)
    .replace(/[ÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑáàäâéèëêíìïîóòöôúùüûñ]/g, function (c) { return TILDES_[c]; })
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function esVacia_(celda) {
  return !celda || celda.tipo === 'vacio' || (celda.tipo === 'texto' && String(celda.texto).trim() === '');
}

/** Similitud entre 0 y 1 para sugerir qué encabezado quiso escribir el usuario. */
function similitud_(a, b) {
  if (!a || !b) return 0;
  if (a.length >= 5 && b.length >= 5 && (a.indexOf(b) !== -1 || b.indexOf(a) !== -1)) return 0.9;
  return 1 - distanciaLevenshtein_(a, b) / Math.max(a.length, b.length);
}

function distanciaLevenshtein_(a, b) {
  let previa = [];
  for (let j = 0; j <= b.length; j++) previa[j] = j;
  for (let i = 1; i <= a.length; i++) {
    const actual = [i];
    for (let j = 1; j <= b.length; j++) {
      actual[j] = Math.min(previa[j] + 1, actual[j - 1] + 1, previa[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    }
    previa = actual;
  }
  return previa[b.length];
}

function buscarEtiquetas_(xml, nombre) {
  const re = new RegExp('<(?:[\\w.-]+:)?' + nombre + '(?=[\\s/>])([^>]*)>', 'g');
  const resultado = [];
  let m;
  while ((m = re.exec(xml))) resultado.push(parsearAtributos_(m[1]));
  return resultado;
}

function parsearAtributos_(texto) {
  const atributos = {};
  const re = /([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(texto || ''))) atributos[m[1]] = m[2] !== undefined ? m[2] : m[3];
  return atributos;
}

/** Atributo r:id (o con cualquier prefijo) de un elemento <sheet>. */
function atributoId_(atributos) {
  const clave = Object.keys(atributos).filter(function (k) { return /(^|:)id$/.test(k); })[0];
  return clave ? atributos[clave] : '';
}

function contenidoEtiqueta_(xml, nombre) {
  const m = xml.match(new RegExp('<(?:[\\w.-]+:)?' + nombre + '\\b[^>]*?(?:\\/>|>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?' + nombre + '>)'));
  if (!m) return null;
  return m[1] === undefined ? '' : decodificarXml_(m[1]);
}

function decodificarXml_(texto) {
  return String(texto)
    .replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, function (todo, entidad) {
      switch (entidad) {
        case 'amp': return '&';
        case 'lt': return '<';
        case 'gt': return '>';
        case 'quot': return '"';
        case 'apos': return "'";
        default: {
          const codigo = entidad.charAt(1).toLowerCase() === 'x' ? parseInt(entidad.slice(2), 16) : parseInt(entidad.slice(1), 10);
          return Number.isFinite(codigo) ? String.fromCodePoint(codigo) : todo;
        }
      }
    })
    .replace(/_x([0-9A-Fa-f]{4})_/g, function (todo, hex) { return String.fromCharCode(parseInt(hex, 16)); });
}

function escaparXml_(texto) {
  return String(texto)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function indiceColumna_(referencia) {
  const letras = (String(referencia).match(/^[A-Za-z]+/) || ['A'])[0].toUpperCase();
  let n = 0;
  for (let i = 0; i < letras.length; i++) n = n * 26 + (letras.charCodeAt(i) - 64);
  return n - 1;
}

function letraColumna_(indice) {
  let n = indice + 1;
  let letras = '';
  while (n > 0) {
    const resto = (n - 1) % 26;
    letras = String.fromCharCode(65 + resto) + letras;
    n = Math.floor((n - 1) / 26);
  }
  return letras;
}

function recortar_(texto, maximo) {
  const s = String(texto == null ? '' : texto);
  return s.length > maximo ? s.slice(0, maximo - 1) + '…' : s;
}

function unirLista_(items) {
  return items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1];
}
