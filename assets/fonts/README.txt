FONTLAR
=======

Harici CDN kullanılmıyor; fontlar bu dizinden servis ediliyor.
assets/css/style.css içindeki @font-face tanımları TAM OLARAK şu dosya
adlarını bekliyor:

  cormorant-garamond-400.woff2     (başlıklar, serif)
  cormorant-garamond-600.woff2
  jost-400.woff2                   (gövde metni, sans)
  jost-500.woff2

Bu dizin BOŞSA site kırılmaz: @font-face sessizce başarısız olur ve CSS'teki
sistem font zincirine düşülür (Georgia / -apple-system vb.). Yani şu an
çalışıyor, sadece fontlar sistem fontu.

Nereden indirilir
-----------------
İkisi de SIL Open Font License (OFL) altında, ticari kullanım dahil serbest:

  Cormorant Garamond : https://fonts.google.com/specimen/Cormorant+Garamond
  Jost               : https://fonts.google.com/specimen/Jost

Google Fonts'tan indirdiğinde .ttf gelir. woff2'ye çevirmek ve yalnızca
gereken karakterleri (Türkçe + Latin) bırakmak için:

  pip install fonttools brotli

  # Türkçe dahil Latin alt kümesi + woff2
  pyftsubset CormorantGaramond-Regular.ttf \
    --output-file=cormorant-garamond-400.woff2 \
    --flavor=woff2 \
    --layout-features="kern,liga" \
    --unicodes="U+0000-00FF,U+0100-017F,U+0180-024F,U+2000-206F,U+20A0-20BF,U+2122,U+2190-2193"

Aynı komutu 4 dosya için tekrarla (Regular/SemiBold, Jost Regular/Medium).
Türkçe için kritik karakterler: ç Ç ğ Ğ ı I İ ö Ö ş Ş ü Ü — yukarıdaki
Latin Extended-A aralığı (U+0100-017F) bunları kapsar.

Alt küme almadan da atabilirsin, sadece dosyalar büyük olur (~60-120 KB
yerine ~25 KB). Mobil öncelikli bir sitede alt küme almaya değer.

Font değiştirmek istersen
-------------------------
1. woff2 dosyalarını buraya at.
2. assets/css/style.css → "01. FONTLAR" bölümündeki dosya adlarını güncelle.
3. Aynı dosyada :root içindeki --font-display / --font-body değerlerini güncelle.
