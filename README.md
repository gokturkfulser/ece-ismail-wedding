# Düğün Davetiyesi

Statik, tek sayfalık düğün davetiyesi. Build step yok — npm, bundler, framework
kullanılmıyor. Düz HTML + CSS + vanilla JS. GitHub Pages'te proje reposu olarak
(alt path altında) yayınlanmak üzere yazıldı.

Tüm içerik tek bir dosyadan geliyor: **`assets/js/config.js`**

---

## İçindekiler

1. [Dosya yapısı](#dosya-yapısı)
2. [Hızlı başlangıç](#hızlı-başlangıç)
3. [config.js — neyi nereye yazacaksın](#configjs--neyi-nereye-yazacaksın)
4. [Elle senkron tutulacak 2 yer](#elle-senkron-tutulacak-2-yer)
5. [GitHub Pages'i açma](#github-pagesi-açma)
6. [Apps Script deploy (RSVP backend)](#apps-script-deploy-rsvp-backend)
7. [Görsel hazırlama](#görsel-hazırlama)
8. [Müzik ve font](#müzik-ve-font)
9. [Kişiye özel davet linkleri](#kişiye-özel-davet-linkleri)
10. [Yerelde çalıştırma](#yerelde-çalıştırma)
11. [Sorun giderme](#sorun-giderme)

---

## Dosya yapısı

```
.
├── index.html              Tek sayfa. Semantik iskelet; içerik yok.
├── invite.ics              Takvim dosyası (statik — elle senkron, aşağıda)
├── apps-script.gs          RSVP backend (Google Apps Script'e yapıştırılacak)
├── .nojekyll               Pages'in Jekyll işlemesini kapatır
├── README.md
└── assets/
    ├── css/style.css       Tüm stil. :root'ta token'lar, bölüm bölüm yorumlu.
    ├── js/
    │   ├── config.js       ★ TEK İÇERİK KAYNAĞI — düzenlediğin dosya bu
    │   └── app.js          Tüm davranış (tek IIFE, harici bağımlılık yok)
    ├── fonts/README.txt    Font dosyalarını buraya at (şu an sistem fontu)
    ├── audio/README.txt    music.mp3 buraya (şu an repoda yok)
    └── img/                Görseller (şu an düz renk placeholder)
```

**Kritik kural:** Tüm yollar göreli (`assets/img/x.webp`). Başında `/` olan yol
proje reposunda (`https://kullanici.github.io/depo/`) **kırılır**. Yeni bir yol
eklerken buna dikkat et.

---

## Hızlı başlangıç

```bash
# 1. Yerelde aç
python3 -m http.server 8000
# → http://localhost:8000

# 2. assets/js/config.js dosyasını düzenle (isim, tarih, mekân, metinler)
# 3. Kendi fotoğraflarını assets/img/ içine koy (aynı dosya adlarıyla)
# 4. index.html <head> içindeki OG meta bloğunu elle güncelle
# 5. invite.ics içindeki tarihleri elle güncelle
# 6. Apps Script'i deploy et, /exec adresini config.js'e yaz
# 7. git push → GitHub Pages'i aç
```

---

## config.js — neyi nereye yazacaksın

`assets/js/config.js` tek düzenleyeceğin içerik dosyası. `index.html` içinde
hardcode isim/tarih/metin **yok**; her metin düğümü `data-text="yol"` ile
CONFIG'e bağlı.

| Alan | Ne yapar | Not |
|---|---|---|
| `bride`, `groom`, `coupleSeparator` | İsimler (kapı, üst fotoğraf, footer) | |
| `dateISO` | **Kaynak tarih.** Geri sayım + takvim linki bunu kullanır | ISO 8601, saat dilimi offset'i şart: `+03:00` |
| `endISO` | Takvim kaydının bitişi | Google Calendar ve .ics için gerekli |
| `dateLabel`, `timeLabel` | **Ekranda görünen** tarih/saat metni | Bilinçli olarak elle yazılıyor — WhatsApp içi eski WebView'larda `toLocaleDateString('tr-TR')` tutarsız çalışıyor. `dateISO`'yu değiştirince bunu da değiştir. |
| `venueName`, `venueAddress` | Mekân adı ve adresi | |
| `mapsQuery` | Harita embed'i + Google/Apple linkleri bundan kurulur | Google Maps'te arayıp sonuç veren metni yaz |
| `venueCoords` | `{lat, lng}` — Apple Maps ve Yandex rota linkleri | Google Maps'te sağ tık → koordinatı kopyala |
| `rsvpDeadlineISO` | Bu tarih geçtiyse form yerine "süre sona erdi" bloğu render edilir | `apps-script.gs` → `SETTINGS.DEADLINE_ISO` ile **aynı** olmalı |
| `rsvpEndpoint` | Apps Script Web App `/exec` adresi | Aşağıdaki deploy bölümüne bak |
| `maxGuests`, `messageMaxLength` | Form sınırları | Backend'de de sınır var |
| `text.*` | Bütün görünen metinler | Değiştirmek serbest; anahtar adını değiştirmezsen HTML'e dokunmana gerek yok |
| `text.inviteBody` | **Dizi** — her eleman bir `<p>` olur | İstediğin kadar paragraf ekle |
| `gate` | Kapı ekranı arka plan görseli | `portrait` = mobil, `landscape` = masaüstü |
| `photo` | Kapıdan sonra sayfanın en üstündeki tek görsel banner | `portrait` = mobil, `landscape` = masaüstü. Boş bırakırsan bölüm tamamen kalkar |
| `audio.src` | Müzik dosyası yolu | Boş bırakırsan müzik özelliği tamamen devre dışı |
| `audio.targetVolume` | 0–1 arası hedef ses seviyesi | Fade-in 0'dan buraya çıkar |
| `audio.fadeInMs` | Fade-in süresi (ms) | |
| `options.particles` | Dekoratif partikül katmanı | `false` = tamamen kapalı, element bile oluşmaz |
| `options.particleCount` | En fazla 12 | Sayfadaki tüm katmanlara bölünür |

### Tasarım değerleri

Renk / boşluk / font değerleri `assets/css/style.css` → `:root` bloğunda
custom property olarak toplandı. Tasarım geçişinde tek yer değiştirmek yeterli:

```css
:root {
  --c-bg: #f7f5f0;       /* kirli beyaz zemin */
  --c-accent: #1f3d2b;   /* koyu yeşil aksan */
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-body: "Jost", -apple-system, sans-serif;
  /* ... */
}
```

CSS bölüm bölüm numaralı yorumlarla ayrıldı (`01. FONTLAR`, `07. KAPI EKRANI`, …),
dosyanın en başında içindekiler var.

---

## Elle senkron tutulacak 2 yer

Build step olmadığı için bu ikisi CONFIG'den otomatik beslenemiyor.
**CONFIG'i değiştirdiğinde bunları da güncelle.**

### 1. `index.html` → `<head>` içindeki OG / Twitter meta bloğu

WhatsApp ve Twitter link önizlemesi bu etiketleri okuyor. Scraper JavaScript
çalıştırmadığı için değerler HTML'de statik olmak zorunda. İlgili satırlar
`CONFIG İLE EŞLE` yorumuyla işaretli:

```html
<title>Aybala Ece &amp; İsmail · 12 Haziran 2027</title>
<meta property="og:url"   content="https://KULLANICI.github.io/DEPO/">
<meta property="og:image" content="https://KULLANICI.github.io/DEPO/assets/img/og.png">
```

`og:url` ve `og:image` **tam URL** olmak zorunda — göreli yol burada çalışmaz.
`KULLANICI` ve `DEPO`'yu kendi değerlerinle değiştir.

> WhatsApp önizlemeyi agresif cache'ler. Değişiklikten sonra önizleme
> güncellenmezse linkin sonuna `?v=2` ekleyerek paylaş.

### 2. `invite.ics`

Tarih **UTC** olarak yazılıyor. Türkiye UTC+3 olduğu için yerel saatten
**3 saat çıkar**:

| config.js | invite.ics |
|---|---|
| `dateISO: "2027-06-12T18:30:00+03:00"` | `DTSTART:20270612T153000Z` |
| `endISO:  "2027-06-12T23:30:00+03:00"` | `DTEND:20270612T203000Z` |

Diğer kurallar:
- `LOCATION` ve `SUMMARY` içindeki virgüller `\,` olarak escape edilmeli (dosyada öyle).
- Satır sonları **CRLF** olmalı. Dosyayı düzenledikten sonra kontrol et:
  ```bash
  python3 -c "d=open('invite.ics','rb').read().replace(b'\r\n',b'\n').replace(b'\n',b'\r\n'); open('invite.ics','wb').write(d)"
  ```
- `UID` her etkinlik için tekil olmalı; tarihi değiştirirsen UID'yi de değiştir
  (yoksa takvim uygulaması eski kaydı günceller).

Google Calendar linki bunun aksine **runtime'da CONFIG'den kuruluyor** — orada
elle iş yok. Sayfada iki seçenek birlikte sunuluyor, user-agent sniffing yapılmıyor.

---

## GitHub Pages'i açma

1. Repoyu GitHub'a push et (public olmalı — private repo Pages için ücretli plan ister).
2. Repo → **Settings** → sol menüden **Pages**
3. **Source**: `Deploy from a branch`
4. **Branch**: `main`, klasör: `/ (root)` → **Save**
5. 1–2 dakika sonra site `https://KULLANICI.github.io/DEPO/` adresinde yayında.

Yayın durumunu **Actions** sekmesinden izleyebilirsin.

```bash
git add -A
git commit -m "davetiye sitesi"
git push
```

**Alt path uyarısı:** Site kök dizinde değil, `/DEPO/` altında çalışıyor.
Bu yüzden hiçbir yolda baştaki `/` olmamalı. `.nojekyll` dosyası repoda duruyor;
silme — Jekyll'in dosyaları işlemesini kapatıyor.

---

## Apps Script deploy (RSVP backend)

### 1. Sheets ve script

1. [sheets.new](https://sheets.new) ile yeni bir Google Sheets aç, adını
   "Düğün RSVP" yap.
2. **Uzantılar (Extensions)** → **Apps Script**
3. `Code.gs` içindeki her şeyi sil, repodaki **`apps-script.gs`** dosyasının
   tamamını yapıştır.
4. Dosyanın başındaki `SETTINGS` bloğunu doldur:

```js
var SETTINGS = {
  SHEET_NAME:   'RSVP',                          // sekme adı
  NOTIFY_EMAIL: 'senin@mailin.com',              // bildirim maili (boş = mail yok)
  DEADLINE_ISO: '2027-05-29T23:59:59+03:00',     // config.js ile AYNI olmalı
  // ...
};
```

5. Kaydet (Ctrl+S).

### 2. Test

Editörde fonksiyon seçicisinden **`testDoPost`** seç → **Run**.

- İlk çalıştırmada Google izin isteyecek: **Review permissions** →
  hesabını seç → "Google hasn't verified this app" ekranında
  **Advanced** → **Go to (proje adı) (unsafe)** → **Allow**.
  (Bu senin kendi script'in, uyarı normal.)
- Sheets'e bir test satırı düşmeli ve mail gelmeli.
- **`testHoneypot`**'u da çalıştır: `{"ok":true,"spam":true}` dönmeli ve
  Sheets'e **satır yazılmamalı**.

### 3. Deploy

1. Sağ üstte **Deploy** → **New deployment**
2. Dişli ikonu → tür olarak **Web app** seç
3. Ayarlar:

   | Alan | Değer |
   |---|---|
   | Description | `rsvp v1` |
   | **Execute as** | **Me** (senin hesabın) |
   | **Who has access** | **Anyone** |

   > `Anyone` şart. `Anyone with Google account` seçersen davetliler Google
   > hesabıyla giriş yapmak zorunda kalır ve `fetch` isteği CORS'ta ölür.

4. **Deploy** → verilen URL'yi kopyala. Şu formatta olacak:

   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

5. Bu adresi `assets/js/config.js` → `rsvpEndpoint` alanına yaz.

### 4. Doğrulama

`/exec` adresini tarayıcıda aç. Şunu görmelisin:

```json
{"ok":true,"service":"rsvp","ts":"..."}
```

Sonra siteden gerçek bir RSVP gönder ve Sheets'e düştüğünü kontrol et.

### Kodda değişiklik yaparsan

Apps Script'te kodu kaydetmek yeterli **değil**. Yeni sürümü yayınlaman gerekir:
**Deploy** → **Manage deployments** → kalem ikonu → **Version: New version** →
**Deploy**. URL aynı kalır, `config.js`'i tekrar düzenlemene gerek yok.

### Neden `text/plain`?

Frontend isteği `Content-Type: text/plain;charset=utf-8` ile atıyor.
`application/json` kullanılsaydı tarayıcı önce bir `OPTIONS` preflight isteği
atardı; Apps Script Web App `OPTIONS`'a cevap veremediği için istek CORS
hatasıyla ölürdü. `text/plain` "simple request" sayıldığı için preflight
olmuyor. Gövde JSON string'i olarak gidiyor, backend `JSON.parse` ile açıyor.
**Bu ikisini değiştirme.**

### Güvenlik notu

`Who has access: Anyone` demek endpoint'in herkese açık olduğu anlamına geliyor.
Korumalar:

- **Honeypot** (`website` alanı) — dolu gelirse sessizce yutuluyor, satır yazılmıyor.
- **Deadline kontrolü** hem frontend'de hem backend'de.
- **Uzunluk sınırları** ve gövde boyutu sınırı backend'de.
- **LockService** ile eşzamanlı `appendRow` yarışı engelleniyor.
- `doGet` kayıtları **döndürmüyor**, sadece sağlık kontrolü yapıyor.

CAPTCHA bilinçli olarak yok. Spam olursa `NOTIFY_EMAIL`'den görürsün; bir
düğün davetiyesinin trafiği CAPTCHA'yı hak etmiyor.

---

## Görsel hazırlama

Repoda şu an düz renk **placeholder** görseller var — site ilk açılışta kırık
görselle gelmiyor. Kendi fotoğraflarını **aynı dosya adlarıyla** üzerine yaz,
`config.js`'e dokunmana gerek kalmaz.

### Gereken dosyalar

| Dosya | Ölçü | Kullanım |
|---|---|---|
| `gate-portrait.webp` | 1080×1920 | Kapı ekranı, mobil |
| `gate-landscape.webp` | 1920×1080 | Kapı ekranı, masaüstü |
| `photo-portrait.webp` | 1080×1350 | Üst bölge fotoğrafı, mobil |
| `photo-landscape.webp` | 1600×1067 | Üst bölge fotoğrafı, masaüstü |
| `og.png` | 1200×630 | Sosyal medya kartı (WebP değil — scraper uyumu) |
| `favicon-32.png` | 32×32 | Favicon |
| `apple-touch-icon.png` | 180×180 | iOS ana ekran ikonu |
| `favicon.svg` | — | Vektör favicon (elle düzenlenebilir) |

### ffmpeg ile (tek araç, her şeyi yapar)

```bash
# --- Kapı ekranı ---
ffmpeg -i kapak.jpg -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  -c:v libwebp -q:v 82 gate-portrait.webp
ffmpeg -i kapak.jpg -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
  -c:v libwebp -q:v 82 gate-landscape.webp

# --- Üst bölge fotoğrafı: dikey kırpım (mobil) 1080x1350 ---
ffmpeg -i foto.jpg -vf "scale=1080:1350:force_original_aspect_ratio=increase,crop=1080:1350" \
  -c:v libwebp -q:v 80 photo-portrait.webp

# --- Üst bölge fotoğrafı: yatay kırpım (masaüstü) 1600x1067 ---
ffmpeg -i foto.jpg -vf "scale=1600:1067:force_original_aspect_ratio=increase,crop=1600:1067" \
  -c:v libwebp -q:v 80 photo-landscape.webp

# --- OG kartı (PNG, 1200x630) ---
ffmpeg -i kapak.jpg -vf "scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630" \
  -y og.png

# --- İkonlar ---
ffmpeg -i kapak.jpg -vf "scale=180:180:force_original_aspect_ratio=increase,crop=180:180" -y apple-touch-icon.png
ffmpeg -i kapak.jpg -vf "scale=32:32:force_original_aspect_ratio=increase,crop=32:32"    -y favicon-32.png
```

`crop` merkeze göre kırpar. Yüz ortada değilse offset ver — örneğin üstten
kırpmak için `crop=1080:1620:0:200` (son iki değer x ve y).

### cwebp ile (libwebp — daha iyi sıkıştırma)

`cwebp`, Google'ın referans WebP kodlayıcısı. Aynı kalitede ffmpeg'den
belirgin şekilde küçük dosya üretiyor. Kurulum:

```bash
# macOS
brew install webp
# Debian / Ubuntu
sudo apt install webp
# Windows (Chocolatey)
choco install webp
```

Kullanım — kırpma/ölçekleme cwebp'in kendi bayraklarıyla:

```bash
# Ölçekle + kalite 80 (yükseklik 0 = oranı koru)
cwebp -q 80 -resize 1600 0 foto.jpg -o photo-landscape.webp

# Kırp: -crop x_offset y_offset genişlik yükseklik  (ölçeklemeden ÖNCE uygulanır)
cwebp -q 80 -crop 0 300 3000 1687 -resize 1600 1067 foto.jpg -o photo-landscape.webp

# Metin/keskin kenar içeren görsellerde daha iyi sonuç
cwebp -q 82 -m 6 -sharp_yuv -resize 1080 1350 foto.jpg -o photo-portrait.webp
```

Toplu dönüştürme:

```bash
for f in ham/*.jpg; do
  n=$(basename "$f" .jpg)
  cwebp -q 80 -m 6 -resize 1600 0 "$f" -o "assets/img/${n}-landscape.webp"
  cwebp -q 80 -m 6 -resize 1080 0 "$f" -o "assets/img/${n}-portrait.webp"
done
```

### Dosya boyutu hedefleri

Trafiğin %95'i WhatsApp içi tarayıcıdan gelen telefon. Hedef:

- Kapı ekranı görseli: **< 200 KB** (LCP elemanı, en kritik dosya)
- Üst bölge fotoğrafı: **< 150 KB** / adet

Kontrol: `ls -lhS assets/img/`

### CLS ve öncelik

`config.js` içindeki `width`/`height` değerleri görselin **gerçek** ölçüsüyle
eşleşmeli — bunlar `<img>` etiketine yazılıyor ve layout shift'i (CLS) sıfırda
tutuyor. Ölçüyü değiştirirsen bu alanları da güncelle.

Kapı ekranı görseli `<head>` içindeki inline script ile `rel="preload"`
edilmiş (yol yine CONFIG'den okunuyor, ikinci hardcode yok) ve
`fetchpriority="high"` ile yükleniyor. Geri kalan tüm görseller
`loading="lazy"` + `decoding="async"`.

---

## Müzik ve font

İkisi de repoda yok, sen ekleyeceksin. **İkisi de eksikken site sorunsuz
çalışıyor** — kırık görsel/hata yok, sessiz fallback var.

- **Müzik:** `assets/audio/README.txt` — dosya adı, ffmpeg komutları,
  telifsiz kaynaklar. Dosya yoksa mute butonu hiç görünmüyor.
- **Font:** `assets/fonts/README.txt` — hangi 4 woff2 dosyası bekleniyor,
  `pyftsubset` ile Türkçe alt küme alma. Dosyalar yoksa sistem fontuna
  düşülüyor (Georgia / -apple-system).

Müzik dosyası kapı ekranındaki butona basılana kadar **indirilmiyor**;
`Audio` nesnesi o tıklamada kuruluyor. Ses 0'dan `audio.targetVolume`'a
`audio.fadeInMs` süresinde fade-in yapıyor, ani patlamıyor. Mute durumu
`localStorage` (`wed:muted`) içinde tutuluyor.

---

## Kişiye özel davet linkleri

URL query parametreleriyle her davetliye kişiselleştirilmiş link gönderebilirsin:

| Parametre | Etkisi |
|---|---|
| `?d=Ad Soyad` | Davetiye bölümünde "Sayın Ad Soyad," selamlaması + ad alanı ön-dolu |
| `?k=2` | Kişi sayısı alanı ön-dolu |

İkisi de RSVP payload'ındaki `ref` alanına yazılıyor, yani Sheets'te hangi
linkten geldiğini görüyorsun.

```
https://KULLANICI.github.io/DEPO/?d=Ay%C5%9Fe%20Y%C4%B1lmaz&k=2
https://KULLANICI.github.io/DEPO/?d=Mehmet%20Kaya&k=4
```

Parametre yoksa selamlama bloğu **hiç render edilmiyor** (boş satır kalmıyor).

Türkçe karakterler URL-encode edilmeli. Toplu link üretmek için:

```bash
python3 - <<'PY'
import urllib.parse
BASE = "https://KULLANICI.github.io/DEPO/"
davetliler = [("Ayşe Yılmaz", 2), ("Mehmet Kaya", 4), ("Zeynep Demir", 1)]
for ad, kisi in davetliler:
    q = urllib.parse.urlencode({"d": ad, "k": kisi})
    print(f"{ad}\t{BASE}?{q}")
PY
```

---

## Yerelde çalıştırma

`file://` ile açma — `fetch`, `localStorage` ve harita iframe'i düzgün
çalışmaz. Basit bir HTTP sunucusu yeterli:

```bash
# Python 3 (her yerde var)
python3 -m http.server 8000
# Windows'ta:  py -m http.server 8000

# → http://localhost:8000
```

Telefondan test etmek için (aynı Wi-Fi ağında):

```bash
python3 -m http.server 8000 --bind 0.0.0.0
# Bilgisayarın yerel IP'sini bul (ör. 192.168.1.20), telefondan:
# http://192.168.1.20:8000
```

Gerçek cihazda test etmeye değer: iOS Safari'de `100dvh`, autoplay davranışı
ve WhatsApp içi WebView masaüstü tarayıcıdan farklı davranıyor.

### Neyi test et

- [ ] Kapı ekranı: butona basınca fade-out oluyor, müzik yumuşak giriyor
- [ ] Mute butonu çalışıyor, sayfa yenilenince durum korunuyor
- [ ] Geri sayım doğru, saniyeler iki haneli
- [ ] `?d=Test%20Kullanıcı&k=3` → selamlama ve ön-dolu alanlar
- [ ] RSVP gönderimi Sheets'e düşüyor, mail geliyor
- [ ] Aynı tarayıcıda tekrar açınca "Cevabınızı aldık" bloğu geliyor
- [ ] Uçak moduyla gönder → anlaşılır Türkçe hata + "Tekrar dene"
- [ ] `rsvpDeadlineISO`'yu geçmiş bir tarihe çek → "süre sona erdi" bloğu
- [ ] Harita iframe'i ve 3 dış harita linki doğru yere gidiyor
- [ ] Takvime Ekle: Google linki ve .ics indirmesi
- [ ] İşletim sisteminde "hareketi azalt" açıkken animasyonlar duruyor
- [ ] Klavye ile `Tab` gezinmesi: her odakta görünür bir çerçeve var

---

## Sorun giderme

**Site açılıyor ama boş / metin yok**
`config.js` yüklenememiş. Tarayıcı konsoluna bak. En sık nedeni `config.js`
içinde bir syntax hatası (eksik virgül, kapanmayan tırnak) — dosya parse
edilemeyince `window.CONFIG` tanımsız kalıyor.

**Görseller kırık**
Yolda baştaki `/` var mı? `assets/...` doğru, `/assets/...` proje reposunda
kırılır. Bir de dosya adı büyük/küçük harf duyarlı — Pages'te Linux çalışıyor,
Windows'ta çalışan `Photo-1.webp` orada bulunamaz.

**RSVP gönderilmiyor — konsolda CORS hatası**
1. `Who has access` **Anyone** mı? (`Anyone with Google account` olmaz)
2. `rsvpEndpoint` `/exec` ile mi bitiyor? (`/dev` ile bitiyorsa yanlış URL)
3. `app.js` içindeki `Content-Type` hâlâ `text/plain;charset=utf-8` mı?
4. Kodu değiştirdiysen **yeni sürüm** deploy ettin mi? (kaydetmek yetmiyor)

**RSVP "kaydedilemedi" diyor ama CORS hatası yok**
Backend `ok:false` dönüyor. Apps Script → **Executions** sekmesinden hata
kaydına bak. Muhtemel nedenler: `deadline_passed` (DEADLINE_ISO geçmiş),
`invalid_name` (3 karakterden kısa), `invalid_guests` (aralık dışı).

**Mail gelmiyor**
`NOTIFY_EMAIL` dolu mu? Spam klasörüne bak. Ücretsiz Gmail hesabında
`MailApp` günlük 100 mail kotasına sahip. Kaydın kendisi mail hatasından
etkilenmiyor, satır Sheets'e yine yazılıyor.

**Müzik çalmıyor**
`assets/audio/music.mp3` var mı? Cihaz sessiz modda mı? iOS'ta fiziksel sessiz
anahtarı `<audio>` elementini de susturuyor. Mute butonu hiç görünmüyorsa dosya
yüklenemedi demektir.

**WhatsApp önizlemesi eski / yok**
`og:url` ve `og:image` tam URL mi? WhatsApp önizlemeyi uzun süre cache'liyor;
linke `?v=2` ekleyerek yeni paylaşım yap.

**Geri sayım yanlış**
`dateISO`'da saat dilimi offset'i var mı? `"2027-06-12T18:30:00"` (offset'siz)
farklı cihazlarda farklı yorumlanıyor. `+03:00` şart.

---

## Teknik notlar

- Harici JS kütüphanesi yok, `<script src>` sadece kendi iki dosyamıza bakıyor.
- Animasyonlar **yalnızca** `transform` ve `opacity` üzerinde
  (`width`/`top`/`left`/`filter`/`box-shadow` animasyonu yok — kompozitör
  dışına çıkmıyor, mobilde jank yapmıyor).
- `@media (prefers-reduced-motion: reduce)` içinde partiküller ve
  scroll reveal kapalı.
- Scroll reveal `IntersectionObserver` ile, tek seferlik — eleman göründükten
  sonra `unobserve` ediliyor.
- `localStorage` erişimi `try/catch` içinde — gizli sekmede ve kısıtlı
  WebView'larda exception atabiliyor.
- RSVP isteğinde 15 saniyelik `AbortController` timeout'u var; takılı kalan
  istek yerine anlaşılır bir hata mesajı gösteriliyor.
- Çift submit iki katmanla engelli: buton `disabled` + `rsvp.submitting` flag'i.
