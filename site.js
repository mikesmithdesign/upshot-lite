/* Upshot Lite : one vanilla script, no dependencies.
   Hero workflow (one fixed run, drawn on a loop), contour field, opener reveal, pricing calculator, pilot form.
   ?static (or prefers-reduced-motion) shows every animation in its finished state. */
(() => {
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("static");
  if (reduce) body.classList.add("static");
  const $ = (id) => document.getElementById(id);
  let paused = false, offHero = false;   // Pause button (and the hero leaving the screen) freeze timers, packets and the field
  const wait = (ms) => new Promise((r) => { let left = ms, last = performance.now();
    (function tick() { const now = performance.now(); if (!paused && !offHero) left -= now - last; last = now; left <= 0 ? r() : setTimeout(tick, 40); })(); });
  const cssv = (n) => getComputedStyle(body).getPropertyValue(n).trim();
  // any CSS colour (hex, rgb(), oklch()...) to [r, g, b] 0-255, by painting one pixel
  const px = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const rgbOf = (c) => { px.clearRect(0, 0, 1, 1); px.fillStyle = "#000"; px.fillStyle = c; px.fillRect(0, 0, 1, 1); return [...px.getImageData(0, 0, 1, 1).data.slice(0, 3)]; };
  const rgb01 = (c) => rgbOf(c).map((v) => v / 255);
  const NS = "http://www.w3.org/2000/svg";

  /* ---------- the workflow the hero draws ----------
     k: a agent, o system or tool, h person, d decision, t trigger, c context, x outcome.
     Triggers, context and outcomes are drawn as systems: four shapes, four meanings.
     c/r: grid column 0-4 and row 0-3. Steps fire edges ("from>to") and set states. */
  const D = { pattern: "parallel fan-out",
    nodes: { trigger: ["t", 0, 1, "Ticket spike", "23 tickets"], ctx1: ["c", 1, 0, "Help docs", "412 pages"], agent: ["a", 1, 1, "Triage", "waiting"], ctx2: ["c", 1, 2, "Old tickets", "18 months"],
             tool1: ["o", 2, 0, "Replies", "helpdesk"], tool2: ["o", 2, 1, "Bug report", "tracker"], tool3: ["o", 2, 2, "Doc fix", "help docs"],
             human: ["h", 3, 1, "Support lead", "sign-off"], outcome: ["x", 4, 1, "Resolved", "waiting"] },
    steps: [
      { on: ["trigger"], trace: ["Trigger", "the same billing error, 23 times this week"], w: 900 },
      { fire: ["trigger>agent"], busy: "agent", meta: { agent: "triaging" } },
      { fire: ["ctx1>agent", "ctx2>agent"], on: ["ctx1", "ctx2"], trace: ["Reading", "the help docs and 18 months of tickets"] },
      { meta: { agent: "found it" }, trace: ["Found it", "a rounding bug since the last release"], w: 1300 },
      { fire: ["agent>tool1", "agent>tool2", "agent>tool3"], on: ["tool1", "tool2", "tool3"], idle: "agent", meta: { agent: "3 drafts", tool1: "23 drafted", tool2: "drafted", tool3: "edit ready" }, trace: ["Fan-out", "three drafts at once, nothing sent"], w: 900 },
      { fire: ["tool1>human", "tool2>human", "tool3>human"], on: ["human"], meta: { human: "reviewing" }, trace: ["Review", "all three go to Sam in one place"], w: 1100 },
      { meta: { human: "approved" }, trace: ["Approved", "Sam signed off all three"], w: 700 },
      { fire: ["human>outcome"], on: ["outcome"], meta: { outcome: "23 sent", tool1: "23 sent", tool2: "BUG-512", tool3: "live" }, trace: ["Acting", "replies sent, bug filed, doc fixed"] },
    ], done: ["Done", "every customer answered, fix in the next release"], win: "outcome"  };

  /* ---------- contour field, single hue (WebGL2, written for this theme) ---------- */
  const cv = $("field"); const gl = cv && cv.getContext("webgl2", { antialias: false, premultipliedAlpha: false });
  if (gl) {
    const vs = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
    const fs = `#version 300 es
precision highp float;
uniform vec2 r; uniform float t; uniform vec3 bg; uniform vec3 ln; uniform vec3 ac;
out vec4 o;
float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { v += a * n(p); p = m * p; a *= .5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / r.y;
  vec2 q = vec2(fbm(uv * 1.25 + vec2(0., t * .018)), fbm(uv * 1.25 + vec2(3.1, 1.7) - t * .014));
  float k = fbm(uv * 1.05 + q * 1.9) * 15.;
  float w = fwidth(k);
  float minor = 1. - smoothstep(0., w * 1.15, abs(fract(k) - .5));
  float major = 1. - smoothstep(0., w * 1.6, abs(fract(k * .2) - .5));
  vec2 s = gl_FragCoord.xy / r;
  vec2 d = (s - vec2(.72 + .04 * sin(t * .06), .52 + .05 * cos(t * .05))) * vec2(1.5, 1.);
  float g = exp(-dot(d, d) * 3.8);
  vec3 base = mix(bg, ac, g * .07);
  vec3 lc = mix(ln, ac, g * .45);
  o = vec4(mix(base, lc, clamp(minor * .5 + major * .25, 0., 1.)), 1.);
}`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const U = (n) => gl.getUniformLocation(pr, n);
      const uR = U("r"), uT = U("t"), uBg = U("bg"), uLn = U("ln"), uAc = U("ac");
      const setCols = () => { gl.uniform3fv(uBg, rgb01(cssv("--g"))); gl.uniform3fv(uLn, rgb01(cssv("--wire"))); gl.uniform3fv(uAc, rgb01(cssv("--acc"))); };
      const size = () => { const s = Math.min(devicePixelRatio || 1, 1.5) * 0.6; cv.width = Math.max(1, cv.clientWidth * s | 0); cv.height = Math.max(1, cv.clientHeight * s | 0); gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(uR, cv.width, cv.height); };
      const draw = (time) => { gl.uniform1f(uT, time); gl.drawArrays(gl.TRIANGLES, 0, 3); };
      size(); setCols();
      new ResizeObserver(() => { size(); draw(reduce ? 14 : performance.now() / 1000); }).observe(cv);
      let vis = true; new IntersectionObserver(([e]) => (vis = e.isIntersecting)).observe(cv);
      if (reduce) draw(14);
      else (function loop(now) { if (vis && !document.hidden && !paused) draw(now / 1000); requestAnimationFrame(loop); })(performance.now());
    }
  }

  /* ---------- layout engine ----------
     Wide plates lay columns left to right. Narrow plates (phones) transpose the grid so
     columns run top to bottom and the boxes stay big enough to read. */
  const NW = 124, NH = 56;
  const RX = { a: 16, o: 3, h: 6, d: 28, t: 3, c: 3, x: 3 };
  const svg = document.querySelector("[data-engine] svg");   // the hero diagram
  const nodesG = $("nodes"), edgesG = $("edges"), flow = $("flow");
  const els = {};
  let tall = false, tok = 0;
  const setMode = () => {
    tall = svg.parentElement.clientWidth < 680;
    svg.setAttribute("viewBox", tall ? "0 0 456 440" : "0 0 764 318");
    svg.classList.toggle("tall", tall);
  };

  function makeNode(id) {
    const g = document.createElementNS(NS, "g"); g.setAttribute("class", "n"); g.dataset.id = id; g.style.opacity = 0;
    g.innerHTML = `<rect class="ring" x="0" y="0" width="${NW}" height="${NH}"/><rect class="box" x="0" y="0" width="${NW}" height="${NH}"/>`
      + `<text class="t" x="12" y="24"></text><text class="m" x="12" y="43"></text>`;
    nodesG.appendChild(g); els[id] = g; return g;
  }
  const pos = (n, t = tall) => t
    ? { x: 8 + n[2] * 158, y: 8 + n[1] * 92, c: n[1], r: n[2] }
    : { x: 12 + n[1] * 154, y: 30 + n[2] * 100, c: n[1], r: n[2] };
  function route(a, b, t = tall) {
    const A = pos(a, t), B = pos(b, t);
    if (t) {
      if (B.c > A.c) { const sx = A.x + NW / 2, sy = A.y + NH, tx = B.x + NW / 2, ty = B.y, my = (sy + ty) / 2;
        return sx === tx ? `M${sx} ${sy} V${ty}` : `M${sx} ${sy} V${my} H${tx} V${ty}`; }
      if (B.c === A.c) { const y = A.y + NH / 2; return B.r > A.r ? `M${A.x + NW} ${y} H${B.x}` : `M${A.x} ${y} H${B.x + NW}`; }
      const xl = Math.max(A.x, B.x) + NW + 17;   // loop back down the right-hand side
      return `M${A.x + NW} ${A.y + NH / 2} H${xl} V${B.y + NH / 2} H${B.x + NW}`;
    }
    if (B.c > A.c) { const sx = A.x + NW, sy = A.y + NH / 2, tx = B.x, ty = B.y + NH / 2, mx = (sx + tx) / 2;
      return sy === ty ? `M${sx} ${sy} H${tx}` : `M${sx} ${sy} H${mx} V${ty} H${tx}`; }
    if (B.c === A.c) { const x = A.x + NW / 2; return B.r > A.r ? `M${x} ${A.y + NH} V${B.y}` : `M${x} ${A.y} V${B.y + NH}`; }
    const yl = Math.max(A.y, B.y) + NH + 26;   // loop back underneath
    return `M${A.x + NW / 2} ${A.y + NH} V${yl} H${B.x + NW / 2} V${B.y + NH}`;
  }
  const setState = (id, s) => { const g = els[id]; if (!g) return; g.classList.remove("on", "busy", "done", "win"); if (s) g.classList.add(s); };
  const fit = (g) => g.querySelectorAll("text").forEach((el) => {   // long labels shrink to fit the box
    el.style.fontSize = ""; const max = NW - 22, L = el.getComputedTextLength();
    if (L > max) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * max / L).toFixed(2) + "px";
  });
  const setMeta = (id, m) => { const g = els[id]; if (g) { g.querySelector(".m").textContent = m; fit(g); } };


  async function show(t) {   // (re)draws the nodes, then the edges, ready for a run
    $("tag").textContent = D.pattern;
    flow.innerHTML = ""; edgesG.innerHTML = ""; nodesG.innerHTML = "";
    for (const k of Object.keys(els)) delete els[k];
    for (const [id, n] of Object.entries(D.nodes)) {
      const g = makeNode(id); g.dataset.k = n[0]; g.querySelectorAll("rect").forEach((r) => r.setAttribute("rx", RX[n[0]]));
      g.querySelector(".t").textContent = n[3]; g.querySelector(".m").textContent = n[4]; fit(g);
      const { x, y } = pos(n); g.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(() => (g.style.opacity = 1));
    }
    $("trace").innerHTML = "<b>Watching:</b> your systems";
    if (!reduce) { await wait(800); if (t !== tok) return; }
    const keys = new Set(); D.steps.forEach((s) => (s.fire || []).forEach((k) => keys.add(k)));
    for (const k of keys) {
      const [a, b] = k.split(">"); const p = document.createElementNS(NS, "path");
      p.setAttribute("class", "e"); p.dataset.k = k; p.setAttribute("d", route(D.nodes[a], D.nodes[b])); edgesG.appendChild(p);
      if (!reduce) { const L = p.getTotalLength(); p.classList.add("drawing"); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.getBoundingClientRect();
        p.style.transition = "stroke-dashoffset .55s ease-out, stroke .4s, opacity .35s"; p.style.strokeDashoffset = 0;
        setTimeout(() => { p.classList.remove("drawing"); p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; p.style.transition = ""; }, 620); }
    }
    if (!reduce) await wait(700);
  }

  function packet(k, t) {
    const p = edgesG.querySelector(`path[data-k="${k}"]`); if (!p) return Promise.resolve();
    const L = p.getTotalLength(), c = document.createElementNS(NS, "circle"); c.setAttribute("class", "pk"); c.setAttribute("r", 5.5);
    const tr = document.createElementNS(NS, "path"); tr.setAttribute("class", "trail"); tr.setAttribute("d", p.getAttribute("d"));
    tr.style.strokeDasharray = L; tr.style.strokeDashoffset = L; flow.appendChild(tr); flow.appendChild(c);
    return new Promise((res) => { let t0 = performance.now(), last = t0; const ms = 520 + L * 2.1;
      (function f(now) {
        if (t !== tok) { c.remove(); tr.remove(); return res(); }
        if (paused || offHero) t0 += now - last; last = now;
        const q = Math.min(1, (now - t0) / ms), e = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
        const pt = p.getPointAtLength(L * e); c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y); tr.style.strokeDashoffset = L * (1 - e);
        if (q < 1) requestAnimationFrame(f); else { c.remove(); setTimeout(() => tr.remove(), 250); p.classList.add("done"); res(); }
      })(t0); });
  }

  async function run() {   // plays the run, holds the finished state, then plays it again
    const t = ++tok;
    do {
      await show(t); if (t !== tok) return;
      for (const s of D.steps) {
        Object.keys(els).forEach((id) => { if (els[id].classList.contains("on")) setState(id, "done"); });
        if (s.idle) setState(s.idle, "done");
        if (s.busy) setState(s.busy, "busy");
        (s.on || []).forEach((id) => setState(id, "on"));
        if (s.meta) for (const [id, m] of Object.entries(s.meta)) setMeta(id, m);
        if (s.trace) $("trace").innerHTML = `<b>${s.trace[0]}:</b> ${s.trace[1]}`;
        if (s.fire) await Promise.all(s.fire.map((k) => packet(k, t)));
        if (t !== tok) return;
        await wait(s.w || 650); if (t !== tok) return;
      }
      Object.keys(els).forEach((id) => setState(id, "done"));
      setState(D.win, "win");
      $("trace").innerHTML = `<b>${D.done[0]}:</b> ${D.done[1]}`;
      await wait(3600); if (t !== tok) return;
    } while (t === tok);
  }
  async function still() {   // ?static and reduced motion: the finished run, no timers
    const t = ++tok; await show(t);
    D.steps.forEach((s) => { if (s.meta) for (const [id, m] of Object.entries(s.meta)) setMeta(id, m); });
    edgesG.querySelectorAll("path").forEach((p) => p.classList.add("done"));
    Object.keys(els).forEach((id) => setState(id, "done")); setState(D.win, "win");
    $("trace").innerHTML = `<b>${D.done[0]}:</b> ${D.done[1]}`;
  }
  new IntersectionObserver(([e]) => (offHero = !e.isIntersecting)).observe(svg.closest(".plate"));
  const pause = $("pause");
  pause.hidden = reduce;
  pause.addEventListener("click", () => {
    paused = !paused; body.classList.toggle("paused", paused);
    pause.setAttribute("aria-pressed", String(paused)); pause.textContent = paused ? "Play" : "Pause";
  });
  document.fonts.ready.then(() => Object.values(els).forEach(fit));
  setMode();
  reduce ? still() : run();
  new ResizeObserver(() => { const was = tall; setMode(); if (was !== tall) reduce ? still() : run(); }).observe(svg.parentElement);

  /* ---------- mobile menu: close on a link or Esc ---------- */
  if (document.querySelector(".mnav")) {
  const mnav = document.querySelector(".mnav");
  mnav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => mnav.removeAttribute("open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && mnav.open) { mnav.removeAttribute("open"); mnav.querySelector("summary").focus(); } });
  document.addEventListener("click", (e) => { if (mnav.open && !mnav.contains(e.target)) mnav.removeAttribute("open"); });
  }

  /* ---------- tagline: words light up in reading order as they cross a line ---------- */
  if ($("tagline")) {
  const tag = $("tagline");
  tag.innerHTML = tag.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
  const words = [...tag.querySelectorAll(".w")];
  if (reduce) words.forEach((w) => w.classList.add("lit"));
  else {
    const io = new IntersectionObserver((es) => {
      es.filter((e) => e.isIntersecting).sort((a, b) => words.indexOf(a.target) - words.indexOf(b.target))
        .forEach((e, i) => { setTimeout(() => e.target.classList.add("lit"), i * 70); io.unobserve(e.target); });
    }, { rootMargin: "0px 0px -38% 0px" });
    words.forEach((w) => io.observe(w));
  }
  }

  /* ---------- pilot weeks fill in once seen ---------- */
  if ($("weeks")) {
  const weeks = $("weeks");
  if (reduce) weeks.classList.add("on");
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { weeks.classList.add("on"); o.disconnect(); } }, { threshold: 0.6 }).observe(weeks);
  }

  /* ---------- pricing calculator ---------- */
  const BASE = 490, INCLUDED = 1000, PER_RUN = 0.3, MIN = 500, MAX = 20000;
  const fmt = (n) => n.toLocaleString("en-US");
  if ($("runs")) {
  const runs = $("runs");
  runs.min = MIN; runs.max = MAX;   // plan numbers above drive the slider, the labels and the copy
  $("minOut").textContent = fmt(MIN); $("maxOut").textContent = fmt(MAX); $("baseOut").textContent = `$${fmt(BASE)}`;
  $("calcNote").textContent = `$${PER_RUN.toFixed(2)} a run after the first ${fmt(INCLUDED)}. Above ${fmt(MAX)} runs a month, Scale pricing is usually cheaper.`;
  const calc = () => {
    const n = +runs.value, extra = Math.max(0, n - INCLUDED), cost = Math.round(extra * PER_RUN);
    $("runsOut").textContent = fmt(n);
    $("extraLabel").textContent = extra ? `${fmt(extra)} runs over the ${fmt(INCLUDED)} included` : `Inside the ${fmt(INCLUDED)} included runs`;
    $("extraOut").textContent = `$${fmt(cost)}`;
    $("totalOut").textContent = `$${fmt(BASE + cost)}`;
  };
  runs.addEventListener("input", calc); calc();
  }

  /* ---------- pilot form: client-side checks, inline success (no backend in the demo) ---------- */
  if ($("pilotForm")) {
  const form = $("pilotForm");
  const okEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const check = (el) => {
    const v = el.value.trim(), good = el.type === "email" ? okEmail(v) : v.length > 0;
    el.closest(".field").classList.toggle("bad", !good);
    el.setAttribute("aria-invalid", String(!good));
    return good;
  };
  form.querySelectorAll("input, textarea").forEach((el) => {
    el.addEventListener("input", () => el.closest(".field").classList.contains("bad") && check(el));   // errors clear as you type, before the click
    el.addEventListener("blur", () => el.value && check(el));
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = [...form.querySelectorAll("input, textarea")].filter((el) => !check(el));
    if (bad.length) { bad[0].focus(); return; }
    form.classList.add("done");
    form.nextElementSibling.focus?.();
  });
  }

  /* ---------- smooth scroll, reveals, counters, halftone ---------- */
  // Lenis: the one vendored script, for weighted smooth scrolling (skipped for reduced motion)
  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    document.querySelectorAll('a[href^="#"]:not(.skip)').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2 || !document.querySelector(id)) return;
      e.preventDefault();
      // numeric target from the real scroll position, re-checked on arrival in case layout moved mid-flight
      const go = (dur) => lenis.scrollTo(document.querySelector(id).getBoundingClientRect().top + scrollY - 72, { duration: dur, force: true,
        onComplete: () => { const t = document.querySelector(id), off = t.getBoundingClientRect().top - 72;
          if (Math.abs(off) > 4 && dur > 1) return go(0.6);
          if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); } });   // keyboard users land in the section
      go(1.4);
    }));
  }

  // headings rise word by word out of a mask; content eases in from a blur
  document.querySelectorAll("h1, .h2, .closer h2").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w, i) => `<span class="rw"><span style="--i:${i}">${w}</span></span>`).join(" ");
  });
  const rvSel = [".hero .sub", ".hero .ctas", ".hero .key", ".hero .plate", ".lead", ".tile", ".weeks", ".calc", ".tier", ".qs", ".closer form", ".closer .side p", ".closer .promise"];
  document.querySelectorAll(rvSel.join(",")).forEach((el) => {
    el.classList.add("rv");
    const sib = [...el.parentElement.children].filter((x) => x.matches(".tile, .tier")).indexOf(el);
    if (sib > 0) el.style.setProperty("--dl", (0.12 + sib * 0.09).toFixed(2) + "s");
  });
  [[".hero .sub", ".25s"], [".hero .ctas", ".38s"], [".hero .key", ".5s"], [".hero .plate", ".45s"]].forEach(([q, d]) => document.querySelector(q)?.style.setProperty("--dl", d));
  const heads = document.querySelectorAll(".h2, .closer h2"), rvs = document.querySelectorAll(".rv");
  if (reduce) { heads.forEach((h) => h.classList.add("in")); rvs.forEach((r) => r.classList.add("in")); document.querySelector("h1")?.classList.add("in"); }
  else {
    const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    heads.forEach((h) => rio.observe(h)); rvs.forEach((r) => rio.observe(r));
    document.fonts.ready.then(() => requestAnimationFrame(() => document.querySelector("h1")?.classList.add("in")));
  }

  // bento numbers count up once seen
  const countUp = (el) => {
    const m = el.textContent.match(/^([^\d]*)([\d.,]+)(.*)$/); if (!m) return;
    const [, pre, num, post] = m, to = parseFloat(num.replace(/,/g, "")), dp = (num.split(".")[1] || "").length, t0 = performance.now();
    (function f(now) { const q = Math.min(1, (now - t0) / 1600), e = 1 - Math.pow(2, -10 * q);
      el.textContent = pre + (to * (q < 1 ? e : 1)).toFixed(dp) + post; if (q < 1) requestAnimationFrame(f); })(t0);
  };
  if (!reduce) { const cio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } }), { threshold: 0.6 });
    document.querySelectorAll(".tile .big").forEach((b) => cio.observe(b)); }

  // halftone fields: a warped noise field, ordered (Bayer 4x4) dithered into four tones in 2px cells.
  // Drawn per element at its own size, redrawn on resize and pack change; never moves with scroll.
  const hash = (x, y) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };
  const fbm = (x, y) => vnoise(x, y) * 0.55 + vnoise(x * 2.1 + 5, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3 + 9) * 0.15;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const seed = [...location.pathname.split("/").pop()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) / 37;   // each page gets its own field
  const drawField = (el) => {
    const C = 2, w = Math.ceil(Math.min(2800, el.clientWidth) / C), h = Math.ceil(Math.min(2000, el.clientHeight) / C); if (!w || !h) return;
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const c = cv.getContext("2d"), img = c.createImageData(w, h), g = rgbOf(cssv("--g")), a = rgbOf(cssv("--acc")), a2 = rgbOf(cssv("--acc2"));
    const mix = (p, q, t) => p.map((v, i) => Math.round(v + (q[i] - v) * t));
    // light ground: soft tints toward the ground. dark ground: pure accents with more ground showing,
    // because a tint mixed toward near-black goes muddy (brown on Carbon, maroon on Ultraviolet)
    const light = g[0] + g[1] + g[2] > 380;
    const pal = light ? [g, mix(g, a2, 0.45), mix(g, a, 0.75), a] : [g, a2, a, mix(a, [255, 255, 255], 0.35)];
    const bias = light ? -0.6 : -0.8;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = x * C, Y = y * C;   // noise in CSS px so the shapes keep their size at any cell size
      const wx = X / 260 + fbm(X / 330 + seed, Y / 230) * 1.6, wy = Y / 170 + fbm(X / 300 + 3, Y / 190 + seed) * 1.2;
      const v = Math.min(1, Math.max(0, fbm(wx, wy) * 1.8 + bias + (X / (w * C)) * 0.25));
      const k = Math.min(3, Math.max(0, Math.floor(v * 3.6 + (BAYER[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * 0.95)));
      const o = (y * w + x) * 4, col = pal[k]; img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    el.style.backgroundImage = `url(${cv.toDataURL()})`;
  };
  const fields = [...document.querySelectorAll(".band.dither")];
  const drawDither = () => fields.forEach(drawField);
  let fieldT; new ResizeObserver(() => { clearTimeout(fieldT); fieldT = setTimeout(drawDither, 200); }).observe(document.querySelector("main"));
  drawDither(); document.fonts.ready.then(drawDither);
})();
