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
  bride: "Ece",
  groom: "İsmail",
  coupleSeparator: "&",

  /* ----------------------------------------------------------- Tarih & saat */
  // Kaynak tarih. Geri sayım, takvim linki ve RSVP mantığı bunu kullanır.
  dateISO: "2026-09-26T18:30:00+03:00",
  // Takvim kaydının bitişi (Google Calendar + invite.ics için gerekli).
  endISO: "2026-09-26T23:30:00+03:00",

  // Ekranda görünen serbest metinler. Bilinçli olarak elle yazılıyor:
  // WhatsApp içi eski WebView'larda toLocaleDateString('tr-TR') tutarsız.
  dateLabel: "26 Eylül 2026 · Cumartesi",
  timeLabel: "18:30",

  /* ------------------------------------------------------------------ Mekân */
  venueName: "Örnek Kır Bahçesi",
  venueAddress: "Örnek Mah. Örnek Cad. No: 1, Beykoz / İstanbul",
  // Haritaya gömülü iframe ve Google/Apple linkleri bu sorgudan kurulur.
  mapsQuery: "Örnek Kır Bahçesi, Beykoz, İstanbul",
  // Apple Maps ve Yandex rota linkleri koordinatla çok daha güvenilir çalışır.
  venueCoords: { lat: 41.123456, lng: 29.123456 },

  /* ------------------------------------------------------------------- RSVP */
  rsvpDeadlineISO: "2026-09-12T23:59:59+03:00",
  // Apps Script Web App URL'i. Deploy sonrası aldığın .../exec adresi.
  // Deploy ayarları: Execute as = Me, Who has access = Anyone. (README'ye bak)
  rsvpEndpoint: "https://script.google.com/macros/s/PLACEHOLDER_DEPLOYMENT_ID/exec",
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

    // Galeri
    galleryTitle: "Biz",

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
    rsvpNetworkError: "Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.",
    rsvpServerError: "Cevabınız kaydedilemedi. Lütfen birazdan tekrar deneyin.",
    rsvpRetry: "Tekrar dene",

    rsvpErrorAttending: "Lütfen katılım durumunuzu seçin.",
    rsvpErrorName: "Lütfen adınızı ve soyadınızı yazın.",
    rsvpErrorGuests: "Kişi sayısı geçerli değil.",

    // Daha önce cevap verildiyse
    rsvpAlreadyText: "Cevabınızı aldık — güncellemek ister misiniz?",
    rsvpAlreadyButton: "Cevabımı güncelle",

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
    footerCredit: "Ece & İsmail · 2026",

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
    alt: "Ece ve İsmail"
  },

  hero: [
    {
      portrait: "assets/img/hero-1-portrait.webp",
      landscape: "assets/img/hero-1-landscape.webp",
      width: 1600, height: 900,
      alt: "Ece ve İsmail el ele"
    },
    {
      portrait: "assets/img/hero-2-portrait.webp",
      landscape: "assets/img/hero-2-landscape.webp",
      width: 1600, height: 900,
      alt: "Ece ve İsmail gün batımında"
    },
    {
      portrait: "assets/img/hero-3-portrait.webp",
      landscape: "assets/img/hero-3-landscape.webp",
      width: 1600, height: 900,
      alt: "Ece ve İsmail gülerken"
    },
    {
      portrait: "assets/img/hero-4-portrait.webp",
      landscape: "assets/img/hero-4-landscape.webp",
      width: 1600, height: 900,
      alt: "Ece ve İsmail birlikte"
    }
  ],

  gallery: [
    { src: "assets/img/gallery-1.webp", width: 1200, height: 800, alt: "Anı 1" },
    { src: "assets/img/gallery-2.webp", width: 1200, height: 800, alt: "Anı 2" },
    { src: "assets/img/gallery-3.webp", width: 1200, height: 800, alt: "Anı 3" },
    { src: "assets/img/gallery-4.webp", width: 1200, height: 800, alt: "Anı 4" },
    { src: "assets/img/gallery-5.webp", width: 1200, height: 800, alt: "Anı 5" },
    { src: "assets/img/gallery-6.webp", width: 1200, height: 800, alt: "Anı 6" }
  ],

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
    particleCount: 12,      // en fazla 12
    gallery: true           // galeri bölümü
  }
};
