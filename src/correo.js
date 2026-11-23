/*****************************************************************************************/
/*                    ENVIO MENSUAL CORREO AUTOMATICO - PREMIOS                          */
/*  Desarrollado Por  : Rebeca Pedrozo Cueto                            */
/*  Revisado Por      : Leydi Librado                                                    */
/*  Aprobado Por      : Leydi Librado                                                    */
/*                                                                                       */
/*  Proyecto independiente de Apps Script.                                               */
/*                                                                                       */
/*  PROPIEDADES DEL SCRIPT (Configuracion del proyecto -> Propiedades del script):        */
/*     ID_BASE        ID del Excel BaseCorreos                           obligatoria     */
/*     ID_LOGO        ID de la imagen del logo en Drive                  obligatoria     */
/*     URL_INTERFAZ   URL de la interfaz de cargue                       obligatoria     */
/*     DIA_LIMITE     Dia maximo de cargue, por defecto 2                opcional        */
/*     CORREO_PRUEBA  La crea y borra sola PruebaCorreoPremios           no tocar        */
/*                                                                                       */
/*  FUNCIONES:                                                                           */
/*     PruebaCorreoPremios          envia solo a quien ejecuta, para revisar             */
/*     EnviarCorreoMensualPremios   envia a toda la lista, va en el activador mensual     */
/*****************************************************************************************/

function EnviarCorreoMensualPremios() {

  /****************************************************************/
  /*                   LECTURA DE PROPIEDADES                     */
  /****************************************************************/
  var props = PropertiesService.getScriptProperties();
  var idBase = props.getProperty('ID_BASE');
  var idLogo = props.getProperty('ID_LOGO');
  var urlInterfaz = props.getProperty('URL_INTERFAZ');
  var diaLimite = props.getProperty('DIA_LIMITE') || '2';

  if (!idBase || !idLogo || !urlInterfaz) {
    throw new Error('Faltan propiedades del script. Revise ID_BASE, ID_LOGO y URL_INTERFAZ.');
  }

  /****************************************************************/
  /*                   DATOS DE LA BASE                           */
  /****************************************************************/
  var hoja = SpreadsheetApp.openById(idBase).getSheetByName('BaseCorreos');
  var fecha = hoja.getRange('F3').getValue();

  // Si existe CORREO_PRUEBA el envio es solo de prueba
  var dirEmail = props.getProperty('CORREO_PRUEBA') || hoja.getRange('C2').getValue();

  if (!dirEmail) {
    throw new Error('La celda C2 de BaseCorreos esta vacia, no hay destinatarios.');
  }
  if (!(fecha instanceof Date)) {
    throw new Error('La celda F3 de BaseCorreos no tiene una fecha valida.');
  }

  /****************************************************************/
  /*                   FECHAS                                     */
  /****************************************************************/
  var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
               'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  var dia = Utilities.formatDate(fecha, 'GMT-5', 'd');
  var mes = Number(Utilities.formatDate(fecha, 'GMT-5', 'M')) - 1;
  var anio = Number(Utilities.formatDate(fecha, 'GMT-5', 'yyyy'));

  var fechaCorte = dia + ' de ' + meses[mes] + ' de ' + anio;

  var limite = new Date(anio, mes + 1, Number(diaLimite));
  var fechaLimite = limite.getDate() + ' de ' + meses[limite.getMonth()] + ' de ' + limite.getFullYear();

  /****************************************************************/
  /*                   LOGO                                       */
  /****************************************************************/
  var logo = DriveApp.getFileById(idLogo).getBlob();

  /****************************************************************/
  /*                   CUERPO DEL CORREO                          */
  /****************************************************************/
  var mensaje =
  '<div style="background:#F4F4F4;padding:24px 0;font-family:Arial,Helvetica,sans-serif;">' +
  '<table width="600" cellpadding="0" cellspacing="0" align="center" style="background:#FFFFFF;border-radius:10px;overflow:hidden;">' +

  // Cabecera roja
  '<tr><td style="background:#ED1C27;padding:26px 28px 30px;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr>' +
      '<td><img src="cid:logoDavivienda" height="34" alt="Davivienda" style="display:block;border:0;"></td>' +
      '<td align="right" style="font-size:12px;color:#FFFFFF;">Dirección de Impuestos</td>' +
    '</tr></table>' +
    '<p style="margin:0 0 6px;font-size:13px;color:#FFFFFF;">Solicitud mensual</p>' +
    '<p style="margin:0 0 16px;font-size:30px;font-weight:bold;color:#FFFFFF;line-height:1.15;">Premios y CashBack</p>' +
    '<table cellpadding="0" cellspacing="0"><tr><td style="background:#FFFFFF;border-radius:20px;padding:7px 14px;font-size:13px;font-weight:bold;color:#A4161A;">' +
      'Corte al ' + fechaCorte +
    '</td></tr></table>' +
  '</td></tr>' +

  '<tr><td style="padding:26px 28px 24px;">' +

    '<p style="margin:0 0 22px;font-size:15px;color:#3A3A3A;line-height:1.7;">Buen día. Agradecemos registrar la información de Premios y CashBack del corte indicado a través de la nueva interfaz de cargue.</p>' +

    // Aviso del Drive deshabilitado
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF0F1;border-radius:8px;margin:0 0 24px;"><tr>' +
      '<td width="46" valign="top" style="padding:16px 0 16px 16px;">' +
        '<table cellpadding="0" cellspacing="0"><tr><td width="30" height="30" align="center" style="background:#A4161A;border-radius:15px;color:#FFFFFF;font-size:17px;font-weight:bold;">!</td></tr></table>' +
      '</td>' +
      '<td style="padding:16px 16px 16px 0;">' +
        '<p style="margin:0 0 5px;font-size:15px;font-weight:bold;color:#8E1217;">El Drive quedó deshabilitado</p>' +
        '<p style="margin:0;font-size:14px;color:#8E1217;line-height:1.6;">La carpeta que se usaba antes ya no recibe archivos. Desde este mes la información se registra solo por la interfaz, que valida los datos antes de guardarlos.</p>' +
      '</td>' +
    '</tr></table>' +

    // Boton
    '<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;"><tr><td align="center">' +
      '<a href="' + urlInterfaz + '" style="display:inline-block;background:#A4161A;color:#FFFFFF;font-size:17px;font-weight:bold;padding:16px 44px;border-radius:7px;text-decoration:none;">Ir a la interfaz de cargue</a>' +
    '</td></tr></table>' +

    // Fecha limite
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#3A3A3A;border-radius:8px;margin:0 0 26px;"><tr><td style="padding:16px 20px;">' +
      '<p style="margin:0 0 3px;font-size:12px;color:#C9C9C9;">Fecha límite de cargue</p>' +
      '<p style="margin:0;font-size:19px;font-weight:bold;color:#FFFFFF;">' + fechaLimite + '</p>' +
    '</td></tr></table>' +

    // Pasos
    '<p style="margin:0 0 16px;font-size:17px;font-weight:bold;color:#3A3A3A;">Cómo registrar la información</p>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;font-size:14px;color:#3A3A3A;">' +
      paso(1, 'Descargue la plantilla desde la interfaz y diligéncie todos los campos.') +
      paso(2, 'No cambie, mueva ni renombre las columnas de la plantilla.') +
      paso(3, 'Suba el archivo en formato .xlsx y revise el resultado de la validación.') +
      paso(4, 'Confirme el envío. Si la validación marca errores, el cargue no queda registrado.') +
    '</table>' +

    // Categorias
    '<p style="margin:0 0 14px;font-size:17px;font-weight:bold;color:#3A3A3A;">Qué va en cada categoría</p>' +
    '<table width="100%" cellpadding="0" cellspacing="10" style="margin:0 0 20px;"><tr>' +
      '<td width="50%" valign="top" style="background:#F7F7F7;border-radius:8px;padding:16px;">' +
        '<p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:#A4161A;">Premios</p>' +
        '<p style="margin:0;font-size:14px;color:#3A3A3A;line-height:1.55;">Casos registrados ante Coljuegos.</p>' +
      '</td>' +
      '<td width="50%" valign="top" style="background:#F7F7F7;border-radius:8px;padding:16px;">' +
        '<p style="margin:0 0 6px;font-size:15px;font-weight:bold;color:#A4161A;">CashBack</p>' +
        '<p style="margin:0;font-size:14px;color:#3A3A3A;line-height:1.55;">Y otros ingresos tributarios no registrados ante Coljuegos.</p>' +
      '</td>' +
    '</tr></table>' +

    // Firma
    '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:2px solid #ED1C27;padding:18px 0 0;">' +
      '<p style="margin:0;font-size:14px;color:#3A3A3A;line-height:1.7;">Cordialmente,<br><b>Dirección de Impuestos</b><br>' +
      '<span style="color:#6B6B6B;">Torre Bolívar, Av. El Dorado # 68 B 31, piso 7<br>Banco Davivienda S.A.</span></p>' +
    '</td></tr></table>' +

  '</td></tr>' +

  // Pie
  '<tr><td align="center" style="background:#F4F4F4;padding:15px 28px;">' +
    '<p style="margin:0;font-size:12px;color:#6B6B6B;">Mensaje automático generado por la Dirección de Impuestos. No responda a este correo.</p>' +
  '</td></tr>' +

  '</table></div>';

  /****************************************************************/
  /*                   ENVIO                                      */
  /****************************************************************/
  MailApp.sendEmail({
    name: 'Impuestos Davivienda',
    to: dirEmail,
    subject: 'Solicitud información Premios - corte ' + fechaCorte,
    htmlBody: mensaje,
    inlineImages: { logoDavivienda: logo },
    noReply: true
  });
}

/****************************************************************/
/*          PRUEBA: envia solo a quien ejecuta                  */
/****************************************************************/
function PruebaCorreoPremios() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('CORREO_PRUEBA', Session.getActiveUser().getEmail());
  try {
    EnviarCorreoMensualPremios();
  } finally {
    props.deleteProperty('CORREO_PRUEBA');
  }
}

/****************************************************************/
/*          AUXILIAR: fila de un paso numerado                  */
/****************************************************************/
function paso(numero, texto) {
  return '<tr>' +
    '<td width="38" valign="top" style="padding:0 0 14px;">' +
      '<table cellpadding="0" cellspacing="0"><tr><td width="26" height="26" align="center" style="background:#FDF0F1;border-radius:13px;color:#A4161A;font-size:14px;font-weight:bold;">' + numero + '</td></tr></table>' +
    '</td>' +
    '<td style="padding:2px 0 14px;line-height:1.6;">' + texto + '</td>' +
  '</tr>';
}