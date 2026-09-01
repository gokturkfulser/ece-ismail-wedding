import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const P = 9343;
const CHROME = String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`;
const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${P}`,
  '--window-size=1235,905', '--hide-scrollbars', '--no-first-run',
  '--user-data-dir=' + process.env.TEMP + String.raw`\cdp-rm2`, 'about:blank'], { stdio: 'ignore' });
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
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };

await snd('Page.enable'); await snd('Runtime.enable');

for (const mod of ['no-preference', 'reduce']) {
  await snd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: mod }] });
  await snd('Page.navigate', { url: 'http://127.0.0.1:8149/?m=' + mod });
  await sl(2200);
  const a = await ev(`(() => {
    const dd = document.querySelector('[data-pixel-scene]');
    const g = dd.querySelector('.gelin:not(.kirpik)'), d = dd.querySelector('.damat:not(.kirpik)');
    const cs = n => getComputedStyle(n);
    const b = n => (r => ({ l: Math.round(r.left), r: Math.round(r.right) }))(n.getBoundingClientRect());
    return {
      sahneYaziOpacity: cs(dd.querySelector('.yazi')).opacity,
      kapiMetniOpacity: cs(document.querySelector('.gate__content')).opacity,
      gelin: b(g).l + '..' + b(g).r, damat: b(d).l + '..' + b(d).r,
      bosluk: b(d).l - b(g).r,
    };
  })()`);
  console.log(`[${mod}] ACILIS: ` + JSON.stringify(a));
  const s = await snd('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`tools/.rm-${mod}.png`, Buffer.from(s.data, 'base64'));

  await ev(`document.getElementById('gate-open').click()`);
  await sl(mod === 'reduce' ? 2200 : 7900);
  const b2 = await ev(`(() => ({ kapiDomda: !!document.getElementById('gate'),
    bodyKilitli: document.body.classList.contains('is-locked') }))()`);
  console.log(`[${mod}] TIKLAMA SONRASI: ` + JSON.stringify(b2));
}
ws.close(); ch.kill();
