import { spawn } from 'node:child_process';
const P = 9345;
const CHROME = String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`;
const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${P}`,
  '--window-size=900,500', '--hide-scrollbars', '--no-first-run',
  '--user-data-dir=' + process.env.TEMP + String.raw`\cdp-dbg`, 'about:blank'], { stdio: 'ignore' });
const sl = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 60; i++) {
  try { const l = await (await fetch(`http://127.0.0.1:${P}/json/list`)).json();
    const p = l.find((t) => t.type === 'page');
    if (p?.webSocketDebuggerUrl) { ws = new WebSocket(p.webSocketDebuggerUrl); break; } } catch {}
  await sl(250); }
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(); const errs = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const { res, rej } = pend.get(m.id); pend.delete(m.id);
    m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); return; }
  if (m.method === 'Runtime.exceptionThrown') errs.push(JSON.stringify(m.params.exceptionDetails).slice(0,300)); };
const snd = (m2, params = {}) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m2, params })); });
const ev = async (x) => { const r = await snd('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0,400)); return r.result.value; };

await snd('Page.enable'); await snd('Runtime.enable');
await snd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await snd('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 1, mobile: true });
await snd('Page.navigate', { url: 'http://127.0.0.1:8149/' });
await sl(2000);

console.log('ONCE:', JSON.stringify(await ev(`(() => {
  const g = document.getElementById('gate');
  const dd = document.querySelector('[data-pixel-scene]');
  const btn = document.getElementById('gate-open');
  const br = btn.getBoundingClientRect();
  return { siniflar: g.className, sahneOffsetParentNull: dd.offsetParent === null,
    sahneYuk: dd.getBoundingClientRect().height,
    butonRect: [Math.round(br.top), Math.round(br.bottom), Math.round(br.left)],
    butonViewportIcinde: br.top >= 0 && br.bottom <= window.innerHeight,
    ustundekiEleman: document.elementFromPoint(br.left + br.width/2, br.top + br.height/2)?.id
                     || document.elementFromPoint(br.left + br.width/2, br.top + br.height/2)?.className };
})()`)));

await ev(`document.getElementById('gate-open').click()`);
for (const t of [100, 600, 1600, 2600]) {
  await sl(t === 100 ? 100 : t - (t === 600 ? 100 : (t === 1600 ? 600 : 1600)));
  console.log(`+${t}ms:`, JSON.stringify(await ev(`(() => {
    const g = document.getElementById('gate');
    if (!g) return { kapiDomda: false };
    return { kapiDomda: true, siniflar: g.className,
      opacity: getComputedStyle(g).opacity,
      transition: getComputedStyle(g).transitionDuration,
      bodyKilitli: document.body.classList.contains('is-locked') };
  })()`)));
}
console.log('JS hatalari:', errs);
ws.close(); ch.kill();
