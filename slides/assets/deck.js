/* ==========================================================================
   DPW · Slides — motor de apresentação (sem dependências)

   Teclas:  → espaço  avança · ← volta · Shift+→ pula para o próximo slide
            Home/End  início/fim · F tela cheia · N notas · B tela preta · ? ajuda

   Autoria:
     .f                  fragmento: aparece a cada tecla (variantes: zoom left right fade blur dimmed)
     data-with           aparece junto com o fragmento anterior
     data-hl="2-4"       ao aparecer, realça essas linhas do primeiro <pre class="code"> do slide
     data-hl="id:2 x:5"  realça linhas de <pre id="id"> e <pre id="x">; data-hl="" limpa o realce
     .f.ghost            fragmento invisível (só para mudar o realce do código)
     .focus-list         o fragmento mais recente fica em destaque e os anteriores esmaecem
     .in                 entra com animação escalonada quando o slide abre
     data-count="201"    número que conta de 0 até o valor (data-suffix opcional)
     ⟦texto⟧ no código   marca em vermelho  ·  ⟪texto⟫ marca em verde
     data-lang           ts (padrão) · sh · sql · json · ini · text
     <aside class="notes"> notas do professor (tecla N)
   ========================================================================== */

(() => {
  "use strict";

  const W = 1280;
  const H = 720;
  const root = document.documentElement;
  const deck = document.querySelector(".deck");
  const slides = Array.from(deck.querySelectorAll(":scope > .slide"));
  const label = deck.dataset.label || "";

  /* ---------- escala do palco ---------- */

  const fit = () => root.style.setProperty("--s", Math.min(innerWidth / W, innerHeight / H));
  addEventListener("resize", fit);
  fit();

  /* ---------- realce de sintaxe ---------- */

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const STR = /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y;

  const RULES = {
    ts: [
      ["c", /\/\/.*/y],
      ["s", STR],
      ["d", /@[A-Za-z_]\w*/y],
      ["k", /\b(?:import|from|export|default|class|const|let|var|async|await|function|return|new|if|else|for|of|in|throw|private|readonly|public|protected|static|extends|implements|type|interface|enum|true|false|null|undefined|this|try|catch|as|void|typeof)\b/y],
      ["t", /\b[A-Z][A-Za-z0-9_]*\b/y],
      ["f", /\b[a-z_$][\w$]*(?=\s*\()/y],
      ["n", /\b\d[\d_.]*\b/y],
      ["", /[A-Za-z_$][\w$]*/y],
    ],
    sh: [
      ["c", /#.*/y],
      ["s", STR],
      ["k", /--?[A-Za-z][\w-]*/y],
      ["n", /\b\d[\d.]*\b/y],
      ["w", /[^\s"'`]+/y],
    ],
    sql: [
      ["c", /--.*/y],
      ["s", /'(?:''|[^'])*'/y],
      ["t", /"(?:[^"])*"/y],
      ["k", /\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|ADD|DROP|COLUMN|CONSTRAINT|PRIMARY|KEY|FOREIGN|REFERENCES|ON|NOT|NULL|DEFAULT|AND|OR|INDEX|TYPE|AS|ENUM|LIMIT|OFFSET|ORDER|BY|JOIN|LEFT|RENAME|TO|SERIAL|ILIKE|LIKE|IS|CASCADE|RESTRICT|UNIQUE|COUNT|BEGIN|COMMIT|ROLLBACK|integer|varchar|character|varying|text|date|boolean|timestamp)\b/iy],
      ["n", /\b\d+\b/y],
      ["", /\w+/y],
    ],
    json: [
      ["t", /"(?:\\.|[^"\\])*"(?=\s*:)/y],
      ["s", /"(?:\\.|[^"\\])*"/y],
      ["k", /\b(?:true|false|null)\b/y],
      ["n", /-?\b\d[\d.]*\b/y],
    ],
    ini: [
      ["c", /#.*/y],
      ["t", /^[A-Z_][A-Z0-9_]*(?==)/y],
      ["s", /(?<==).+/y],
    ],
  };

  function tokenize(str, lang, state) {
    const rules = RULES[lang];
    if (!rules) return esc(str);
    let out = "";
    let pos = 0;
    while (pos < str.length) {
      let hit = false;
      for (const [cls, re] of rules) {
        re.lastIndex = pos;
        const m = re.exec(str);
        if (m && m[0].length) {
          let kind = cls;
          if (lang === "sh" && kind === "w") kind = state.first ? "f" : "";
          if (lang === "sh" && kind !== "c") state.first = false;
          out += kind ? `<span class="tk-${kind}">${esc(m[0])}</span>` : esc(m[0]);
          pos += m[0].length;
          hit = true;
          break;
        }
      }
      if (!hit) {
        out += esc(str[pos]);
        pos += 1;
      }
    }
    return out;
  }

  // ⟦vermelho⟧ e ⟪verde⟫ marcam trechos dentro do código
  function renderLine(line, lang) {
    const state = { first: true };
    let out = "";
    let mode = "";
    let buf = "";
    const flush = () => {
      if (!buf) return;
      const html = tokenize(buf, lang, state);
      out += mode ? `<span class="${mode}">${html}</span>` : html;
      buf = "";
    };
    for (const ch of line) {
      if (ch === "⟦" || ch === "⟪") { flush(); mode = ch === "⟦" ? "mk" : "mk-g"; }
      else if (ch === "⟧" || ch === "⟫") { flush(); mode = ""; }
      else buf += ch;
    }
    flush();
    return out;
  }

  function highlight(pre) {
    const lang = pre.dataset.lang || "ts";
    const raw = pre.textContent.replace(/^\s*\n/, "").replace(/\s+$/, "");
    const lines = raw.split("\n");
    const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
    const cut = indents.length ? Math.min(...indents) : 0;

    let html = "";
    if (pre.dataset.title || pre.classList.contains("term")) {
      const dots = pre.classList.contains("term") ? "<i></i><i></i><i></i>" : "";
      html += `<span class="ttl">${dots}${esc(pre.dataset.title || "Terminal")}</span>`;
    }
    for (const full of lines) {
      let line = full.slice(cut);
      if (lang === "sh" && line.startsWith("> ")) {
        html += `<span class="ln out">${renderLine(line.slice(2), "text") || " "}</span>`;
        continue;
      }
      // linha que começa com espaço é continuação do comando anterior: sem prompt
      const prompt = lang === "sh" && line.trim() && !/^[\s#]/.test(line)
        ? '<span class="tk-pr">❯ </span>' : "";
      html += `<span class="ln">${prompt}${renderLine(line, lang) || " "}</span>`;
    }
    pre.innerHTML = html;
  }

  document.querySelectorAll("pre.code").forEach(highlight);

  /* ---------- montagem dos passos ---------- */

  // data-order="n" agrupa fragmentos distantes no DOM (ex.: um trecho e o cartão que o explica)
  const steps = slides.map((s) => {
    const groups = [];
    const byOrder = new Map();
    s.querySelectorAll(".f").forEach((el) => {
      const o = el.dataset.order;
      if (o !== undefined) {
        if (byOrder.has(o)) return byOrder.get(o).push(el);
        const g = [el];
        byOrder.set(o, g);
        groups.push({ key: Number(o), g });
      } else if (el.hasAttribute("data-with") && groups.length) {
        groups[groups.length - 1].g.push(el);
      } else {
        groups.push({ key: groups.length, g: [el] });
      }
    });
    return groups.sort((a, b) => a.key - b.key).map((x) => x.g);
  });

  slides.forEach((s, i) => {
    s.querySelectorAll(".in").forEach((el, k) => el.style.setProperty("--i", k));
    if (!s.classList.contains("bare")) {
      const foot = document.createElement("div");
      foot.className = "foot";
      foot.innerHTML = `<span class="brand-mini">IFPE · Desenvolvimento de Projeto Web · ${esc(label)}</span><span>${i + 1} / ${slides.length}</span>`;
      s.appendChild(foot);
    }
  });

  const progress = document.createElement("div");
  progress.className = "progress";
  deck.appendChild(progress);

  /* ---------- realce de linhas ---------- */

  function ranges(spec) {
    const set = new Set();
    spec.split(",").forEach((part) => {
      const [a, b] = part.split("-").map(Number);
      for (let n = a; n <= (b || a); n++) set.add(n);
    });
    return set;
  }

  function applyHighlights(slide, revealed) {
    const pres = Array.from(slide.querySelectorAll("pre.code"));
    if (!pres.length) return;
    const state = new Map();
    for (const el of revealed) {
      if (!el.hasAttribute("data-hl")) continue;
      const v = el.dataset.hl.trim();
      if (!v) { pres.forEach((p) => state.set(p, null)); continue; }
      for (const tok of v.split(/\s+/)) {
        const m = tok.match(/^([A-Za-z][\w-]*):(.+)$/);
        const pre = m ? slide.querySelector(`#${m[1]}`) : pres[0];
        if (pre) state.set(pre, ranges(m ? m[2] : tok));
      }
    }
    pres.forEach((p) => {
      const set = state.get(p);
      p.classList.toggle("focus", !!set);
      p.querySelectorAll(".ln").forEach((ln, i) => ln.classList.toggle("lit", !!set && set.has(i + 1)));
    });
  }

  /* ---------- contadores ---------- */

  function count(el) {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const t0 = performance.now();
    const dur = 1200;
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const v = Math.round(target * (1 - Math.pow(1 - k, 3)));
      el.textContent = v.toLocaleString("pt-BR") + suffix;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const countersIn = (el) => [
    ...(el.matches("[data-count]") ? [el] : []),
    ...el.querySelectorAll("[data-count]"),
  ];

  /* ---------- estado e renderização ---------- */

  let cur = 0;
  let step = 0;
  let lastSlide = -1;

  const notesPanel = document.createElement("div");
  notesPanel.id = "notes-panel";
  notesPanel.className = "panel";
  document.body.appendChild(notesPanel);

  function render() {
    const slide = slides[cur];
    slides.forEach((s, i) => s.classList.toggle("active", i === cur));

    if (cur !== lastSlide) {
      slide.querySelectorAll("[data-count]").forEach((el) => { if (!el.closest(".f")) count(el); });
      lastSlide = cur;
    }

    const revealed = [];
    steps[cur].forEach((group, i) => {
      const on = i < step;
      for (const el of group) {
        if (on && !el.classList.contains("on")) countersIn(el).forEach(count);
        el.classList.toggle("on", on);
        el.classList.toggle("current", on && i === step - 1);
        if (on) revealed.push(el);
      }
    });
    applyHighlights(slide, revealed);

    const total = slides.length - 1 || 1;
    const within = steps[cur].length ? step / steps[cur].length : 1;
    progress.style.width = `${((cur + within) / (total + 1)) * 100}%`;

    const notes = slide.querySelector(".notes");
    notesPanel.innerHTML = `<b>Notas · slide ${cur + 1}</b><br>${notes ? notes.innerHTML : "Sem notas."}`;

    if (location.hash !== `#${cur + 1}`) history.replaceState(null, "", `#${cur + 1}`);
  }

  // ?revisao abre cada slide já completo — para estudar ou revisar sem passar item a item
  const FULL = new URLSearchParams(location.search).has("revisao");

  function go(i, s = 0) {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    step = FULL ? steps[cur].length : Math.max(0, Math.min(steps[cur].length, s));
    render();
  }

  const next = () => (step < steps[cur].length ? go(cur, step + 1) : go(cur + 1, 0));
  const prev = () =>
    FULL ? go(cur - 1) : step > 0 ? go(cur, step - 1) : cur > 0 && go(cur - 1, steps[cur - 1].length);

  /* ---------- entrada do usuário ---------- */

  const blackout = document.createElement("div");
  blackout.className = "blackout";
  document.body.appendChild(blackout);

  const help = document.createElement("div");
  help.id = "help-panel";
  help.className = "panel";
  help.innerHTML = `<table>
    <tr><td><kbd>→</kbd> <kbd>espaço</kbd></td><td>avança (revela o próximo item)</td></tr>
    <tr><td><kbd>←</kbd></td><td>volta</td></tr>
    <tr><td><kbd>Shift</kbd> + <kbd>→</kbd></td><td>próximo slide inteiro</td></tr>
    <tr><td><kbd>Home</kbd> <kbd>End</kbd></td><td>primeiro / último</td></tr>
    <tr><td><kbd>F</kbd></td><td>tela cheia</td></tr>
    <tr><td><kbd>N</kbd></td><td>notas do professor</td></tr>
    <tr><td><kbd>B</kbd></td><td>tela preta</td></tr>
    <tr><td><kbd>?</kbd></td><td>esta ajuda</td></tr>
  </table>`;
  document.body.appendChild(help);

  addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("button, input, textarea") && [" ", "Enter"].includes(e.key)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(k)) {
      e.preventDefault();
      e.shiftKey && k === "ArrowRight" ? go(cur + 1, 0) : next();
    } else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) {
      e.preventDefault();
      e.shiftKey && k === "ArrowLeft" ? go(cur - 1, 0) : prev();
    } else if (k === "Home") go(0);
    else if (k === "End") go(slides.length - 1, steps[slides.length - 1].length);
    else if (k === "f" || k === "F") {
      document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen?.();
    } else if (k === "n" || k === "N") notesPanel.classList.toggle("open");
    else if (k === "b" || k === "B" || k === ".") blackout.classList.toggle("on");
    else if (k === "?" || k === "h" || k === "H") help.classList.toggle("open");
    else if (k === "Escape") { help.classList.remove("open"); blackout.classList.remove("on"); }
  });

  let tx = null;
  addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    tx = null;
  });

  const nav = document.createElement("div");
  nav.className = "ui-nav";
  nav.innerHTML = '<button aria-label="Voltar">‹</button><button aria-label="Avançar">›</button>';
  nav.children[0].addEventListener("click", prev);
  nav.children[1].addEventListener("click", next);
  document.body.appendChild(nav);

  let uiTimer;
  addEventListener("mousemove", () => {
    document.body.classList.add("show-ui");
    clearTimeout(uiTimer);
    uiTimer = setTimeout(() => document.body.classList.remove("show-ui"), 2200);
  });

  // quiz interativo: <div class="quiz"> com <button data-ok> na resposta certa
  document.querySelectorAll(".quiz .choices button").forEach((b) => {
    b.addEventListener("click", () => {
      b.classList.add(b.hasAttribute("data-ok") ? "right" : "wrong");
      if (b.hasAttribute("data-ok")) b.closest(".quiz").classList.add("answered");
      b.blur();
    });
  });

  addEventListener("hashchange", () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (n && n - 1 !== cur) go(n - 1);
  });

  const start = parseInt(location.hash.slice(1), 10);
  go(start ? start - 1 : 0);

  // ?checar lista o que vaza do palco (para revisão de quem edita os slides)
  if (new URLSearchParams(location.search).has("checar")) {
    document.querySelectorAll(".f").forEach((el) => el.classList.add("on"));
    const out = [];
    slides.forEach((s, i) => {
      s.style.visibility = "visible";
      const box = s.getBoundingClientRect();
      const k = box.width / W;
      s.querySelectorAll("*").forEach((el) => {
        if (el.closest(".foot, .glow, .wm, .notes, .ghost") || !el.getClientRects().length) return;
        const r = el.getBoundingClientRect();
        const bottom = (r.bottom - box.top) / k;
        const right = (r.right - box.left) / k;
        const clipped = el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow === "hidden";
        if (bottom > H - 46 || right > W - 40 || clipped) {
          out.push(`slide ${i + 1}: <${el.tagName.toLowerCase()} class="${el.className}"> bottom=${Math.round(bottom)} right=${Math.round(right)}${clipped ? " CORTADO" : ""}`);
        }
      });
    });
    const pre = document.createElement("pre");
    pre.id = "relatorio";
    pre.textContent = out.join("\n") || "ok";
    document.body.appendChild(pre);
  }
})();
