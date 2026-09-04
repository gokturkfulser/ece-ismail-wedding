/* =============================================================================
   DÜĞÜN DAVETİYESİ — TEK İÇERİK KAYNAĞI
   -----------------------------------------------------------------------------
   Sitedeki bütün isim, tarih, metin ve görsel bu dosyadan gelir.
   index.html içinde hardcode içerik YOKTUR (tek istisna: <head> içindeki
   OG/Twitter meta etiketleri — build step olmadığı için statik kalmak zorunda,
   orada "CONFIG İLE EŞLE" yorumuyla işaretlendi).

   ÖNEMLİ: Tüm dosya yolları GÖRELİ olmalı ("assets/img/x.webp").
   Başında "/" olan yol GitHub Pages proje reposunda (alt path) KIRILIR.
   ============================================================================= */

window.CONFIG = {

  /* ---------------------------------------------------------------- Kişiler */
  bride: "Aybala Ece",
  groom: "İsmail",
  coupleSeparator: "&",

  /* ----------------------------------------------------------- Tarih & saat */
  // Kaynak tarih. Geri sayım, takvim linki ve RSVP mantığı bunu kullanır.
  dateISO: "2026-09-26T12:00:00+03:00",
  // Takvim kaydının bitişi (Google Calendar + invite.ics için gerekli).
  endISO: "2026-09-26T16:00:00+03:00",

  // Ekranda görünen serbest metinler. Bilinçli olarak elle yazılıyor:
  // WhatsApp içi eski WebView'larda toLocaleDateString('tr-TR') tutarsız.
  dateLabel: "26 Eylül 2026 · Cumartesi",
  timeLabel: "12:00 – 16:00",

  /* ------------------------------------------------------------------ Mekân */
  venueName: "Park Lamore",
  venueAddress: "İncek, Turgut Özal Blv. No:48, 06830 Gölbaşı/Ankara",
  // Haritaya gömülü iframe ve Google/Apple linkleri bu sorgudan kurulur.
  mapsQuery: "Park Lamore, İncek, Turgut Özal Blv. No:48, 06830 Gölbaşı/Ankara",
  // Apple Maps ve Yandex rota linkleri koordinatla çok daha güvenilir çalışır.
  venueCoords: { lat: 39.797014, lng: 32.693879 },

  /* ------------------------------------------------------------------- RSVP */
  rsvpDeadlineISO: "2027-09-26T23:59:59+03:00",
  // Apps Script Web App URL'i. Deploy sonrası aldığın .../exec adresi.
  // Deploy ayarları: Execute as = Me, Who has access = Anyone. (README'ye bak)
  rsvpEndpoint: "https://script.google.com/macros/s/AKfycbwEVvubY2riRLlo3JtEtzif9TDDpjSJQihDZJHfdvXlm-fSoMKsSEgbwtqnrVloU3jHxQ/exec",
  // Apps Script tarafında doğrulanacak paylaşım anahtarı. Sheet ID GİBİ GİZLİ
  // DEĞİL — sadece rastgele bot POST'larını ayıklamaya yarar, repoda durabilir.
  rsvpToken: "dugun2027",
  // true ise gönderim akışının her aşaması konsola loglanır (debug amaçlı).
  rsvpDebug: false,
  maxGuests: 10,
  messageMaxLength: 500,

  /* --------------------------------------------------------------- Metinler */
  text: {
    // Kapı ekranı
    gateKicker: "Düğünümüze davetlisiniz",
    gateButton: "DAVETİYEYİ AÇ",
    gateHint: "Müzik ile birlikte açılır",
    // Butona basınca oynayan piksel animasyonunu atlama bağlantısı
    gateSkip: "Atla",

    // Davetiye metni bölümü
    inviteTitle: "Davetimiz",
    inviteBody: [
      "Birlikte yürümeye karar verdiğimiz bu yolun ilk gününde, bizi bugüne getiren en değerli insanları yanımızda görmek istiyoruz.",
      "Sevincimizi paylaşmak, kadehimizi kaldırmak ve bu günü unutulmaz kılmak için sizi aramızda görmeyi çok isteriz."
    ],
    // ?d= parametresi varsa: "Sayın {ad}," şeklinde selamlama basılır.
    greetingPrefix: "Sayın",

    // Etkinlik detayı
    detailsTitle: "Düğün Töreni",
    detailsDateLabel: "Tarih",
    detailsTimeLabel: "Saat",
    detailsVenueLabel: "Mekân",
    calendarButton: "Takvime Ekle",
    calendarGoogle: "Google Takvim",
    calendarIcs: "Takvim dosyası (.ics)",
    directionsButton: "Yol Tarifi",

    // Geri sayım
    countdownTitle: "Geri Sayım",
    countdownDays: "Gün",
    countdownHours: "Saat",
    countdownMinutes: "Dakika",
    countdownSeconds: "Saniye",
    countdownDone: "Bugün o gün! Mutluluğumuzu bizimle paylaştığınız için teşekkür ederiz.",

    // RSVP formu
    rsvpTitle: "Katılım Bildirimi",
    rsvpIntro: "Lütfen katılım durumunuzu bildirin, hazırlıklarımızı buna göre yapalım.",
    rsvpAttendingLabel: "Katılım durumunuz",
    rsvpYes: "Geliyorum",
    rsvpNo: "Gelemiyorum",
    rsvpNameLabel: "Ad Soyad",
    rsvpNamePlaceholder: "Adınız ve soyadınız",
    rsvpGuestsLabel: "Kişi sayısı",
    rsvpGuestsHint: "Kendinizle birlikte kaç kişi katılacaksınız?",
    rsvpMessageLabel: "Mesajınız",
    rsvpMessageHint: "İsteğe bağlı",
    rsvpMessagePlaceholder: "Bize iletmek istediğiniz bir not…",
    rsvpSubmit: "Gönder",
    rsvpSubmitting: "Gönderiliyor…",

    rsvpSuccess: "Teşekkürler, cevabınız bize ulaştı.",
    // sendBeacon / no-cors fallback'e düşülünce (cevap okunamaz, iyimser mesaj)
    rsvpSuccessFallback: "Cevabınız iletildi. Bir aksilik olduğunu düşünürseniz bize doğrudan yazın.",
    rsvpNetworkError: "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.",
    rsvpServerError: "Cevabınız gönderilemedi. Lütfen tekrar deneyin.",
    rsvpRetry: "Tekrar Dene",

    rsvpErrorAttending: "Lütfen katılım durumunuzu seçin.",
    rsvpErrorName: "Lütfen adınızı ve soyadınızı yazın.",
    rsvpErrorGuests: "Kişi sayısı geçerli değil.",

    // Sunucudan gelen error koduna göre eşlenen metinler (bkz. app.js SERVER_ERROR_MESSAGES)
    rsvpErrorClosed: "Katılım bildirimi süresi sona erdi.",
    rsvpErrorInvalidName: "Lütfen adınızı ve soyadınızı girin.",
    rsvpErrorInvalidAttending: "Lütfen katılım durumunuzu seçin.",
    rsvpErrorForbidden: "Bir sorun oluştu, lütfen sayfayı yenileyip tekrar deneyin.",
    rsvpErrorBusy: "Sistem yoğun, lütfen birkaç saniye sonra tekrar deneyin.",

    // Daha önce cevap verildiyse. {ad} yerine kaydedilen isim basılır.
    rsvpAlreadyText: "Cevabınızı aldık, teşekkür ederiz — {ad}. Güncellemek isterseniz aşağıdan tekrar gönderebilirsiniz.",
    rsvpAlreadyButton: "Cevabımı Güncelle",

    // Son tarih geçtiyse
    rsvpClosedTitle: "Katılım bildirimi kapandı",
    rsvpClosedText: "Katılım süresi sona erdi, lütfen bizimle doğrudan iletişime geçin.",

    // Konum
    locationTitle: "Konum",
    mapEmbedTitle: "Etkinlik yeri haritası",
    mapGoogle: "Google Maps",
    mapApple: "Apple Maps",
    mapYandex: "Yandex Navigasyon",

    // Footer
    footerNote: "Sizi aramızda görmek bizi çok mutlu edecek.",
    footerCredit: "Aybala Ece & İsmail · 2026",

    // Ses kontrolü (ekran okuyucu etiketleri)
    audioMute: "Müziği kapat",
    audioUnmute: "Müziği aç"
  },

  /* --------------------------------------------------------------- Görseller
     portrait = mobil (dikey kırpım), landscape = masaüstü (yatay kırpım).
     width/height, CLS'i 0'da tutmak için landscape kırpımın gerçek ölçüsü.  */

  gate: {
    portrait: "assets/img/gate-portrait.webp",
    landscape: "assets/img/gate-landscape.webp",
    width: 1920,
    height: 1080,
    alt: "Aybala Ece ve İsmail"
  },

  hero: [
    {
      portrait: "assets/img/hero-1-portrait.webp",
      landscape: "assets/img/hero-1-landscape.webp",
      width: 1600, height: 900,
      alt: "Aybala Ece ve İsmail el ele"
    },
    {
      portrait: "assets/img/hero-2-portrait.webp",
      landscape: "assets/img/hero-2-landscape.webp",
      width: 1600, height: 900,
      alt: "Aybala Ece ve İsmail gün batımında"
    },
    {
      portrait: "assets/img/hero-3-portrait.webp",
      landscape: "assets/img/hero-3-landscape.webp",
      width: 1600, height: 900,
      alt: "Aybala Ece ve İsmail gülerken"
    },
    {
      portrait: "assets/img/hero-4-portrait.webp",
      landscape: "assets/img/hero-4-landscape.webp",
      width: 1600, height: 900,
      alt: "Aybala Ece ve İsmail birlikte"
    }
  ],

  // Hero'nun hemen altında, sayfanın üst bölgesinde görünen tek fotoğraf.
  photo: {
    portrait: "assets/img/photo-portrait.webp",
    landscape: "assets/img/photo-landscape.webp",
    width: 1600, height: 1067,
    alt: "Aybala Ece ve İsmail"
  },

  /* -------------------------------------------------------------------- Ses
     Dosya, kapı ekranındaki butona basılana kadar YÜKLENMEZ.
     Dosya yoksa mute butonu hiç gösterilmez, site normal çalışır.          */
  audio: {
    src: "assets/audio/music.mp3",
    targetVolume: 0.45,
    fadeInMs: 2500
  },

  /* ----------------------------------------------------------------- Ayarlar */
  options: {
    heroSlideMs: 6000,      // slayt başına görünme süresi
    kenBurnsMinSec: 20,     // Ken Burns zoom süresi alt sınır
    kenBurnsMaxSec: 26,     // Ken Burns zoom süresi üst sınır
    particles: true,        // dekoratif partikül katmanı (false = tamamen kapalı)
    particleCount: 12       // en fazla 12
  }
};
