import fs from 'fs';

async function run() {
  const res = await fetch('http://localhost:9222/json');
  const targets = await res.json();
  const page = targets.find((t) => t.type === 'page' && t.url.includes('5173'));

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const cb = callbacks.get(data.id);
      callbacks.delete(data.id);
      cb(data.result);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));
  await send('Runtime.enable');
  await send('Page.enable');

  async function evalJs(expr) {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    return r?.result?.value;
  }

  console.log('Starting punch sequence to KO...');
  for (let i = 0; i < 25; i++) {
    // Wait until canPunch is ready
    let canPunch = false;
    for (let w = 0; w < 20; w++) {
      canPunch = await evalJs('!document.querySelector("button.punch")?.disabled');
      if (canPunch) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    
    await evalJs('document.querySelector("button.punch")?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))');
    const patience = await evalJs('document.querySelector(".lbl span:last-child")?.innerText');
    console.log(`Punch ${i + 1} registered. Current patience: ${patience}`);

    const isKO = await evalJs('!!document.querySelector(".ko-overlay")');
    if (isKO || patience === '100%') {
      console.log('KO REACHED!');
      break;
    }
    // wait for punch animation to finish (~1.05s)
    await new Promise((r) => setTimeout(r, 1050));
  }

  // Wait 1.5s for KO screen to settle
  await new Promise((r) => setTimeout(r, 1500));
  console.log('Capturing verified KO screenshot...');
  const ssKO = await send('Page.captureScreenshot', { format: 'png' });
  if (ssKO?.data) {
    fs.writeFileSync('screenshot_ko_verified.png', Buffer.from(ssKO.data, 'base64'));
    console.log('Saved screenshot_ko_verified.png');
  }

  // Click Next Round
  console.log('Clicking Next Round...');
  await evalJs('document.querySelector(".ko-btn--primary")?.click()');

  // Wait for Round 2 countdown
  await new Promise((r) => setTimeout(r, 4000));
  console.log('Capturing Round 2 screenshot...');
  const ssR2 = await send('Page.captureScreenshot', { format: 'png' });
  if (ssR2?.data) {
    fs.writeFileSync('screenshot_round2_verified.png', Buffer.from(ssR2.data, 'base64'));
    console.log('Saved screenshot_round2_verified.png');
  }

  console.log('SUCCESS!');
  ws.close();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
