/**
 * =============================================================================
 * DÜĞÜN DAVETİYESİ — RSVP BACKEND (Google Apps Script Web App)
 * =============================================================================
 *
 * Kurulum ve deploy adımları README.md içinde ("Apps Script deploy" bölümü).
 * Kısaca:
 *   1. Google Sheets dosyası aç → Extensions > Apps Script
 *   2. Bu dosyanın içeriğini Code.gs'e yapıştır
 *   3. Aşağıdaki CONFIG bloğunu doldur
 *   4. Deploy > New deployment > Web app
 *        Execute as       : Me
 *        Who has access   : Anyone
 *   5. Verilen .../exec adresini assets/js/config.js → rsvpEndpoint'e yaz
 *
 * ÖNEMLİ — CORS:
 *   Frontend isteği Content-Type: text/plain;charset=utf-8 ile atıyor.
 *   application/json kullanılsaydı tarayıcı bir OPTIONS preflight isteği atardı
 *   ve Apps Script Web App OPTIONS'a cevap veremediği için istek CORS hatasıyla
 *   ölürdü. text/plain "simple request" sayıldığı için preflight olmuyor.
 *   Bu yüzden gövde JSON string'i olarak geliyor ve elle parse ediliyor.
 */

// =============================================================================
// AYARLAR
// =============================================================================

var SETTINGS = {
  // Cevapların yazılacağı sayfa (sekme) adı. Yoksa otomatik oluşturulur.
  SHEET_NAME: 'RSVP',

  // Bildirim maili gidecek adres(ler). Virgülle ayır. Boş bırakırsan mail atmaz.
  NOTIFY_EMAIL: 'ornek@ornek.com',

  // Katılım bildirimi son tarihi. config.js → rsvpDeadlineISO ile AYNI olmalı.
  // Frontend kontrolü kullanıcı deneyimi için; gerçek kontrol burada.
  DEADLINE_ISO: '2027-05-29T23:59:59+03:00',

  // Girdi uzunluk sınırları (frontend'i atlayan istekler için)
  MAX_NAME_LEN: 80,
  MAX_MESSAGE_LEN: 500,
  MAX_REF_LEN: 200,
  MAX_GUESTS: 10,

  // Gövde boyutu üst sınırı (byte) — şişkin payload'ları erken reddet
  MAX_BODY_BYTES: 4000,

  // Kilit bekleme süresi (ms). Aynı anda gelen istekler sıraya girer.
  LOCK_WAIT_MS: 10000
};

var HEADERS = [
  'Zaman',
  'Ad Soyad',
  'Katılım',
  'Kişi Sayısı',
  'Mesaj',
  'Ref (davet linki)',
  'User Agent'
];


// =============================================================================
// GİRİŞ NOKTALARI
// =============================================================================

/**
 * Sağlık kontrolü. Tarayıcıda /exec adresini açınca çalışır.
 * RSVP verisi DÖNDÜRMEZ — endpoint herkese açık.
 */
function doGet() {
  return jsonOut({ ok: true, service: 'rsvp', ts: new Date().toISOString() });
}

function doPost(e) {
  try {
    // --- Gövde var mı? ------------------------------------------------------
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: 'empty_body' });
    }

    var raw = String(e.postData.contents);
    if (raw.length > SETTINGS.MAX_BODY_BYTES) {
      return jsonOut({ ok: false, error: 'body_too_large' });
    }

    // --- JSON parse (gövde text/plain olarak geliyor) ----------------------
    var data;
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      return jsonOut({ ok: false, error: 'invalid_json' });
    }
    if (!data || typeof data !== 'object') {
      return jsonOut({ ok: false, error: 'invalid_payload' });
    }

    // --- HONEYPOT ----------------------------------------------------------
    // Frontend bu alanı boş gönderir. Doluysa bot: hiçbir şey kaydetmiyoruz
    // ama saldırgana ipucu vermemek için başarılı cevap dönüyoruz.
    if (str(data.website) !== '') {
      return jsonOut({ ok: true, spam: true });
    }

    // --- SON TARİH ---------------------------------------------------------
    if (SETTINGS.DEADLINE_ISO) {
      var deadline = new Date(SETTINGS.DEADLINE_ISO).getTime();
      if (!isNaN(deadline) && Date.now() > deadline) {
        return jsonOut({ ok: false, error: 'deadline_passed' });
      }
    }

    // --- DOĞRULAMA + UZUNLUK SINIRLARI ------------------------------------
    var name = clamp(str(data.name), SETTINGS.MAX_NAME_LEN);
    if (name.length < 3) {
      return jsonOut({ ok: false, error: 'invalid_name' });
    }

    var attending = str(data.attending).toLowerCase();
    if (attending !== 'yes' && attending !== 'no') {
      return jsonOut({ ok: false, error: 'invalid_attending' });
    }

    var guests = parseInt(data.guests, 10);
    if (isNaN(guests) || guests < 1 || guests > SETTINGS.MAX_GUESTS) {
      return jsonOut({ ok: false, error: 'invalid_guests' });
    }

    var message = clamp(str(data.message), SETTINGS.MAX_MESSAGE_LEN);
    var ref = clamp(str(data.ref), SETTINGS.MAX_REF_LEN);

    var userAgent = '';
    try {
      userAgent = clamp(str(e.parameter && e.parameter.ua), 200);
    } catch (uaErr) { userAgent = ''; }

    // --- KİLİT -------------------------------------------------------------
    // İki kişi aynı anda gönderirse appendRow yarışıp satır ezebilir.
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(SETTINGS.LOCK_WAIT_MS)) {
      return jsonOut({ ok: false, error: 'busy' });
    }

    var row;
    try {
      var sheet = getSheet();
      row = [
        new Date(),
        name,
        attending === 'yes' ? 'Geliyorum' : 'Gelemiyorum',
        guests,
        message,
        ref,
        userAgent
      ];
      sheet.appendRow(row);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    // --- BİLDİRİM MAİLİ ----------------------------------------------------
    // Mail hatası kaydı geçersiz kılmasın; sadece logla.
    try {
      notify(name, attending, guests, message, ref);
    } catch (mailErr) {
      console.error('Bildirim maili gönderilemedi: ' + mailErr);
    }

    return jsonOut({ ok: true });

  } catch (err) {
    console.error('doPost hatası: ' + err + '\n' + (err && err.stack));
    return jsonOut({ ok: false, error: 'server_error' });
  }
}


// =============================================================================
// YARDIMCILAR
// =============================================================================

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function str(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function clamp(value, maxLen) {
  return value.length > maxLen ? value.slice(0, maxLen) : value;
}

/** Sayfayı bulur; yoksa başlık satırıyla birlikte oluşturur. */
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SETTINGS.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SETTINGS.SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150); // Zaman
    sheet.setColumnWidth(2, 180); // Ad Soyad
    sheet.setColumnWidth(5, 320); // Mesaj
  }

  return sheet;
}

function notify(name, attending, guests, message, ref) {
  if (!SETTINGS.NOTIFY_EMAIL) return;

  var durum = attending === 'yes' ? 'GELİYOR' : 'GELEMİYOR';
  var subject = '[Düğün RSVP] ' + name + ' — ' + durum;

  var body = [
    'Yeni katılım bildirimi:',
    '',
    'Ad Soyad   : ' + name,
    'Katılım    : ' + durum,
    'Kişi sayısı: ' + guests,
    'Mesaj      : ' + (message || '—'),
    'Davet linki: ' + (ref || '—'),
    'Zaman      : ' + new Date().toLocaleString('tr-TR'),
    '',
    'Tüm cevaplar: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
  ].join('\n');

  MailApp.sendEmail({
    to: SETTINGS.NOTIFY_EMAIL,
    subject: subject,
    body: body
  });
}


// =============================================================================
// TEST (editörden elle çalıştır)
// -----------------------------------------------------------------------------
// Apps Script editöründe fonksiyon seçicisinden testDoPost'u seç ve Run'a bas.
// Sheets'e test satırı yazar ve bildirim maili atar.
// =============================================================================

function testDoPost() {
  var result = doPost({
    postData: {
      contents: JSON.stringify({
        name: 'Test Kullanıcı',
        attending: 'yes',
        guests: 2,
        message: 'Bu bir testtir.',
        ref: 'd=Test+Kullanıcı&k=2',
        website: ''
      })
    }
  });
  console.log(result.getContent());
}

function testHoneypot() {
  var result = doPost({
    postData: {
      contents: JSON.stringify({
        name: 'Bot', attending: 'yes', guests: 1,
        message: '', ref: '', website: 'http://spam.example'
      })
    }
  });
  // Beklenen: {"ok":true,"spam":true} ve Sheets'e SATIR YAZILMAMASI
  console.log(result.getContent());
}
