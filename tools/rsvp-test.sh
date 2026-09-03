#!/usr/bin/env bash
# =============================================================================
# RSVP BACKEND TEST — Apps Script Web App'i tek komutla uçtan uca test eder
# -----------------------------------------------------------------------------
# Kullanım: ENDPOINT ve TOKEN'ı doldur, sonra:
#   ./tools/rsvp-test.sh
#
# NOT: Aşağıdaki beklenen hata kodları (invalid_name, invalid_attending,
# forbidden, no_body) canlıda deploy edilmiş script'e göre yazıldı. Bu repodaki
# apps-script.gs bunlarla BİREBİR EŞLEŞMİYOR (örn. orada boş gövde hatası
# "empty_body", "no_body" değil; token kontrolü de repo dosyasında hiç yok).
# Yani Apps Script editöründeki canlı kod, bu repodaki dosyadan ileride —
# repo dosyasını canlı koddan senkronize etmeyi unutma.
#
# CURL TUZAĞI — -X POST KULLANMA: Apps Script /exec bir POST'u 302 ile
# script.googleusercontent.com'a yönlendiriyor (asıl işi — Sheet'e yazma vs. —
# script.google.com üzerindeki bu ilk POST sırasında zaten yapıyor; yönlendirme
# sadece önceden üretilmiş JSON çıktısını çekiyor). `-L` verilince curl normalde
# 302'de POST'u GET'e çevirip gövdeyi bırakır — googleusercontent tarafı da
# zaten GET bekliyor. Ama `-X POST` ile metodu ZORLARSAN curl yönlendirmede de
# POST'ta ısrar eder, gövdeyi göndermez, karşı taraf da gövdesiz POST'a
# "411 Length Required" ile HTML döner. Çözüm: `-X POST` yazma, `--data-binary`
# zaten POST'u ima ediyor, yönlendirmede GET'e dönüşmesine izin ver.
#
# KODLAMA — NEDEN --data-binary @dosya VE ensure_ascii=True: Payload'lar artık
# inline -d ile bash string'i içine yazılmıyor; her biri Python'la ayrı bir
# dosyaya yazılıp --data-binary @dosya ile gönderiliyor. json.dumps(...,
# ensure_ascii=True) çıktısı SADECE ASCII (Türkçe karakterler Ş gibi
# escape'lere dönüşür) — böylece bash/terminal/dosya kodlaması hiçbir aşamada
# devreye girmiyor, tel üzerinde giden byte'lar baştan belirli. Bunun ayrıca
# yan faydası: bu makinede `python3 -c "print('İ')"` gibi çıktısı doğrudan
# konsola/dosyaya UTF-8 olmayan bir karaktere basmaya çalışan komutlar cp1252
# konsol kod sayfası yüzünden UnicodeEncodeError ile çöküyor (bkz. TEŞHİS 3,
# 2026-09-03) — ensure_ascii=True çıktısı saf ASCII olduğu için bu çökme hiç
# oluşmuyor.
#
# SHEET KİRLENMESİ: "OLMASI gereken" senaryolar token doğruysa GERÇEK Sheet'e
# satır yazar. Prod tablonu test verisiyle kirletmek istemiyorsan bu script'i
# ayrı bir test deployment'ına karşı çalıştır.
# =============================================================================

set -uo pipefail

ENDPOINT="https://script.google.com/macros/s/AKfycbwEVvubY2riRLlo3JtEtzif9TDDpjSJQihDZJHfdvXlm-fSoMKsSEgbwtqnrVloU3jHxQ/exec"
TOKEN="dugun2027"

PASS=0
FAIL=0

# Ref etiketi olan senaryolardan Sheet'e satır düşmesi BEKLENEN / BEKLENMEYEN
# olanların listesi — script sonunda gözle karşılaştırma için tekrar basılıyor.
SHOULD_WRITE_REFS=(test-02 test-03 test-04a test-04b test-10 test-11 test-12)
SHOULD_NOT_WRITE_REFS=(test-05 test-06 test-07 test-08 test-09 "test-13 (govde bos, ref hic gonderilmedi)")

PAYLOAD_DIR="$(mktemp -d)"
trap 'rm -rf "$PAYLOAD_DIR"' EXIT

echo "UYARI: Bu calistirma Sheet'e ${#SHOULD_WRITE_REFS[@]} yeni satir yazacak (ref: ${SHOULD_WRITE_REFS[*]})."
echo "Onceki test calistirmalarindan kalan satirlari sildin mi? 3 saniye icinde Ctrl+C ile durdurabilirsin."
sleep 3

post_file() {
  # -X POST YOK — yukarıdaki "CURL TUZAĞI" notuna bak.
  curl -sL "$ENDPOINT" -H 'Content-Type: text/plain;charset=utf-8' --data-binary @"$1"
}

check() {
  # check <senaryo adı> <yanıt> <beklenen regex>
  local name="$1" resp="$2" expect="$3"
  if echo "$resp" | grep -qE "$expect"; then
    echo "PASS  $name"
    echo "      -> $resp"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $name"
    echo "      beklenen : $expect"
    echo "      gelen    : $resp"
    FAIL=$((FAIL + 1))
  fi
}

echo "== 1. GET saglik kontrolu =="
check "1. GET saglik kontrolu" "$(curl -sL "$ENDPOINT")" '"ok":true'

echo
echo "== POST senaryolari =="

# --- 2. Geliyor, 2 kisi, mesajli --------------------------------------------
f="$PAYLOAD_DIR/02.json"
python3 - "$TOKEN" > "$f" <<'PY'
import json, sys
token = sys.argv[1]
print(json.dumps({
    "token": token,
    "name": "Test 02 Geliyor",
    "attending": "yes",
    "guests": 2,
    "message": "backend denemesi",
    "ref": "test-02"
}, ensure_ascii=True))
PY
check "2. Geliyor, 2 kisi, mesajli" "$(post_file "$f")" '"ok":true'

# --- 3. Gelemiyor, mesajsiz --------------------------------------------------
f="$PAYLOAD_DIR/03.json"
python3 - "$TOKEN" > "$f" <<'PY'
import json, sys
token = sys.argv[1]
print(json.dumps({
    "token": token,
    "name": "Test 03 Gelemiyor",
    "attending": "no",
    "guests": 1,
    "ref": "test-03"
}, ensure_ascii=True))
PY
check "3. Gelemiyor, mesajsiz" "$(post_file "$f")" '"ok":true'

# --- 4a. Turkce karakterli ad — Latin-1 kapsamindakiler (u o c U O C) -------
f="$PAYLOAD_DIR/04a.json"
python3 - "$TOKEN" > "$f" <<'PY'
import json, sys
token = sys.argv[1]
print(json.dumps({
    "token": token,
    "name": "Test 04a Latin1 ü ö ç Ü Ö Ç",
    "attending": "yes",
    "guests": 1,
    "message": "ü ö ç Ü Ö Ç",
    "ref": "test-04a"
}, ensure_ascii=True))
PY
check "4a. Turkce (Latin-1 kapsami: uocUOC)" "$(post_file "$f")" '"ok":true'

# --- 4b. Turkce'ye ozgu karakterler (g s i I G S) ---------------------------
f="$PAYLOAD_DIR/04b.json"
python3 - "$TOKEN" > "$f" <<'PY'
import json, sys
token = sys.argv[1]
print(json.dumps({
    "token": token,
    "name": "Test 04b Türkçe ğ ş ı İ Ğ Ş",
    "attending": "yes",
    "guests": 1,
    "message": "ğ ş ı İ Ğ Ş",
    "ref": "test-04b"
}, ensure_ascii=True))
PY
check "4b. Turkce'ye ozgu (gsiIGS)" "$(post_file "$f")" '"ok":true'

# --- 5. Ad bos ---------------------------------------------------------------
# name alani testin KONUSU oldugu icin (bos olmasi gerekiyor) senaryo
# numarasi isme eklenemiyor — kimlik sadece ref'te tasiniyor.
f="$PAYLOAD_DIR/05.json"
python3 - "$TOKEN" > "$f" <<'PY'
import json, sys
token = sys.argv[1]
print(json.dumps({
    "token": token,
    "name": "",
    "attending": "yes",
    "guests": 1,
    "ref": "test-05"
}, ensure_ascii=True))
PY
check "5. Ad bos" "$(post_file "$f")" '"ok":false.*"error":"invalid_name"'

# --- 6. Ad tek karakter -------------------------------------------------------
# Ayni sebeple: isim testin konusu, "A" olarak kalmali.
f="$PAYLOAD_DIR/06.json"
python3 - "$TOKEN" > "$f" <<'PY'
import json, sys
token = sys.argv[1]
print(json.dumps({
    "token": token,
    "name": "A",
    "attending": "yes",
    "guests": 1,
    "ref": "test-06"
}, ensure_ascii=True))
PY
check "6. Ad tek karakter" "$(post_file "$f")" '"ok":false.*"error":"invalid_name"'

# --- 7. attending gecersiz -----------------------------------------------------
f="$PAYLOAD_DIR/07.json"
python3 - "$TOKEN" > "$f" <<'PY'
import json, sys
token = sys.argv[1]
print(json.dumps({
    "token": token,
    "name": "Test 07 Attending",
    "attending": "maybe",
    "guests": 1,
    "ref": "test-07"
}, ensure_ascii=True))
PY
check "7. attending gecersiz" "$(post_file "$f")" '"ok":false.*"error":"invalid_attending"'

# --- 8. Token yanlis -----------------------------------------------------------
f="$PAYLOAD_DIR/08.json"
python3 - > "$f" <<'PY'
import json
print(json.dumps({
    "token": "yanlis-token",
    "name": "Test 08 Token",
    "attending": "yes",
    "guests": 1,
    "ref": "test-08"
}, ensure_ascii=True))
PY
check "8. Token yanlis" "$(post_file "$f")" '"ok":false.*"error":"forbidden"'

# --- 9. Honeypot dolu ------------------------------------------------------
f="$PAYLOAD_DIR/09.json"
python3 - "$TOKEN" > "$f" <<'PY'
import json, sys
token = sys.argv[1]
print(json.dumps({
    "token": token,
    "name": "Test 09 Honeypot",
    "attending": "yes",
    "guests": 1,
    "ref": "test-09",
    "website": "bot"
}, ensure_ascii=True))
PY
check "9. Honeypot dolu (Sheet'e yazilmamali — asagidaki listeyle kontrol et)" "$(post_file "$f")" '"ok":true'

# --- 10. guests=99 (10'a kirpilmali) ----------------------------------------
f="$PAYLOAD_DIR/10.json"
python3 - "$TOKEN" > "$f" <<'PY'
import json, sys
token = sys.argv[1]
print(json.dumps({
    "token": token,
    "name": "Test 10 Guests99",
    "attending": "yes",
    "guests": 99,
    "ref": "test-10"
}, ensure_ascii=True))
PY
check "10. guests=99 (10'a kirpilmali)" "$(post_file "$f")" '"ok":true'

# --- 11. guests="abc" (1'e cekilmeli) ---------------------------------------
f="$PAYLOAD_DIR/11.json"
python3 - "$TOKEN" > "$f" <<'PY'
import json, sys
token = sys.argv[1]
print(json.dumps({
    "token": token,
    "name": "Test 11 GuestsAbc",
    "attending": "yes",
    "guests": "abc",
    "ref": "test-11"
}, ensure_ascii=True))
PY
check "11. guests=abc (1'e cekilmeli)" "$(post_file "$f")" '"ok":true'

# --- 12. 600 karakterlik mesaj (500'e kesilmeli) ----------------------------
f="$PAYLOAD_DIR/12.json"
python3 - "$TOKEN" > "$f" <<'PY'
import json, sys
token = sys.argv[1]
print(json.dumps({
    "token": token,
    "name": "Test 12 LongMsg",
    "attending": "yes",
    "guests": 1,
    "message": "a" * 600,
    "ref": "test-12"
}, ensure_ascii=True))
PY
check "12. 600 karakterlik mesaj (500'e kesilmeli)" "$(post_file "$f")" '"ok":true'

# --- 13. Govde bos -------------------------------------------------------------
# Gonderilecek bir payload yok, dolayisiyla name/ref de yok.
check "13. Govde bos" "$(curl -sL "$ENDPOINT" -H 'Content-Type: text/plain;charset=utf-8' --data-binary '')" \
  '"ok":false.*"error":"no_body"'

echo
echo "===================="
echo "PASS: $PASS  FAIL: $FAIL"
echo
echo "Sheet'te OLMASI gereken ref'ler:"
for r in "${SHOULD_WRITE_REFS[@]}"; do echo "  - $r"; done
echo
echo "Sheet'te OLMAMASI gereken ref'ler:"
for r in "${SHOULD_NOT_WRITE_REFS[@]}"; do echo "  - $r"; done

[ "$FAIL" -eq 0 ] || exit 1
