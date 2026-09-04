# Düğün davetiyesi — pixel animasyon bileşeni

## İçerik
- `davetiye.html` — referans uygulama. Yorum satırlarıyla işaretli bölüm siteye taşınacak.
- `davetiye.css` — bileşenin tüm stili. Her kural `.dugun-davetiye` altında kapsüllü.
- `img/gelin.png` (68×114), `img/damat.png` (68×142) — ana sprite'lar
- `img/gelin-blink.png`, `img/damat-blink.png` — göz kapalı kareler, aynı boyut

## Bozulmaması gereken üç şey
1. **Ölçek oranı 5:4.** Gelin `68 * --unit`, damat `68 * --unit * 0.8`.
   İkisi farklı çözünürlükte çizildi; bu çarpan boylarını eşitliyor.
   Tek ölçek kolu `--unit`, sadece onu değiştir.
2. **`image-rendering: pixelated`.** Kalkarsa tarayıcı pikselleri yumuşatır,
   pixel art bulanık bir çizime döner.
3. **`steps()` zamanlama.** Sürekli hareket karakteri piksel gridinin arasına
   düşürür ve kenarlar titrer. `steps()` hareketi kareli tutar.

## İsim ve tarih
Aybala Ece ve İsmail — 26 Eylül 2026, Cumartesi. Yer tutucu kalmadı.

## Zaman çizelgesi (saniye)
0.6 giriş başlar · 4.0 buluşma · 4.2 kalp · 4.4 konfeti · 5.2 yazı
