/* =============================================================================
   DÜĞÜN DAVETİYESİ — DAVRANIŞ
   -----------------------------------------------------------------------------
   Harici kütüphane yok. Modül yok (build step yok), tek IIFE.
   Bütün içerik window.CONFIG'den okunur.

   İÇİNDEKİLER
     01. Yardımcılar
     02. Kişiye özel link (?d= / ?k=)
     03. Metin doldurma ([data-text])
     04. Görseller (kapı / hero / fotoğraf)
     05. Kapı ekranı + müzik
     06. Hero slideshow + Ken Burns
     07. Geri sayım
     08. Takvime ekle
     09. Konum (harita + dış linkler)
     10. RSVP
     11. Scroll reveal
     12. Partiküller
     13. Piksel davetiye sahnesi
     14. Debug paneli (?debug=1)
     15. Başlat
   ============================================================================= */

(function () {
  'use strict';

  var C = window.CONFIG;
  if (!C) {
    console.error('CONFIG bulunamadı — assets/js/config.js yüklenmedi mi?');
    return;
  }

  var T = C.text || {};
  var OPT = C.options || {};

  var LS_MUTED = 'wed:muted';
  var LS_RSVP = 'rsvp';

  var MOBILE_MEDIA = '(max-width: 767px)';

  var prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ?debug=1 varsa manuel test paneli açılır (bkz. bölüm 14). Normal
  // ziyaretçide bu param hiç olmayacağı için panel asla görünmez.
  var debugMode = (function () {
    try { return new URLSearchParams(window.location.search).get('debug') === '1'; }
    catch (e) { return false; }
  })();


  /* ==========================================================================
     01. YARDIMCILAR
     ========================================================================== */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') { node.textContent = v; return; }
        if (k === 'class') { node.className = v; return; }
        node.setAttribute(k, v === true ? '' : String(v));
      });
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  // "text.gateKicker" gibi noktalı yolu CONFIG içinde çözer
  function resolve(path) {
    return path.split('.').reduce(function (acc, key) {
      return (acc === null || acc === undefined) ? acc : acc[key];
    }, C);
  }

  // localStorage gizli sekmede/kısıtlı WebView'da throw edebilir
  function storeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storeSet(key, value) {
    try { window.localStorage.setItem(key, value); return true; }
    catch (e) { return false; }
  }

  function parseDate(iso) {
    if (!iso) return null;
    var t = Date.parse(iso);
    return isNaN(t) ? null : new Date(t);
  }

  function isMobileViewport() {
    return window.matchMedia && window.matchMedia(MOBILE_MEDIA).matches;
  }

  function randBetween(min, max) { return min + Math.random() * (max - min); }

  function coupleNames() {
    return C.bride + ' ' + (C.coupleSeparator || '&') + ' ' + C.groom;
  }


  /* ==========================================================================
     02. KİŞİYE ÖZEL LİNK
     -----------------------------------------------------------------------
     ?d=Ad%20Soyad  → ad alanını doldur + selamlama göster
     ?k=2           → kişi sayısını ön-doldur
     İkisi de payload'daki "ref" alanına yazılır.
     ========================================================================== */

  var invitee = (function () {
    var out = { name: '', guests: null, ref: '' };
    var params;
    try { params = new URLSearchParams(window.location.search); }
    catch (e) { return out; }

    var d = params.get('d');
    var k = params.get('k');

    if (d) {
      // textContent ile basılacak; ayrıca uzunluk sınırı koyuyoruz
      out.name = d.trim().replace(/\s+/g, ' ').slice(0, 80);
    }
    if (k) {
      var n = parseInt(k, 10);
      if (!isNaN(n) && n >= 1) out.guests = Math.min(n, OPT.maxGuests || C.maxGuests || 10);
    }

    // URL-encode YOK: sheet'te/mailde okunaklı kalsın diye "d=...;k=..." düz metin.
    var refParts = [];
    if (d) refParts.push('d=' + out.name);
    if (out.guests !== null) refParts.push('k=' + out.guests);
    out.ref = refParts.join(';');

    return out;
  })();


  /* ==========================================================================
     03. METİN DOLDURMA
     -----------------------------------------------------------------------
     HTML'de içerik yok; her metin düğümü data-text="yol" ile işaretli.
     ========================================================================== */

  function fillTexts(root) {
    $$('[data-text]', root).forEach(function (node) {
      var value = resolve(node.getAttribute('data-text'));
      if (value === null || value === undefined) return;
      node.textContent = String(value);
    });

    // Birden çok paragraf içeren metinler (dizi)
    $$('[data-text-list]', root).forEach(function (node) {
      var list = resolve(node.getAttribute('data-text-list'));
      if (!Array.isArray(list)) return;
      node.textContent = '';
      list.forEach(function (paragraph) {
        node.appendChild(el('p', { text: paragraph }));
      });
    });

    // Öznitelik doldurma: data-attr="placeholder:text.rsvpNamePlaceholder"
    $$('[data-attr]', root).forEach(function (node) {
      node.getAttribute('data-attr').split(';').forEach(function (pair) {
        var parts = pair.split(':');
        if (parts.length !== 2) return;
        var value = resolve(parts[1].trim());
        if (value === null || value === undefined) return;
        node.setAttribute(parts[0].trim(), String(value));
      });
    });
  }

  function fillDocumentTitle() {
    // <title> ve OG etiketleri HTML'de statik (build step yok), ama başlığı
    // CONFIG ile senkron tutmak ücretsiz.
    document.title = coupleNames() + ' · ' + C.dateLabel;
  }


  /* ==========================================================================
     04. GÖRSELLER
     -----------------------------------------------------------------------
     <picture> ile mobil (dikey kırpım) / masaüstü (yatay kırpım).
     Tüm yollar göreli — GitHub Pages alt path'inde çalışsın.
     ========================================================================== */

  function buildPicture(item, opts) {
    opts = opts || {};
    var img = el('img', {
      src: item.landscape || item.src,
      width: item.width,
      height: item.height,
      alt: item.alt || '',
      decoding: 'async',
      loading: opts.eager ? 'eager' : 'lazy',
      fetchpriority: opts.priority || null
    });

    if (!item.portrait) return img;

    return el('picture', null, [
      el('source', { media: MOBILE_MEDIA, srcset: item.portrait }),
      img
    ]);
  }

  function renderGate() {
    var media = $('#gate-media');
    if (!media || !C.gate) return;
    // Kapı görseli LCP elemanı: eager + fetchpriority=high.
    // <head> içindeki inline preload zaten indirmeyi başlatmış olur.
    media.appendChild(buildPicture(C.gate, { eager: true, priority: 'high' }));
  }

  function renderHeroSlides() {
    var wrap = $('#hero-slides');
    if (!wrap || !Array.isArray(C.hero)) return;

    var minSec = OPT.kenBurnsMinSec || 20;
    var maxSec = OPT.kenBurnsMaxSec || 26;

    C.hero.forEach(function (item, i) {
      var first = i === 0;
      var picture = buildPicture(item, {
        eager: first,
        priority: first ? 'high' : null
      });

      var slide = el('figure', {
        class: 'hero__slide' + (first ? ' is-active' : ''),
        'aria-hidden': first ? null : 'true'
      }, [picture]);

      // Ken Burns: her slayta ayrı süre ve yön — çok yavaş (20-26s)
      var img = picture.tagName === 'IMG' ? picture : $('img', picture);
      if (img) {
        img.style.setProperty('--kb-dur', randBetween(minSec, maxSec).toFixed(1) + 's');
        img.style.setProperty('--kb-x', (i % 2 === 0 ? '' : '-') + randBetween(1, 3).toFixed(1) + '%');
        img.style.setProperty('--kb-y', (i % 4 < 2 ? '-' : '') + randBetween(1, 2.5).toFixed(1) + '%');
        // Negatif gecikme: slaytlar aynı karede başlamasın
        img.style.animationDelay = '-' + (i * 4) + 's';
      }

      wrap.appendChild(slide);
    });
  }

  function renderPhoto() {
    var section = $('#photo');
    var media = $('#photo-figure');
    if (!section || !media) return;

    if (!C.photo) { section.remove(); return; }

    media.appendChild(buildPicture(C.photo));
  }


  /* ==========================================================================
     05. KAPI EKRANI + MÜZİK
     -----------------------------------------------------------------------
     Müzik dosyası butona basılana kadar YÜKLENMEZ (Audio nesnesi o an kurulur).
     Autoplay policy gereği ses ancak bu kullanıcı jestiyle başlayabilir.
     Ses 0'dan hedefe fade-in yapar, ani patlamaz.

     Kapı iki aşamalı:
       1) Karşılama (isim/tarih/buton)
       2) Butona basılınca piksel davetiye sahnesi oynar (~7.5s), sonra kapanır.
     Atlama: "Atla" butonu, kapıya tıklama veya Esc.
     prefers-reduced-motion açıkken 2. aşama atlanır, kapı direkt kapanır.
     ========================================================================== */

  var audio = null;
  var fadeTimer = null;

  function audioAvailable() {
    return !!(C.audio && C.audio.src);
  }

  function fadeVolumeTo(target, durationMs) {
    if (!audio) return;
    if (fadeTimer) cancelAnimationFrame(fadeTimer);

    var from = audio.volume;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min(1, (ts - start) / Math.max(1, durationMs));
      // easeOutQuad — algıda daha yumuşak
      var eased = 1 - (1 - progress) * (1 - progress);
      try { audio.volume = from + (target - from) * eased; } catch (e) { /* yoksay */ }
      if (progress < 1) fadeTimer = requestAnimationFrame(step);
      else fadeTimer = null;
    }
    fadeTimer = requestAnimationFrame(step);
  }

  function setupAudioToggle() {
    var toggle = $('#audio-toggle');
    if (!toggle) return;

    function paint() {
      var muted = !audio || audio.muted;
      toggle.classList.toggle('is-muted', muted);
      toggle.setAttribute('aria-pressed', muted ? 'true' : 'false');
      toggle.setAttribute('aria-label', muted ? (T.audioUnmute || 'Müziği aç')
                                              : (T.audioMute || 'Müziği kapat'));
      toggle.title = toggle.getAttribute('aria-label');
    }

    toggle.addEventListener('click', function () {
      if (!audio) return;
      audio.muted = !audio.muted;
      storeSet(LS_MUTED, audio.muted ? '1' : '0');
      if (!audio.muted && audio.paused) {
        audio.play().catch(function () { /* yoksay */ });
      }
      paint();
    });

    toggle.__paint = paint;
    paint();
  }

  function startMusic() {
    if (!audioAvailable() || audio) return;

    var toggle = $('#audio-toggle');
    var wasMuted = storeGet(LS_MUTED) === '1';

    audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audio.muted = wasMuted;
    // Dosya indirmesi tam olarak burada başlar — kapı tıklamasından önce değil.
    audio.src = C.audio.src;

    // Dosya yoksa / çalınamıyorsa mute butonunu hiç göstermeyelim
    function fail() {
      audio = null;
      if (toggle) toggle.classList.add('is-hidden');
    }
    audio.addEventListener('error', fail, { once: true });

    var target = typeof C.audio.targetVolume === 'number' ? C.audio.targetVolume : 0.45;
    var fadeMs = C.audio.fadeInMs || 2500;

    var attempt = audio.play();
    if (attempt && typeof attempt.then === 'function') {
      attempt.then(function () {
        if (toggle) toggle.classList.remove('is-hidden');
        fadeVolumeTo(target, fadeMs);
        if (toggle && toggle.__paint) toggle.__paint();
      }).catch(function () {
        // Jest olmasına rağmen reddedildi (bazı WebView'lar): sessizce vazgeç
        fail();
      });
    } else {
      if (toggle) toggle.classList.remove('is-hidden');
      fadeVolumeTo(target, fadeMs);
    }
  }

  function setupGate() {
    var gate = $('#gate');
    var button = $('#gate-open');
    var skip = $('#gate-skip');
    if (!gate || !button) return;

    document.body.classList.add('is-locked');

    // Müzik yoksa butonun altındaki "müzik ile açılır" ipucunu göstermeyelim
    if (!audioAvailable()) {
      var hint = $('#gate-hint');
      if (hint) hint.remove();
    }

    var opened = false;    // butona basıldı, 2. aşama başladı
    var closing = false;   // kapanış başladı (tek yönlü)
    var sceneTimer = null;

    // --- Kapanış: 2. aşama bitince ya da atlanınca --------------------------
    function close() {
      if (closing) return;
      closing = true;
      if (sceneTimer) { window.clearTimeout(sceneTimer); sceneTimer = null; }

      gate.classList.add('is-closing');
      document.body.classList.remove('is-locked');
      window.scrollTo(0, 0);

      // Fade bitince DOM'dan kaldır
      var removed = false;
      function remove() {
        if (removed) return;
        removed = true;
        if (gate.parentNode) gate.parentNode.removeChild(gate);
        var hero = $('#hero-title');
        if (hero) hero.focus();
      }
      gate.addEventListener('transitionend', remove, { once: true });
      // transitionend gelmezse (reduced-motion, arka plan sekme) yedek
      window.setTimeout(remove, 1400);
    }

    // --- Açılış: butona basıldı --------------------------------------------
    function open() {
      if (opened) return;
      opened = true;

      startMusic();          // kullanıcı jesti burada — autoplay policy tamam
      startHeroSlideshow();

      // Hareket azaltma tercihinde animasyon aşamasını HİÇ oynatmıyoruz;
      // süreler .01ms'e indiği için oynatmak boş bir bekleme olurdu.
      if (prefersReducedMotion) { close(); return; }

      gate.classList.add('is-playing');
      if (skip) skip.classList.remove('is-hidden');
      sceneTimer = startPixelScene(close);
    }

    button.addEventListener('click', open);

    if (skip) {
      skip.addEventListener('click', function (event) {
        event.stopPropagation();
        close();
      });
    }

    // Sahne oynarken kapının herhangi bir yerine tıklamak da atlar.
    // "DAVETİYEYİ AÇ" tıklaması buraya kadar bubble ettiği için butonu
    // ayıklıyoruz — yoksa aynı tıklama sahneyi hem başlatıp hem atlardı.
    gate.addEventListener('click', function (event) {
      if (!opened || closing) return;
      if (event.target === button || button.contains(event.target)) return;
      close();
    });

    // Esc ile atla
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' && event.keyCode !== 27) return;
      if (opened && !closing) close();
    });
  }


  /* ==========================================================================
     06. HERO SLIDESHOW
     -----------------------------------------------------------------------
     CSS crossfade; JS sadece .is-active sınıfını taşır.
     ========================================================================== */

  var slideshow = { timer: null, index: 0, slides: [] };

  function startHeroSlideshow() {
    if (slideshow.timer) return;

    slideshow.slides = $$('#hero-slides .hero__slide');
    if (slideshow.slides.length < 2) return;

    var interval = OPT.heroSlideMs || 6000;

    function advance() {
      var prev = slideshow.slides[slideshow.index];
      slideshow.index = (slideshow.index + 1) % slideshow.slides.length;
      var next = slideshow.slides[slideshow.index];

      prev.classList.remove('is-active');
      prev.setAttribute('aria-hidden', 'true');
      next.classList.add('is-active');
      next.removeAttribute('aria-hidden');
    }

    slideshow.timer = window.setInterval(advance, interval);

    // Sekme arka plandayken boşa çalışmasın
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        window.clearInterval(slideshow.timer);
        slideshow.timer = null;
      } else if (!slideshow.timer) {
        slideshow.timer = window.setInterval(advance, interval);
      }
    });
  }

  // Aşağı kaydır ipucu: tıklanınca bir sonraki bölüme kaydırır, kullanıcı
  // zaten kaydırmaya başlayınca (hero ekrandan çıkınca) kendini gizler.
  function setupHeroScroll() {
    var hero = $('#hero');
    var btn = $('#hero-scroll');
    if (!hero || !btn) return;

    btn.addEventListener('click', function () {
      var next = hero.nextElementSibling;
      if (next && next.scrollIntoView) {
        next.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });

    if (!window.IntersectionObserver) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        btn.classList.toggle('is-hidden', entry.intersectionRatio < 0.6);
      });
    }, { threshold: 0.6 });
    io.observe(hero);
  }


  /* ==========================================================================
     07. GERİ SAYIM
     ========================================================================== */

  function setupCountdown() {
    var list = $('#countdown');
    var done = $('#countdown-done');
    var target = parseDate(C.dateISO);
    if (!list || !done || !target) return;

    var cells = {
      days: $('#cd-days'),
      hours: $('#cd-hours'),
      minutes: $('#cd-minutes'),
      seconds: $('#cd-seconds')
    };

    var timer = null;

    function finish() {
      if (timer) window.clearInterval(timer);
      list.classList.add('is-hidden');
      done.classList.remove('is-hidden');
    }

    function tick() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) { finish(); return; }

      var totalSeconds = Math.floor(diff / 1000);
      var days = Math.floor(totalSeconds / 86400);
      var hours = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;

      // Gün de iki haneli pad'li; 100+ günde doğal olarak 3 hane olur
      if (cells.days) cells.days.textContent = pad2(days);
      if (cells.hours) cells.hours.textContent = pad2(hours);
      if (cells.minutes) cells.minutes.textContent = pad2(minutes);
      if (cells.seconds) cells.seconds.textContent = pad2(seconds);
    }

    tick();
    if (target.getTime() > Date.now()) {
      timer = window.setInterval(tick, 1000);
    }
  }


  /* ==========================================================================
     08. TAKVİME EKLE
     -----------------------------------------------------------------------
     Google Calendar linki runtime'da CONFIG'den kurulur.
     invite.ics repo kökünde statik durur (README'de senkron notu var).
     İki seçenek de sunulur — user-agent sniffing YOK.
     ========================================================================== */

  function toCalendarStamp(date) {
    return date.getUTCFullYear() +
      pad2(date.getUTCMonth() + 1) +
      pad2(date.getUTCDate()) + 'T' +
      pad2(date.getUTCHours()) +
      pad2(date.getUTCMinutes()) +
      pad2(date.getUTCSeconds()) + 'Z';
  }

  function setupCalendar() {
    var googleLink = $('#cal-google');
    var start = parseDate(C.dateISO);
    var end = parseDate(C.endISO) ||
      (start ? new Date(start.getTime() + 5 * 3600 * 1000) : null);

    if (!googleLink || !start || !end) return;

    var params = new URLSearchParams();
    params.set('action', 'TEMPLATE');
    params.set('text', coupleNames() + ' Düğün Töreni');
    params.set('dates', toCalendarStamp(start) + '/' + toCalendarStamp(end));
    params.set('location', C.venueName + ', ' + C.venueAddress);
    params.set('details', coupleNames() + ' düğün töreni · ' + C.venueName);

    googleLink.href = 'https://calendar.google.com/calendar/render?' + params.toString();
  }


  /* ==========================================================================
     09. KONUM
     ========================================================================== */

  function setupLocation() {
    var query = encodeURIComponent(C.mapsQuery || C.venueAddress || '');
    var coords = C.venueCoords || {};
    var hasCoords = typeof coords.lat === 'number' && typeof coords.lng === 'number';
    var ll = hasCoords ? coords.lat + ',' + coords.lng : '';

    // API key gerektirmeyen embed formu
    var frame = $('#map-frame');
    if (frame) {
      frame.src = 'https://www.google.com/maps?q=' + query + '&output=embed';
    }

    var google = $('#map-google');
    if (google) {
      google.href = 'https://www.google.com/maps/search/?api=1&query=' + query;
    }

    var apple = $('#map-apple');
    if (apple) {
      apple.href = 'https://maps.apple.com/?q=' + query + (ll ? '&ll=' + ll : '');
    }

    // Yandex: bu https adresi mobilde Yandex uygulamasına yönlenir,
    // masaüstünde web haritada rota açar. yandexnavi:// şeması masaüstünde
    // ölü link bıraktığı için tercih edilmedi.
    var yandex = $('#map-yandex');
    if (yandex) {
      yandex.href = hasCoords
        ? 'https://yandex.com.tr/maps/?rtext=~' + ll + '&rtt=auto'
        : 'https://yandex.com.tr/maps/?text=' + query;
    }

    // "Yol Tarifi" ana butonu → Google Maps
    var directions = $('#directions');
    if (directions) {
      directions.href = 'https://www.google.com/maps/dir/?api=1&destination=' +
        (hasCoords ? encodeURIComponent(ll) : query);
    }
  }


  /* ==========================================================================
     10. RSVP
     -----------------------------------------------------------------------
     Gönderim üç aşamalı fallback zinciri:
       A) fetch + text/plain body + res.json() — birincil yol.
          application/json KULLANILMAZ: preflight OPTIONS tetikler, Apps
          Script OPTIONS'a cevap veremediği için CORS hatası alırdık.
       B) A, CORS/TypeError ile patlarsa → navigator.sendBeacon (ateşle-unut,
          cevap okunamaz, iyimser başarı gösterilir).
       C) sendBeacon kullanılamıyorsa/false dönerse → fetch mode:'no-cors'
          (yine cevap okunamaz, iyimser başarı gösterilir).
     Sunucudan gelen data.error kodu SERVER_ERROR_MESSAGES ile Türkçeye
     çevrilir; eşleşmeyen kod veya ağ hatasında genel mesajlar kullanılır.
     ========================================================================== */

  var rsvp = {
    submitting: false,
    lastPayload: null,
    lastStage: null,     // 'A' | 'B' | 'C' — debug paneli için
    lastOutcome: null     // 'success' | 'optimistic' | 'server_error' | 'network_error'
  };

  function debugLog() {
    if (!C.rsvpDebug || !window.console) return;
    var args = ['[RSVP]'].concat(Array.prototype.slice.call(arguments));
    console.log.apply(console, args);
  }

  function setupRsvp() {
    var section = $('#rsvp');
    var form = $('#rsvp-form');
    var closed = $('#rsvp-closed');
    var note = $('#rsvp-note');
    if (!section || !form) return;

    // --- Son tarih kontrolü ------------------------------------------------
    var deadline = parseDate(C.rsvpDeadlineISO);
    if (deadline && Date.now() > deadline.getTime()) {
      form.remove();
      if (note) note.remove();
      if (closed) closed.classList.remove('is-hidden');
      return;
    }
    // Debug modunda kapalı bloğu DOM'da (gizli) tutuyoruz: panelin "Deadline'ı
    // geçmiş yap" butonu buna ihtiyaç duyuyor. Normal ziyaretçide kaldırılır.
    if (closed) {
      if (debugMode) closed.classList.add('is-hidden');
      else closed.remove();
    }

    // --- Alan referansları -------------------------------------------------
    var nameInput = $('#rsvp-name');
    var guestsInput = $('#rsvp-guests');
    var messageInput = $('#rsvp-message');
    var honeypot = $('#rsvp-website');
    var submitBtn = $('#rsvp-submit');
    var submitLabel = $('#rsvp-submit-label');
    var spinner = $('#rsvp-spinner');
    var status = $('#rsvp-status');
    var retryWrap = $('#rsvp-retry');
    var retryBtn = $('#rsvp-retry-btn');

    var maxGuests = C.maxGuests || 10;
    guestsInput.max = String(maxGuests);
    messageInput.maxLength = C.messageMaxLength || 500;

    // --- Kişiye özel ön-doldurma ------------------------------------------
    if (invitee.name) nameInput.value = invitee.name;
    if (invitee.guests !== null) guestsInput.value = String(invitee.guests);

    // --- "Cevabınızı aldık" bloğu: {ad} yerine kayıtlı ismi basar ve
    //     "Cevabımı Güncelle" butonunu forma dönecek şekilde bağlar. ---------
    function showAlreadyNote(name) {
      if (!note) return;
      var p = $('p[data-text="text.rsvpAlreadyText"]', note);
      var template = T.rsvpAlreadyText ||
        'Cevabınızı aldık, teşekkür ederiz — {ad}. Güncellemek isterseniz aşağıdan tekrar gönderebilirsiniz.';
      if (p) p.textContent = template.replace('{ad}', name || '');

      var reopen = $('#rsvp-reopen', note);
      if (reopen) {
        reopen.onclick = function () {
          note.classList.add('is-hidden');
          form.hidden = false;
          setStatus('');
          nameInput.focus();
        };
      }
      note.classList.remove('is-hidden');
    }

    // --- Daha önce cevap verilmiş mi? -------------------------------------
    var saved = null;
    try { saved = JSON.parse(storeGet(LS_RSVP) || 'null'); } catch (e) { saved = null; }

    if (saved && note) {
      form.hidden = true;
      // Kaydedilmiş cevabı forma geri yükle — kullanıcı güncellemek isterse hazır
      if (saved.name) nameInput.value = saved.name;
      if (saved.guests) guestsInput.value = String(saved.guests);
      if (saved.attending) {
        var savedRadio = $('#rsvp-form input[name="attending"][value="' + saved.attending + '"]');
        if (savedRadio) savedRadio.checked = true;
      }
      showAlreadyNote(saved.name);
    } else if (note) {
      note.classList.add('is-hidden');
    }

    // --- Doğrulama ---------------------------------------------------------
    function setError(fieldId, message) {
      var box = $('#err-' + fieldId);
      var input = $('#rsvp-' + fieldId);
      if (box) box.textContent = message || '';
      if (input) {
        if (message) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    function clearErrors() {
      ['attending', 'name', 'guests'].forEach(function (f) { setError(f, ''); });
    }

    function readAttending() {
      var checked = $('#rsvp-form input[name="attending"]:checked');
      return checked ? checked.value : '';
    }

    function validate() {
      clearErrors();
      var ok = true;

      if (!readAttending()) {
        setError('attending', T.rsvpErrorAttending || 'Lütfen katılım durumunuzu seçin.');
        ok = false;
      }

      var name = nameInput.value.trim().replace(/\s+/g, ' ');
      if (name.length < 3 || name.indexOf(' ') === -1) {
        setError('name', T.rsvpErrorName || 'Lütfen adınızı ve soyadınızı yazın.');
        ok = false;
      }

      var guests = parseInt(guestsInput.value, 10);
      if (isNaN(guests) || guests < 1 || guests > maxGuests) {
        setError('guests', T.rsvpErrorGuests || 'Kişi sayısı geçerli değil.');
        ok = false;
      }

      return ok;
    }

    // --- Durum göstergesi --------------------------------------------------
    function setStatus(message, kind) {
      status.textContent = message || '';
      status.classList.remove('form__status--error', 'form__status--success');
      if (kind) status.classList.add('form__status--' + kind);
    }

    function setBusy(busy) {
      rsvp.submitting = busy;
      submitBtn.disabled = busy;
      submitBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
      spinner.classList.toggle('is-hidden', !busy);
      submitLabel.textContent = busy
        ? (T.rsvpSubmitting || 'Gönderiliyor…')
        : (T.rsvpSubmit || 'Gönder');
    }

    function showRetry(show) {
      retryWrap.classList.toggle('is-hidden', !show);
    }

    // --- Sunucu error kodu → Türkçe mesaj -----------------------------------
    var SERVER_ERROR_MESSAGES = {
      closed: T.rsvpErrorClosed || 'Katılım bildirimi süresi sona erdi.',
      // Şu anki backend bu durumda "deadline_passed" döner — ikisini de eşle.
      deadline_passed: T.rsvpErrorClosed || 'Katılım bildirimi süresi sona erdi.',
      invalid_name: T.rsvpErrorInvalidName || 'Lütfen adınızı ve soyadınızı girin.',
      invalid_attending: T.rsvpErrorInvalidAttending || 'Lütfen katılım durumunuzu seçin.',
      forbidden: T.rsvpErrorForbidden || 'Bir sorun oluştu, lütfen sayfayı yenileyip tekrar deneyin.',
      busy: T.rsvpErrorBusy || 'Sistem yoğun, lütfen birkaç saniye sonra tekrar deneyin.'
    };

    function serverErrorMessage(code) {
      return SERVER_ERROR_MESSAGES[code] ||
        (T.rsvpServerError || 'Cevabınız gönderilemedi. Lütfen tekrar deneyin.');
    }

    // --- Gönderim ----------------------------------------------------------
    // Aşama A: fetch + JSON. CORS/TypeError ile patlarsa Aşama B'ye düşer.
    function sendStageA(payload) {
      var controller = (typeof AbortController === 'function') ? new AbortController() : null;
      var timeoutId = controller
        ? window.setTimeout(function () { controller.abort(); }, 15000)
        : null;

      return fetch(C.rsvpEndpoint, {
        method: 'POST',
        // application/json PREFLIGHT tetikler → Apps Script OPTIONS'a cevap
        // veremez. text/plain "simple request" sayılır, preflight olmaz.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      })
        .then(function (res) {
          if (timeoutId) window.clearTimeout(timeoutId);
          return res.json();
        })
        .catch(function (err) {
          if (timeoutId) window.clearTimeout(timeoutId);
          throw err;
        });
    }

    // Aşama B: sendBeacon (ateşle-unut). false dönerse Aşama C'ye düşer.
    function sendStageB(payload) {
      rsvp.lastStage = 'B';
      debugLog('Aşama B: sendBeacon');
      var sent = false;
      if (navigator.sendBeacon) {
        try {
          var blob = new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=utf-8' });
          sent = navigator.sendBeacon(C.rsvpEndpoint, blob);
        } catch (e) { sent = false; }
      }
      if (sent) {
        rsvp.lastOutcome = 'optimistic';
        onOptimisticSuccess(payload);
      } else {
        sendStageC(payload);
      }
    }

    // Aşama C: fetch mode:'no-cors' — cevap opak, iyimser başarı gösterilir.
    function sendStageC(payload) {
      rsvp.lastStage = 'C';
      debugLog('Aşama C: fetch no-cors');
      fetch(C.rsvpEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function () {
          rsvp.lastOutcome = 'optimistic';
          onOptimisticSuccess(payload);
        })
        .catch(function (err) {
          rsvp.lastOutcome = 'network_error';
          onFailure(err);
        });
    }

    function send(payload) {
      if (rsvp.submitting) return;          // çift submit engeli
      rsvp.submitting = true;
      rsvp.lastPayload = payload;

      setBusy(true);
      setStatus('');
      showRetry(false);

      rsvp.lastStage = 'A';
      debugLog('Aşama A: fetch + json');
      sendStageA(payload)
        .then(function (data) {
          if (data && data.ok) {
            rsvp.lastOutcome = 'success';
            onSuccess(payload);
          } else {
            rsvp.lastOutcome = 'server_error';
            onServerError(data && data.error);
          }
        })
        .catch(function (err) {
          if (err instanceof TypeError) {
            debugLog('Aşama A CORS/TypeError ile başarısız, Aşama B deneniyor', err);
            sendStageB(payload);
          } else {
            rsvp.lastOutcome = 'network_error';
            onFailure(err);
          }
        });
    }

    function persistAndCelebrate(payload, message) {
      setBusy(false);
      rsvp.submitting = false;

      storeSet(LS_RSVP, JSON.stringify({
        name: payload.name,
        attending: payload.attending,
        guests: payload.guests,
        at: new Date().toISOString()
      }));

      setStatus(message, 'success');
      showRetry(false);

      // Formu kapat, "aldık — güncellemek ister misiniz?" bloğunu göster
      window.setTimeout(function () {
        form.hidden = true;
        showAlreadyNote(payload.name);
      }, 1800);
    }

    function onSuccess(payload) {
      persistAndCelebrate(payload, T.rsvpSuccess || 'Teşekkürler, cevabınız bize ulaştı.');
    }

    // Aşama B/C'ye düşülünce: cevap okunamadı, farklı (iyimser) başarı metni.
    function onOptimisticSuccess(payload) {
      persistAndCelebrate(payload, T.rsvpSuccessFallback ||
        'Cevabınız iletildi. Bir aksilik olduğunu düşünürseniz bize doğrudan yazın.');
    }

    function onServerError(code) {
      setBusy(false);
      rsvp.submitting = false;
      setStatus(serverErrorMessage(code), 'error');
      showRetry(true);
    }

    function onFailure(err) {
      setBusy(false);
      rsvp.submitting = false;

      var isNetwork = !err || err.name === 'AbortError' || err instanceof TypeError ||
        /Failed to fetch|NetworkError|Load failed/i.test(String(err && err.message));

      setStatus(isNetwork
        ? (T.rsvpNetworkError || 'Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.')
        : serverErrorMessage(), 'error');

      showRetry(true);
    }

    // --- Submit ------------------------------------------------------------
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (rsvp.submitting) return;

      // Honeypot dolu → bot. Sessizce başarılı gibi davran, GÖNDERME.
      if (honeypot && honeypot.value.trim() !== '') {
        setStatus(T.rsvpSuccess || 'Teşekkürler, cevabınız bize ulaştı.', 'success');
        form.hidden = true;
        return;
      }

      if (!validate()) {
        var firstError = $('#rsvp-form [aria-invalid="true"]');
        if (firstError) firstError.focus();
        return;
      }

      send({
        name: nameInput.value.trim().replace(/\s+/g, ' '),
        attending: readAttending(),
        guests: parseInt(guestsInput.value, 10),
        message: messageInput.value.trim().slice(0, C.messageMaxLength || 500),
        ref: invitee.ref,
        token: C.rsvpToken || '',
        website: ''
      });
    });

    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        if (rsvp.lastPayload) send(rsvp.lastPayload);
      });
    }

    // Karakter sayacı
    var counter = $('#rsvp-message-count');
    if (counter) {
      var limit = C.messageMaxLength || 500;
      function paintCount() {
        counter.textContent = messageInput.value.length + ' / ' + limit;
      }
      messageInput.addEventListener('input', paintCount);
      paintCount();
    }
  }


  /* ==========================================================================
     11. SCROLL REVEAL
     -----------------------------------------------------------------------
     Tek seferlik: göründükten sonra gözlemden çıkarılır.
     ========================================================================== */

  function setupReveal() {
    var targets = $$('[data-reveal]');
    if (!targets.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (node) { node.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);   // tek seferlik
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(function (node) { observer.observe(node); });
  }


  /* ==========================================================================
     12. PARTİKÜLLER
     -----------------------------------------------------------------------
     Tamamen dekoratif. CONFIG.options.particles = false ile kapanır.
     Toplam element sayısı particleCount'u (varsayılan 12) AŞMAZ.
     ========================================================================== */

  function setupParticles() {
    var layers = $$('[data-particles]');
    if (!layers.length) return;

    if (OPT.particles === false || prefersReducedMotion) {
      layers.forEach(function (layer) { layer.remove(); });
      return;
    }

    var budget = Math.max(0, Math.min(12, OPT.particleCount || 12));
    var perLayer = Math.floor(budget / layers.length);
    if (perLayer < 1) {
      layers.slice(1).forEach(function (layer) { layer.remove(); });
      layers = [layers[0]];
      perLayer = budget;
    }

    layers.forEach(function (layer) {
      var frag = document.createDocumentFragment();

      for (var i = 0; i < perLayer; i++) {
        var duration = randBetween(14, 26);
        var particle = el('span', { class: 'particle', 'aria-hidden': 'true' });

        particle.style.left = randBetween(2, 96).toFixed(1) + '%';
        particle.style.setProperty('--p-size', randBetween(3, 8).toFixed(1) + 'px');
        particle.style.setProperty('--p-dur', duration.toFixed(1) + 's');
        particle.style.setProperty('--p-x', randBetween(-6, 6).toFixed(1) + 'rem');
        particle.style.setProperty('--p-rise', randBetween(50, 105).toFixed(0) + 'vh');
        particle.style.setProperty('--p-opacity', randBetween(0.22, 0.6).toFixed(2));
        // Negatif gecikme: sayfa açılışında hepsi dağılmış halde başlar
        particle.style.setProperty('--p-delay', '-' + randBetween(0, duration).toFixed(1) + 's');

        frag.appendChild(particle);
      }

      layer.appendChild(frag);
    });
  }


  /* ==========================================================================
     13. PİKSEL DAVETİYE SAHNESİ
     -----------------------------------------------------------------------
     34 yıldız + 46 konfeti elemanını burada üretiyoruz; 80 <div>'i elle
     yazmamak için. Rastgele değerler SADECE BİR KEZ üretilir: bu fonksiyon
     init()'te tek sefer çalışır, ürettiği değerler inline style'a yazılır ve
     bir daha dokunulmaz. Sahne yeniden çizilse bile yıldızlar yerinden
     oynamaz (idempotent: `dd.__built` bayrağı ikinci üretimi engeller).

     Stil style.css 19. bölümde. Zaman çizelgesi (saniye):
       0.6 giriş · 4.0 buluşma · 4.2 kalp · 4.4 konfeti · 5.2 yazı

     Sahne kapı ekranının 2. aşamasında yaşıyor. CSS `animation-play-state:
     paused` ile bekler; kapı butonuna basılınca startPixelScene() .is-running
     ekler ve çizelge baştan akar. Yıldız/konfeti üretimi init'te yapılır ki
     tıklama anında ilk kare hazır olsun.
     ========================================================================== */

  var PIXEL_STAR_COUNT = 34;
  var PIXEL_CONFETTI_COUNT = 46;
  var PIXEL_CONFETTI_COLORS = ['#f2c9a8', '#d4566b', '#f7f1e8', '#e8b04b', '#a8c4d8'];

  function buildPixelScene(dd) {
    if (dd.__built) return;          // rastgele değerler bir kez üretilir
    dd.__built = true;

    var sky = $('.gokyuzu', dd);
    if (sky) {
      var starFrag = document.createDocumentFragment();
      for (var i = 0; i < PIXEL_STAR_COUNT; i++) {
        var star = el('div', { class: 'yildiz' });
        star.style.left = randBetween(0, 100).toFixed(1) + '%';
        // Yıldızlar sadece üst yarıda: 46% altı gökyüzü değil, ufuk çizgisi.
        star.style.top = randBetween(0, 46).toFixed(1) + '%';
        star.style.animationDelay = randBetween(0, 3).toFixed(2) + 's';
        starFrag.appendChild(star);
      }
      sky.appendChild(starFrag);
    }

    var box = $('.konfeti', dd);
    if (box) {
      var confettiFrag = document.createDocumentFragment();
      for (var j = 0; j < PIXEL_CONFETTI_COUNT; j++) {
        var piece = el('i');
        piece.style.left = randBetween(0, 100).toFixed(1) + '%';
        // Renk sırayla dağıtılıyor (rastgele değil) — beş renk eşit dursun
        piece.style.background = PIXEL_CONFETTI_COLORS[j % PIXEL_CONFETTI_COLORS.length];
        piece.style.animationDuration = randBetween(2.8, 5.4).toFixed(2) + 's';
        // 4.4s = konfetinin çizelgedeki başlangıcı; üstüne 0-5s dağılma
        piece.style.animationDelay = randBetween(4.4, 9.4).toFixed(2) + 's';
        confettiFrag.appendChild(piece);
      }
      box.appendChild(confettiFrag);
    }
  }

  // Yıldız/konfetiyi init'te üretiyoruz ki kapı butonuna basıldığı an sahne
  // hazır olsun; üretimi tıklamaya bırakmak ilk kareyi geciktirirdi.
  function setupPixelScene() {
    $$('[data-pixel-scene]').forEach(buildPixelScene);
  }

  // Çizelgenin toplam süresi: yazı 5.2s'te başlar + 1.4s belirme = 6.6s.
  // Üstüne kısa bir duruş ekliyoruz, sonra kapı kapanır.
  var PIXEL_SCENE_MS = 6600 + 900;

  function startPixelScene(onDone) {
    // Çok kısa viewport'ta CSS sahneyi display:none yapıyor (style.css 07).
    // O durumda 7.5 saniye boş beklemenin anlamı yok, kapı hemen kapansın.
    var scenes = $$('[data-pixel-scene]').filter(function (dd) {
      return dd.offsetParent !== null && dd.getBoundingClientRect().height > 0;
    });
    if (!scenes.length) { onDone(); return null; }

    scenes.forEach(function (dd) { dd.classList.add('is-running'); });
    return window.setTimeout(onDone, PIXEL_SCENE_MS);
  }


  /* ==========================================================================
     14. DEBUG PANELİ (?debug=1)
     -----------------------------------------------------------------------
     Manuel tarayıcı testi için: URL'de ?debug=1 yoksa bu fonksiyon hiçbir
     şey yapmaz (panel oluşturulmaz, DOM'a tek bir eleman bile eklenmez).
     CSS tamamen inline — style.css'e hiç dokunmuyoruz.
     ========================================================================== */

  function setupDebugPanel() {
    if (!debugMode) return;

    function truncateMiddle(str, keepStart, keepEnd) {
      str = str || '';
      if (str.length <= keepStart + keepEnd + 1) return str;
      return str.slice(0, keepStart) + '…' + str.slice(str.length - keepEnd);
    }

    function readSaved() {
      try { return JSON.parse(storeGet(LS_RSVP) || 'null'); } catch (e) { return null; }
    }

    function deadlineInfo() {
      var d = parseDate(C.rsvpDeadlineISO);
      if (!d) return 'yok';
      var passed = Date.now() > d.getTime();
      return d.toLocaleString('tr-TR') + (passed ? ' — GEÇTİ' : ' — açık');
    }

    var STAGE_LABELS = { A: 'A · fetch+json', B: 'B · sendBeacon', C: 'C · no-cors' };
    var OUTCOME_LABELS = {
      success: 'başarılı',
      optimistic: 'iyimser başarı',
      server_error: 'sunucu hatası',
      network_error: 'ağ hatası'
    };

    function stageInfo() {
      if (!rsvp.lastStage) return '— (henüz gönderim yok)';
      var stage = STAGE_LABELS[rsvp.lastStage] || rsvp.lastStage;
      var outcome = OUTCOME_LABELS[rsvp.lastOutcome] || rsvp.lastOutcome || '…';
      return stage + ' (' + outcome + ')';
    }

    // --- İskelet -------------------------------------------------------------
    var panel = el('div', {
      id: 'rsvp-debug-panel',
      style: 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;' +
        'background:rgba(15,15,20,.94);color:#e8e8ec;' +
        'font:11px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;' +
        'padding:8px 10px;display:flex;flex-wrap:wrap;gap:6px 16px;' +
        'align-items:center;border-top:1px solid rgba(255,255,255,.18);' +
        'max-height:42vh;overflow:auto;box-sizing:border-box'
    });

    var rows = el('div', {
      style: 'display:flex;flex-wrap:wrap;gap:4px 16px;flex:1 1 260px'
    });
    var actions = el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' });

    function field(label) {
      var wrap = el('div', { style: 'white-space:nowrap' });
      wrap.appendChild(el('b', { text: label + ': ', style: 'color:#9fd8ff;font-weight:600' }));
      var v = el('span', { text: '…' });
      wrap.appendChild(v);
      rows.appendChild(wrap);
      return v;
    }

    function button(label, onClick) {
      var b = el('button', {
        type: 'button',
        text: label,
        style: 'font:inherit;padding:3px 8px;border-radius:4px;' +
          'border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);' +
          'color:inherit;cursor:pointer'
      });
      b.addEventListener('click', onClick);
      actions.appendChild(b);
      return b;
    }

    var endpointField = field('endpoint');
    var deadlineField = field('deadline');
    var stageField = field('son fallback');
    var storedField = field('localStorage.rsvp');

    function refresh() {
      endpointField.textContent = truncateMiddle(C.rsvpEndpoint, 30, 12);
      deadlineField.textContent = deadlineInfo();
      stageField.textContent = stageInfo();

      var saved = readSaved();
      storedField.textContent = saved
        ? (saved.name + ' · ' + saved.attending + ' · ' + saved.guests + ' kişi · ' + saved.at)
        : 'yok';
    }

    // --- Aksiyonlar ------------------------------------------------------------
    button('localStorage temizle', function () {
      try { window.localStorage.removeItem(LS_RSVP); } catch (e) { /* yoksay */ }
      refresh();
    });

    var honeypotBtn = button('Honeypot doldur', function () {
      var input = $('#rsvp-website');
      if (!input) return;
      var wasFilled = input.value.trim() !== '';
      input.value = wasFilled ? '' : 'debug-bot';
      honeypotBtn.textContent = wasFilled ? 'Honeypot doldur' : 'Honeypot temizle';
    });

    button("Deadline'ı geçmiş yap", function () {
      // Sadece bellekte/DOM'da simüle eder — CONFIG.rsvpDeadlineISO'ya dokunmaz.
      var form = $('#rsvp-form');
      var note = $('#rsvp-note');
      var closedBlock = $('#rsvp-closed');
      if (form) form.hidden = true;
      if (note) note.classList.add('is-hidden');
      if (closedBlock) closedBlock.classList.remove('is-hidden');
      refresh();
    });

    panel.appendChild(rows);
    panel.appendChild(actions);
    document.body.appendChild(panel);

    refresh();
    window.setInterval(refresh, 2000);
  }


  /* ==========================================================================
     15. BAŞLAT
     ========================================================================== */

  function renderGreeting() {
    var block = $('#greeting');
    if (!block) return;
    // Param yoksa selamlama bloğu HİÇ render edilmesin
    if (!invitee.name) { block.remove(); return; }
    block.textContent = (T.greetingPrefix || 'Sayın') + ' ' + invitee.name + ',';
  }

  function init() {
    document.documentElement.classList.remove('no-js');

    fillTexts(document);
    fillDocumentTitle();
    renderGreeting();

    renderGate();
    renderHeroSlides();
    renderPhoto();

    setupAudioToggle();
    setupGate();
    setupHeroScroll();

    setupCountdown();
    setupCalendar();
    setupLocation();
    setupRsvp();

    setupReveal();
    setupParticles();
    setupPixelScene();
    setupDebugPanel();

    // Kapı ekranı yoksa (ör. elle kaldırıldıysa) slideshow yine başlasın
    if (!$('#gate')) startHeroSlideshow();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
