import fs from 'fs';

async function run() {
  console.log('Connecting to Chrome at http://127.0.0.1:9222/json...');
  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  const page = targets.find((t) => t.type === 'page' && t.url.includes('5173'));
  if (!page) {
    throw new Error('Could not find active page with 5173 URL. Open targets: ' + JSON.stringify(targets));
  }

  console.log(`Found page target: ${page.title} (${page.url})`);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      callbacks.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const consoleLogs = [];
  const errors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const cb = callbacks.get(data.id);
      callbacks.delete(data.id);
      cb(data.result);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      const text = data.params.args.map((a) => a.value || a.description || '').join(' ');
      consoleLogs.push(`[${data.params.type}] ${text}`);
      if (data.params.type === 'error') {
        errors.push(text);
      }
    }
    if (data.method === 'Runtime.exceptionThrown') {
      const desc = data.params.exceptionDetails?.exception?.description || 'Unknown exception';
      consoleLogs.push(`[EXCEPTION] ${desc}`);
      errors.push(desc);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));
  await send('Runtime.enable');
  await send('Page.enable');
  await send('DOM.enable');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise((r) => setTimeout(r, 800));

  async function evalJs(expr) {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    return r?.result?.value;
  }

  async function capture(filename) {
    const ss = await send('Page.captureScreenshot', { format: 'png' });
    if (ss?.data) {
      fs.writeFileSync(filename, Buffer.from(ss.data, 'base64'));
      console.log(`📸 Captured: ${filename}`);
    }
  }

  // 1. Wait for models to load in Lobby
  console.log('Waiting for ring and models to load in Lobby...');
  for (let w = 0; w < 30; w++) {
    const ready = await evalJs('!document.querySelector(".start-btn")?.disabled');
    if (ready) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await capture('test_01_lobby.png');

  // 2. Click Start Game
  console.log('Clicking START GAME...');
  await evalJs('document.querySelector(".start-btn")?.click()');

  // 3. Wait through countdown to PLAYING
  console.log('Waiting for countdown (3, 2, 1, FIGHT!)...');
  for (let w = 0; w < 40; w++) {
    const isPlaying = await evalJs('!!document.querySelector("button.punch")');
    if (isPlaying) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 600));

  // Check tags visibility & text
  const girlTag = await evalJs('document.querySelector(".tag.g")?.innerText');
  const boyTag = await evalJs('document.querySelector(".tag.b")?.innerText');
  console.log(`Fighter tags detected: Girl = "${girlTag}", Boy = "${boyTag}"`);
  await capture('test_02_ready_stance.png');

  // 4. Punch once and capture impact timing
  console.log('Triggering punch...');
  await evalJs('document.querySelector("button.punch")?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))');

  // Capture near glove impact (approx 680ms after punch press)
  await new Promise((r) => setTimeout(r, 680));
  const bubbleText = await evalJs('document.querySelector(".bubble")?.innerText');
  const bubbleOn = await evalJs('document.querySelector(".bubble")?.classList.contains("on")');
  console.log(`Speech bubble at impact: "${bubbleText}" (visible: ${bubbleOn})`);
  await capture('test_03_punch_impact.png');
  // Wait for punch to complete before continuing
  await new Promise((r) => setTimeout(r, 450));

  // 5. Punch to KO
  console.log('Punching through to 100% patience / KO...');
  for (let i = 0; i < 25; i++) {
    let canPunch = false;
    for (let w = 0; w < 20; w++) {
      canPunch = await evalJs('!document.querySelector("button.punch")?.disabled');
      if (canPunch) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!canPunch) break;

    await evalJs('document.querySelector("button.punch")?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))');
    const patience = await evalJs('document.querySelector(".lbl span:last-child")?.innerText');
    console.log(`Punch registered. Patience: ${patience}`);

    const isKO = await evalJs('!!document.querySelector(".ko-overlay")');
    if (isKO || patience === '100%') {
      console.log('KO reached!');
      break;
    }
    await new Promise((r) => setTimeout(r, 1050));
  }

  // Capture Sanjay falling / defeated before KO modal
  await new Promise((r) => setTimeout(r, 1000));
  await capture('test_04_defeated_animation.png');

  // Wait for KO overlay
  await new Promise((r) => setTimeout(r, 1500));
  await capture('test_05_ko_screen.png');

  // Click Next Round
  console.log('Clicking Next Round...');
  await evalJs('document.querySelector(".ko-btn--primary")?.click()');

  // Wait for Round 2 countdown
  await new Promise((r) => setTimeout(r, 4000));
  await capture('test_06_round2_reset.png');

  console.log('=== TEST RESULTS ===');
  console.log(`Total Console Messages: ${consoleLogs.length}`);
  if (consoleLogs.length) {
    console.log('Logs:\n' + consoleLogs.join('\n'));
  }
  if (errors.length) {
    console.error('ERRORS DETECTED:\n' + errors.join('\n'));
    throw new Error(`Encountered ${errors.length} browser error(s)`);
  } else {
    console.log('✅ ZERO errors detected in browser execution!');
  }

  ws.close();
  process.exit(0);
}

run().catch((e) => {
  console.error('Test run failed:', e);
  process.exit(1);
});
