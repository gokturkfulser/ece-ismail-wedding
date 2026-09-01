ARKA PLAN MÜZİĞİ
================

Beklenen dosya:  assets/audio/music.mp3
CONFIG alanı:    CONFIG.audio.src

Bu dosya repoda YOK — telifli müzik dağıtılamaz, kendin eklemen gerekiyor.

Dosya yokken ne oluyor?
-----------------------
Site normal çalışır. app.js sesi çalmayı deneyip başarısız olunca sağ üstteki
mute/unmute butonunu tamamen gizler. Kapı ekranındaki "Müzik ile birlikte
açılır" ipucu da CONFIG.audio.src boşsa kaldırılır.

Müziği tamamen kapatmak istersen: config.js → audio.src = "" yap.

Önemli davranış
---------------
Dosya, kapı ekranındaki "DAVETİYEYİ AÇ" butonuna basılana kadar İNDİRİLMEZ.
Audio nesnesi o tıklamada kuruluyor (autoplay policy zaten kullanıcı jesti
şart koşuyor). Bu sayede ilk yüklemede birkaç MB boşa gitmiyor.

Dosya hazırlama (ffmpeg)
------------------------
Mobil için 96-128 kbps mono/stereo fazlasıyla yeterli. 3-4 dakikayı geçmesin,
loop'lu çalıyor.

  # Kırp (30. saniyeden itibaren 3 dakika), mono, 96 kbps
  ffmpeg -i kaynak.mp3 -ss 30 -t 180 -ac 1 -b:a 96k -map_metadata -1 music.mp3

  # Baş ve sonda 3 saniye fade (loop dönüşü daha yumuşak olur)
  ffmpeg -i kaynak.mp3 -ss 30 -t 180 -af "afade=t=in:st=0:d=3,afade=t=out:st=177:d=3" \
    -ac 1 -b:a 96k -map_metadata -1 music.mp3

  # Ses seviyesini normalize et (fade-in kodda yapılıyor, bu sadece tepe seviyesi)
  ffmpeg -i music.mp3 -af "loudnorm=I=-18:TP=-2" -b:a 96k music-normalized.mp3

Ses yüksekliği: config.js → audio.targetVolume (0-1 arası, varsayılan 0.45).
Fade-in süresi: config.js → audio.fadeInMs (varsayılan 2500 ms).

Telifsiz müzik kaynakları
-------------------------
  https://freemusicarchive.org        (lisansı tek tek kontrol et)
  https://pixabay.com/music/
  https://incompetech.com             (CC-BY, atıf gerekiyor)
