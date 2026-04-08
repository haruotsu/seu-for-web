import { moonRTT } from "../lib/latency.js";
import { equilibriumTemperature } from "../lib/physics.js";
import { encode, decode } from "../lib/hamming.js";
import { majorityVote } from "../lib/tmr.js";

// =============================================================
//  Chapter 01 — Latency Lab
// =============================================================
const RTT = moonRTT(); // ≈ 2.56s
const HALF = RTT / 2;
const term = document.getElementById("latency-terminal");
const summary = document.getElementById("latency-summary");
let latencyMode = "strong";

document.querySelectorAll(".mode").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    latencyMode = b.dataset.mode;
  })
);

function line(text, cls = "") {
  const span = document.createElement("span");
  span.className = "ln " + cls;
  span.textContent = text;
  term.appendChild(span);
  term.scrollTop = term.scrollHeight;
}

function clearTerm() {
  term.innerHTML = "";
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

document.getElementById("latency-run").addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  clearTerm();
  const t0 = performance.now();

  if (latencyMode === "strong") {
    line("[strong] minne.lunar / reserve item #4421", "dim");
    line(`→ PREPARE   to: earth-leader`, "send");
    await wait(HALF * 1000);
    line(`← PROMISE   from: earth-leader  (Δ ${HALF.toFixed(2)}s)`, "recv");
    line(`→ ACCEPT    to: earth-leader`, "send");
    await wait(HALF * 1000);
    line(`← ACCEPTED  from: earth-leader  (Δ ${HALF.toFixed(2)}s)`, "recv");
    line(`→ COMMIT    to: earth-leader`, "send");
    await wait(HALF * 1000);
    line(`← OK        from: earth-leader  (Δ ${HALF.toFixed(2)}s)`, "recv");
    const elapsed = (performance.now() - t0) / 1000;
    line(``);
    line(`✓ committed in ${elapsed.toFixed(2)}s — user gave up at 2.0s`, "err");
    summary.innerHTML = `合計 <strong>${elapsed.toFixed(2)}s</strong> — Raftの3往復で ${(HALF * 6).toFixed(2)}s 必要 ❌`;
  } else {
    line("[eventual] minne.lunar / reserve item #4421", "dim");
    line(`→ WRITE local CRDT replica`, "send");
    await wait(20);
    line(`✓ optimistic UI updated  (Δ 0.02s)`, "ok");
    line(``);
    line(`… background: gossip to earth in ${HALF.toFixed(2)}s`, "wait");
    await wait(HALF * 1000);
    line(`← merge ack from earth (eventual)`, "recv");
    const elapsed = (performance.now() - t0) / 1000;
    line(``);
    line(`✓ user-perceived latency: 0.02s  (sync: ${elapsed.toFixed(2)}s)`, "ok");
    summary.innerHTML = `体感 <strong>0.02s</strong> / バックグラウンド同期 ${elapsed.toFixed(2)}s ✓`;
  }
  btn.disabled = false;
});

// initial state
line("waiting for input...", "dim");

// =============================================================
//  Chapter 02 — Thermal Lab
// =============================================================
const loadEl = document.getElementById("thermal-load");
const areaEl = document.getElementById("thermal-area");
const loadVal = document.getElementById("thermal-load-value");
const areaVal = document.getElementById("thermal-area-value");
const tempEl = document.getElementById("thermal-temp");
const powerEl = document.getElementById("thermal-power");
const core = document.getElementById("reactor-core");
const warning = document.getElementById("thermal-warning");
let algo = "linear";

document.querySelectorAll(".algo-toggle button").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".algo-toggle button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    algo = b.dataset.algo;
    updateThermal();
  })
);

function updateThermal() {
  const reqs = +loadEl.value;
  const area = +areaEl.value;
  loadVal.textContent = reqs;
  areaVal.textContent = area.toFixed(1);

  // Cost model: each request consumes some "ops".
  // O(n) = c * n,   O(n²) = c * n² / 800  (scaled to fit slider)
  const ops = algo === "linear" ? reqs * 1.0 : (reqs * reqs) / 800;
  // Convert ops/s → Watts. Assume 0.5W per op-unit.
  const power = ops * 0.5;

  const T = equilibriumTemperature({
    power,
    emissivity: 0.9,
    area,
    ambient: 120, // lunar shadow background ≈ 120K
  });

  const celsius = T - 273.15;
  tempEl.textContent = `${celsius.toFixed(0)}°C`;
  powerEl.textContent = `${power.toFixed(0)} W`;

  // Visualize: hue/intensity by temperature
  const t = Math.min(1, Math.max(0, (celsius - 20) / 800));
  const hue = 50 - t * 50; // 50 (yellow) → 0 (red)
  const sat = 90 + t * 10;
  const lit = 60 - t * 25;
  core.style.background = `radial-gradient(circle at 40% 40%, hsl(${hue + 15}, 100%, 75%), hsl(${hue}, ${sat}%, ${lit}%) 55%, hsl(${hue - 10}, 100%, 25%) 100%)`;
  core.style.boxShadow = `0 0 ${40 + t * 120}px hsl(${hue}, 100%, 50%, ${0.3 + t * 0.6}), inset -10px -10px 30px rgba(0,0,0,0.4)`;
  core.style.transform = `scale(${1 + t * 0.15})`;

  if (celsius > 660) {
    warning.textContent = `⚠ ${celsius.toFixed(0)}°C — シリコン融点超過。基板が溶解しました。`;
    warning.className = "warning danger";
  } else if (celsius > 200) {
    warning.textContent = `⚠ ${celsius.toFixed(0)}°C — TDP上限。スロットリング推奨。`;
    warning.className = "warning";
  } else {
    warning.textContent = `安定動作中。`;
    warning.className = "warning";
  }
}

loadEl.addEventListener("input", updateThermal);
areaEl.addEventListener("input", updateThermal);
updateThermal();

// =============================================================
//  Chapter 03 — SEU Lab
// =============================================================
const BIT_COUNT = 32;
const PAYLOAD = Array.from({ length: BIT_COUNT }, (_, i) => (i * 37 + 1) % 2); // deterministic bit pattern

// raw: just the bits, no protection
const rawBits = PAYLOAD.slice();

// hamming: store as Hamming(7,4) codewords for every 4 bits
let hammingWords = [];
function rebuildHamming() {
  hammingWords = [];
  for (let i = 0; i < BIT_COUNT; i += 4) {
    hammingWords.push(encode(PAYLOAD.slice(i, i + 4)));
  }
}
rebuildHamming();

// tmr: store each bit 3 times
let tmrBits = PAYLOAD.map((b) => [b, b, b]);

const rawEl = document.getElementById("bits-raw");
const hamEl = document.getElementById("bits-hamming");
const tmrEl = document.getElementById("bits-tmr");
const statusRaw = document.getElementById("status-raw");
const statusHam = document.getElementById("status-hamming");
const statusTmr = document.getElementById("status-tmr");

function buildBitGrid(parent) {
  parent.innerHTML = "";
  for (let i = 0; i < BIT_COUNT; i++) {
    const d = document.createElement("div");
    d.className = "bit";
    parent.appendChild(d);
  }
}
buildBitGrid(rawEl);
buildBitGrid(hamEl);
buildBitGrid(tmrEl);

function readHamming() {
  const out = [];
  for (const w of hammingWords) {
    const { data } = decode(w);
    out.push(...data);
  }
  return out;
}
function readTmr() {
  return tmrBits.map(majorityVote);
}

function render(flashIdx = null) {
  const rawNow = rawBits;
  const hamNow = readHamming();
  const tmrNow = readTmr();

  [...rawEl.children].forEach((el, i) => {
    el.className = "bit" + (rawNow[i] ? " on" : "") + (rawNow[i] !== PAYLOAD[i] ? " flipped" : "");
  });
  [...hamEl.children].forEach((el, i) => {
    el.className = "bit" + (hamNow[i] ? " on" : "");
    if (flashIdx?.ham === i) el.classList.add("fixed");
  });
  [...tmrEl.children].forEach((el, i) => {
    el.className = "bit" + (tmrNow[i] ? " on" : "");
    if (flashIdx?.tmr === i) el.classList.add("fixed");
  });

  const corruptRaw = rawNow.filter((b, i) => b !== PAYLOAD[i]).length;
  statusRaw.textContent = `integrity: ${(((BIT_COUNT - corruptRaw) / BIT_COUNT) * 100).toFixed(0)}% (corrupt: ${corruptRaw})`;
  statusHam.textContent = `corrected: ${hammingCorrected}`;
  statusTmr.textContent = `recovered: ${tmrRecovered}`;
}

let hammingCorrected = 0;
let tmrRecovered = 0;
let running = false;
let timer = null;
const rateEl = document.getElementById("seu-rate");
const rateVal = document.getElementById("seu-rate-value");
rateEl.addEventListener("input", () => {
  rateVal.textContent = rateEl.value;
  if (running) restart();
});

function flipRandomBit() {
  // raw: irrecoverable
  const i = Math.floor(Math.random() * BIT_COUNT);
  rawBits[i] ^= 1;

  // hamming: flip a random bit inside one of the 7-bit words
  const w = Math.floor(Math.random() * hammingWords.length);
  const bit = Math.floor(Math.random() * 7);
  hammingWords[w][bit] ^= 1;
  // detect & repair on read (scrubbing)
  const { corrected } = decode(hammingWords[w]);
  let hamFlash = null;
  if (corrected) {
    hammingWords[w][corrected - 1] ^= 1; // repair in place
    hammingCorrected++;
    hamFlash = w * 4; // approximate
  }

  // tmr: flip one of the 3 replicas of one bit
  const ti = Math.floor(Math.random() * BIT_COUNT);
  const tr = Math.floor(Math.random() * 3);
  tmrBits[ti][tr] ^= 1;
  // scrub: re-vote and write back
  const v = majorityVote(tmrBits[ti]);
  let tmrFlash = null;
  if (tmrBits[ti].some((x) => x !== v)) {
    tmrBits[ti] = [v, v, v];
    tmrRecovered++;
    tmrFlash = ti;
  }

  render({ ham: hamFlash, tmr: tmrFlash });
}

function restart() {
  if (timer) clearInterval(timer);
  const interval = Math.max(60, 1100 - +rateEl.value * 10);
  timer = setInterval(flipRandomBit, interval);
}

document.getElementById("seu-toggle").addEventListener("click", (e) => {
  running = !running;
  e.currentTarget.textContent = running ? "停止" : "シミュレーション開始";
  if (running) restart();
  else clearInterval(timer);
});
document.getElementById("seu-reset").addEventListener("click", () => {
  for (let i = 0; i < BIT_COUNT; i++) rawBits[i] = PAYLOAD[i];
  rebuildHamming();
  tmrBits = PAYLOAD.map((b) => [b, b, b]);
  hammingCorrected = 0;
  tmrRecovered = 0;
  render();
});

render();
