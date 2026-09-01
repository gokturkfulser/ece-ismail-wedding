import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const P = 9344;
const CHROME = String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`;
const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${P}`,
  '--window-size=1400,1000', '--hide-scrollbars', '--no-first-run',
  '--user-data-dir=' + process.env.TEMP + String.raw`\cdp-cak`, 'about:blank'], { stdio: 'ignore' });
const sl = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${P}/json/list`)).json();
    const p = l.find((t) => t.type === 'page');
    if (p?.webSocketDebuggerUrl) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
  await sl(250); }
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id);
    m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } };
const snd = (m2, params = {}) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m2, params })); });
const ev = async (x) => { const r = await snd('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails, null, 1)); return r.result.value; };

await snd('Page.enable'); await snd('Runtime.enable');
await snd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });

const boyutlar = [
  ['masaustu 1920x1080', 1920, 1080], ['laptop 1440x900', 1440, 900],
  ['laptop-kisa 1235x810', 1235, 810], ['telefon 390x844', 390, 844],
  ['telefon-kucuk 360x640', 360, 640], ['yatay-telefon 844x390', 844, 390],
];

for (const [ad, w, h] of boyutlar) {
  await snd('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 500 });
  await snd('Page.navigate', { url: 'http://127.0.0.1:8149/?v=' + w + 'x' + h });
  await sl(1200);
  // sahne ve metin hazir olana kadar bekle
  for (let t = 0; t < 40; t++) {
    const hazir = await ev(`!!document.querySelector('[data-pixel-scene] .gelin') && !!document.querySelector('.gate__content') && !!document.getElementById('gate-open')`);
    if (hazir) break;
    await sl(200);
  }
  const r = await ev(`(() => {
    const dd = document.querySelector('[data-pixel-scene]');
    const g = dd.querySelector('.gelin:not(.kirpik)');
    const c = document.querySelector('.gate__content');
    const hint = document.getElementById('gate-hint') || document.getElementById('gate-open');
    const btn = document.getElementById('gate-open');
    const bb = n => n ? n.getBoundingClientRect() : null;
    const gb = bb(g), cb = bb(c), hb = bb(hint) || bb(btn);
    const cs = getComputedStyle(dd);
    return {
      unit: cs.getPropertyValue('--unit').trim(),
      karakterYuk: Math.round(gb.height),
      metinAlti: Math.round(hb.bottom),
      karakterUstu: Math.round(gb.top),
      bosluk: Math.round(gb.top - hb.bottom),
      CAKISMA: gb.top < hb.bottom,
      butonGorunur: bb(btn).top >= 0 && bb(btn).bottom <= window.innerHeight,
      sahneGizliMi: dd.offsetParent === null,
    };
  })()`);
  let bayrak = r.sahneGizliMi ? 'sahne KAPALI (klasik kapi)' : (r.CAKISMA ? 'CAKISMA VAR' : 'temiz');
  // tiklayinca kapi kapaniyor mu? (app.js listener'lari baglansin diye bekle)
  await sl(700);
  await ev(`document.getElementById('gate-open').click()`);
  await sl(r.sahneGizliMi ? 3000 : 9500);
  const kapandi = await ev(`!document.getElementById('gate')`);
  bayrak += kapandi ? ' | kapi kapandi' : ' | KAPI KAPANMADI';
  console.log(`${ad.padEnd(22)} unit=${r.unit} karakter=${r.karakterYuk}px  metin_alti=${r.metinAlti} karakter_ustu=${r.karakterUstu} bosluk=${r.bosluk}px  -> ${bayrak}`);
  if (r.CAKISMA || w === 1235 || h === 390) {
    const s = await snd('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`tools/.c-${w}x${h}.png`, Buffer.from(s.data, 'base64'));
  }
}
ws.close(); ch.kill();
