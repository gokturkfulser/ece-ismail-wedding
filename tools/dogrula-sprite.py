#!/usr/bin/env python3
"""
Piksel sprite denetleyici.

Piksel davetiye sahnesinin sprite'larını ortak grid kurallarına göre denetler
(bkz. assets/css/style.css 19. bölüm). Üret-kontrol-düzelt turunu kısaltmak için.

Kullanım:
    python tools/dogrula-sprite.py yeni-damat.png
    python tools/dogrula-sprite.py yeni-damat.png --bekle 49x103
    python tools/dogrula-sprite.py yeni-damat-blink.png --kirpma-esi yeni-damat.png
    python tools/dogrula-sprite.py yeni-damat.png --indir cikti.png

Notlar:
  --indir  Görsel, hedef ölçünün TAM SAYI katıysa kayıpsız indirir (her bloktan
           tek piksel alır; yeniden örnekleme YOK). Tam kat değilse reddeder.
"""

import argparse
import collections
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow gerekli:  pip install Pillow")

MAX_RENK = 24          # paylasilan palet ust siniri
MIN_UZUV_KALINLIK = 2  # kol/bacak en az 2px

OK, UYARI, HATA = "  OK  ", " UYARI", " HATA "


class Rapor:
    def __init__(self):
        self.satirlar = []
        self.hata = 0
        self.uyari = 0

    def ekle(self, durum, baslik, detay=""):
        if durum is HATA:
            self.hata += 1
        elif durum is UYARI:
            self.uyari += 1
        self.satirlar.append((durum, baslik, detay))

    def yaz(self):
        for durum, baslik, detay in self.satirlar:
            print(f"[{durum}] {baslik}")
            if detay:
                for d in str(detay).splitlines():
                    print(f"          {d}")
        print()
        if self.hata:
            print(f"SONUC: {self.hata} hata, {self.uyari} uyari -> KULLANILAMAZ")
        elif self.uyari:
            print(f"SONUC: {self.uyari} uyari, hata yok -> kullanilabilir, bakmaya deger")
        else:
            print("SONUC: temiz")
        return 1 if self.hata else 0


def blok_olcegi(im):
    """Goruntu, kucuk bir gridin tam sayi katiysa o kati bulur; yoksa None."""
    w, h = im.size
    px = im.load()
    adaylar = [n for n in range(2, min(w, h) + 1) if w % n == 0 and h % n == 0]
    for n in sorted(adaylar, reverse=True):
        tekduze = True
        for by in range(0, h, n):
            for bx in range(0, w, n):
                ilk = px[bx, by]
                for y in range(by, by + n):
                    for x in range(bx, bx + n):
                        if px[x, y] != ilk:
                            tekduze = False
                            break
                    if not tekduze:
                        break
                if not tekduze:
                    break
            if not tekduze:
                break
        if tekduze:
            return n
    return None


def kayipsiz_indir(im, n):
    """n x n bloklardan tek piksel alarak kayipsiz indirir."""
    w, h = im.size
    px = im.load()
    kucuk = Image.new("RGBA", (w // n, h // n))
    kpx = kucuk.load()
    for y in range(h // n):
        for x in range(w // n):
            kpx[x, y] = px[x * n, y * n]
    return kucuk


def uzuv_kalinlik_kontrol(im):
    """En ince opak yatay kesit genisligini bulur (kol/bacak kalinligi ipucu)."""
    w, h = im.size
    a = im.getchannel("A").load()
    en_ince = None
    for y in range(h):
        kosu = 0
        for x in range(w):
            if a[x, y] > 0:
                kosu += 1
            else:
                if 0 < kosu:
                    en_ince = kosu if en_ince is None else min(en_ince, kosu)
                kosu = 0
        if kosu:
            en_ince = kosu if en_ince is None else min(en_ince, kosu)
    return en_ince


def denetle(yol, bekle=None, kirpma_esi=None, indir=None):
    r = Rapor()
    try:
        im = Image.open(yol)
    except Exception as e:
        print(f"[{HATA}] Dosya acilamadi: {e}")
        return 1

    alpha_kanali_var = "A" in im.getbands()
    if im.format != "PNG":
        r.ekle(HATA, f"Format PNG degil: {im.format}",
               "JPEG kayipli: sert piksel kenarlarini bozar ve alpha tasimaz.")
    if not alpha_kanali_var:
        r.ekle(HATA, f"Kaynakta ALPHA KANALI YOK (mod: {im.mode})",
               "Saydamlik hic yok. Arka plan piksel olarak gomulmus; satranc "
               "deseni gorunuyorsa o da cizilmis, gercek saydamlik degil.")
    im = im.convert("RGBA")
    w, h = im.size
    print(f"\n=== {yol}  ({w}x{h}) ===\n")

    # --- olcu / grid -------------------------------------------------------
    hedef = None
    if bekle:
        try:
            hedef = tuple(int(v) for v in bekle.lower().split("x"))
        except Exception:
            sys.exit("--bekle formati: 49x103")

    n = None
    if hedef and (w, h) != hedef:
        n = blok_olcegi(im)
        if n and (w // n, h // n) == hedef:
            r.ekle(UYARI, f"Olcu {w}x{h}, beklenen {hedef[0]}x{hedef[1]}",
                   f"AMA goruntu tam {n}x buyutulmus -> kayipsiz indirilebilir.\n"
                   f"Sunu calistir:  python tools/dogrula-sprite.py {yol} --indir cikti.png")
        elif n:
            r.ekle(HATA, f"Olcu {w}x{h}, beklenen {hedef[0]}x{hedef[1]}",
                   f"Tam {n}x buyutulmus ama kaynak {w//n}x{h//n} cikiyor, hedef degil.")
        else:
            r.ekle(HATA, f"Olcu {w}x{h}, beklenen {hedef[0]}x{hedef[1]}",
                   "Tam sayi buyutme de degil -> kucultmek piksel gridini bozar. "
                   "Yeniden, dogru olcude uretilmeli.")
    elif hedef:
        r.ekle(OK, f"Olcu tam istenen: {w}x{h}")

    if not hedef:
        n = blok_olcegi(im)
        if n:
            r.ekle(UYARI, f"Goruntu tam {n}x buyutulmus gorunuyor",
                   f"Gercek grid {w//n}x{h//n}. Kayipsiz indirilebilir.")

    # --- indirme istendi mi ------------------------------------------------
    if indir:
        n2 = n or blok_olcegi(im)
        if not n2:
            r.ekle(HATA, "Kayipsiz indirilemez", "Tam sayi blok yapisi bulunamadi.")
        else:
            kucuk = kayipsiz_indir(im, n2)
            kucuk.save(indir)
            r.ekle(OK, f"Kayipsiz indirildi: {indir} ({kucuk.size[0]}x{kucuk.size[1]}, {n2}x blok)")
            im = kucuk
            w, h = im.size

    # --- alpha ikili mi ----------------------------------------------------
    alfa = collections.Counter(p[3] for p in im.getdata())
    kismi = sum(c for a, c in alfa.items() if 0 < a < 255)
    if not alpha_kanali_var:
        pass          # yukarida HATA olarak bildirildi, tekrar etmiyoruz
    elif kismi:
        r.ekle(HATA, f"Alpha ikili degil: {kismi} pikselde kismi saydamlik "
                     f"(%{100*kismi/(w*h):.1f})",
               "Anti-aliasing var. Kenarlar buyutuldugunde bulanik/hayalet cikar.")
    else:
        r.ekle(OK, "Alpha ikili (sadece 0 ve 255) - anti-aliasing yok")

    saydam = alfa.get(0, 0)
    if saydam == 0:
        r.ekle(HATA, "Hic saydam piksel yok",
               "Arka plan duz renk (ornegin beyaz) olarak gomulmus. "
               "Sahnede karakterin arkasinda dikdortgen cikar.")
    else:
        r.ekle(OK, f"Saydam arka plan var ({saydam} piksel, %{100*saydam/(w*h):.0f})")

    # --- palet -------------------------------------------------------------
    opak = [p[:3] for p in im.getdata() if p[3] == 255]
    renkler = collections.Counter(opak)
    if len(renkler) > MAX_RENK:
        ilk8 = sum(v for _, v in renkler.most_common(8))
        r.ekle(UYARI, f"Palet {len(renkler)} renk (ust sinir {MAX_RENK})",
               f"En sik 8 renk gorselin %{100*ilk8/len(opak):.0f}'ini kapliyor. "
               f"Gercek pixel art'ta bu oran %85+ olur.\n"
               f"Not: yuksek renk sayisi tek basina kusur degil - kasitli "
               f"golgelendirme de olabilir. Yakin tonlari birlestirmeye deger.")
    else:
        r.ekle(OK, f"Palet {len(renkler)} renk")

    # --- yerlesim: ayaklar en alt satirda, bas en ust satirda -------------
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        r.ekle(HATA, "Goruntu tamamen saydam")
    else:
        x0, y0, x1, y1 = bbox
        if y0 != 0:
            r.ekle(HATA, f"Ust bosluk var: {y0}px", "Basin tepesi 0. satirda olmali.")
        else:
            r.ekle(OK, "Basin tepesi 0. satirda")
        if y1 != h:
            r.ekle(HATA, f"Alt bosluk var: {h-y1}px",
                   "Ayaklar en alt satirda olmali, yoksa karakter zemin cizgisinin "
                   "uzerinde havada durur.")
        else:
            r.ekle(OK, "Ayaklar en alt satirda")
        r.ekle(OK, f"Icerik sinir kutusu: x {x0}-{x1}, y {y0}-{y1}")

    # --- uzuv kalinligi ----------------------------------------------------
    ince = uzuv_kalinlik_kontrol(im)
    if ince is not None and ince < MIN_UZUV_KALINLIK:
        r.ekle(UYARI, f"En ince opak kesit {ince}px",
               f"{MIN_UZUV_KALINLIK}px altindaki uzuvlar buyutuldugunde dagilir.")
    elif ince is not None:
        r.ekle(OK, f"En ince opak kesit {ince}px")

    # --- kirpma karesi karsilastirmasi ------------------------------------
    if kirpma_esi:
        try:
            esi = Image.open(kirpma_esi).convert("RGBA")
        except Exception as e:
            r.ekle(HATA, f"Kirpma esi acilamadi: {e}")
        else:
            if esi.size != im.size:
                r.ekle(HATA, f"Kirpma esi ile olcu farkli: {esi.size} vs {im.size}",
                       "Iki kare ayni olcude olmak zorunda.")
            else:
                a, b = list(esi.getdata()), list(im.getdata())
                fark = [(i % w, i // w) for i, (p, q) in enumerate(zip(a, b)) if p != q]
                if not fark:
                    r.ekle(HATA, "Iki kare birebir ayni", "Goz kirpma karesi yok.")
                else:
                    xs = [d[0] for d in fark]
                    ys = [d[1] for d in fark]
                    oran = 100 * len(fark) / (w * h)
                    detay = (f"{len(fark)} piksel farkli (%{oran:.1f})\n"
                             f"fark kutusu: x {min(xs)}-{max(xs)}, y {min(ys)}-{max(ys)}\n"
                             f"dikey konum: ust %{100*min(ys)/h:.0f} - %{100*max(ys)/h:.0f}")
                    # goz bandi kabaca ust %20-35
                    if min(ys) < 0.12 * h or max(ys) > 0.45 * h:
                        r.ekle(HATA, "Fark goz bandinin disina tasiyor", detay +
                               "\nGoz disinda da pikseller degismis; kirpma aninda "
                               "yuz/sac oynar. Sadece goz pikselleri degismeli.")
                    elif oran > 5:
                        r.ekle(UYARI, "Fark goz bandinda ama genis", detay)
                    else:
                        r.ekle(OK, "Fark yalnizca goz bandinda", detay)

    return r.yaz()


def main():
    ap = argparse.ArgumentParser(description="Piksel sprite denetleyici")
    ap.add_argument("dosya")
    ap.add_argument("--bekle", help="beklenen olcu, or. 49x103")
    ap.add_argument("--kirpma-esi", help="karsilastirilacak ana kare (goz acik hali)")
    ap.add_argument("--indir", help="tam sayi buyutmeyse kayipsiz indirip buraya yaz")
    a = ap.parse_args()
    sys.exit(denetle(a.dosya, a.bekle, a.kirpma_esi, a.indir))


if __name__ == "__main__":
    main()
