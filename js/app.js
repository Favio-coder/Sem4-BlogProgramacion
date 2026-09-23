"use strict";
/* =====================================================
   DevBlog — app.ts
   Lógica interactiva: contadores, scroll reveal, carrusel,
   filtros, partículas, monitor de rendimiento y más.
   ===================================================== */
// ---------- Utilidades ----------
function qs(selector, parent = document) {
    return parent.querySelector(selector);
}
function qsa(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}
// =====================================================
// 1. SCROLL REVEAL ([data-animate])
// =====================================================
function initScrollReveal() {
    const items = qsa("[data-animate]");
    if (!items.length)
        return;
    items.forEach((el, i) => {
        if (!el.style.getPropertyValue("--delay")) {
            el.style.setProperty("--delay", `${(i % 6) * 80}ms`);
        }
    });
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -60px 0px" });
    items.forEach((el) => observer.observe(el));
}
// Marca automáticamente secciones/tarjetas comunes con data-animate
// para no tener que tocar cada bloque del HTML a mano.
function autoTagRevealElements() {
    const selectors = [
        "#categorias .category-card",
        "#articulos .article-card",
        ".runtime-card",
        "#learningCarousel",
    ];
    selectors.forEach((sel) => {
        qsa(sel).forEach((el) => {
            if (!el.hasAttribute("data-animate")) {
                el.setAttribute("data-animate", "zoom");
            }
        });
    });
}
// =====================================================
// 2. CONTADORES ANIMADOS
// =====================================================
function animateCounter(el, target, duration = 1600) {
    const start = performance.now();
    el.classList.add("counting");
    function tick(now) {
        const progress = clamp((now - start) / duration, 0, 1);
        const eased = easeOutExpo(progress);
        const value = Math.round(eased * target);
        el.textContent = value.toString();
        if (progress < 1) {
            requestAnimationFrame(tick);
        }
        else {
            el.textContent = target.toString();
            el.classList.remove("counting");
        }
    }
    requestAnimationFrame(tick);
}
function initCounters() {
    const counters = qsa(".counter-value");
    if (!counters.length)
        return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = Number(el.dataset.target ?? "0");
                animateCounter(el, target);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach((el) => observer.observe(el));
}
// =====================================================
// 3. EFECTO "GROW ON HOVER" LETRA POR LETRA
// =====================================================
function splitIntoLetters(el) {
    const text = el.textContent ?? "";
    el.textContent = "";
    el.classList.add("letters");
    [...text].forEach((char) => {
        const span = document.createElement("span");
        span.className = "letter";
        span.textContent = char === " " ? "\u00A0" : char;
        el.appendChild(span);
    });
}
function initLetterHover() {
    qsa("[data-letters]").forEach(splitIntoLetters);
}
// =====================================================
// 4. CURSOR GLOW EN EL HERO
// =====================================================
function initCursorGlow() {
    const hero = qs("#inicio");
    if (!hero)
        return;
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.style.opacity = "0";
    hero.style.position = hero.style.position || "relative";
    hero.appendChild(glow);
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    hero.addEventListener("mouseenter", () => (glow.style.opacity = "1"));
    hero.addEventListener("mouseleave", () => (glow.style.opacity = "0"));
    hero.addEventListener("mousemove", (e) => {
        const rect = hero.getBoundingClientRect();
        targetX = e.clientX - rect.left;
        targetY = e.clientY - rect.top;
    });
    function render() {
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;
        glow.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
// =====================================================
// 5. TARJETAS MAGNÉTICAS (tilt 3D suave al pasar el mouse)
// =====================================================
function initMagneticCards() {
    const cards = qsa(".article-card, .category-card, .counter-card, .runtime-card");
    cards.forEach((card) => {
        card.classList.add("magnetic");
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty("--mx", `${x}px`);
            card.style.setProperty("--my", `${y}px`);
            const rotateX = ((y - rect.height / 2) / rect.height) * -6;
            const rotateY = ((x - rect.width / 2) / rect.width) * 6;
            card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });
    });
}
// =====================================================
// 6. CATEGORÍAS + ARTÍCULOS (filtro + búsqueda)
// =====================================================
const ARTICLES = [
    {
        id: 1,
        title: "Closures en JavaScript, explicados de una vez por todas",
        excerpt: "Cómo funciona el lexical scoping y por qué los closures son la base de tantos patrones modernos.",
        category: "javascript",
        tag: "JavaScript",
        date: "2026-01-12",
        readTime: "6 min",
    },
    {
        id: 2,
        title: "Event Loop: microtasks, macrotasks y render",
        excerpt: "Un recorrido visual por cómo el navegador decide qué ejecutar primero y cuándo pinta la pantalla.",
        category: "javascript",
        tag: "JavaScript",
        date: "2026-02-03",
        readTime: "8 min",
    },
    {
        id: 3,
        title: "Serverless en la práctica: primeros pasos",
        excerpt: "Desplegando funciones sin preocuparte por servidores, con ejemplos reales de despliegue.",
        category: "cloud",
        tag: "Cloud",
        date: "2026-02-18",
        readTime: "7 min",
    },
    {
        id: 4,
        title: "Contenedores vs. serverless: cuándo usar cada uno",
        excerpt: "Comparativa práctica de costos, latencia y complejidad operativa entre ambos enfoques.",
        category: "cloud",
        tag: "Cloud",
        date: "2026-03-05",
        readTime: "9 min",
    },
    {
        id: 5,
        title: "Embeddings y búsqueda semántica desde cero",
        excerpt: "Cómo representar texto como vectores y construir un buscador semántico simple.",
        category: "ia",
        tag: "IA",
        date: "2026-03-21",
        readTime: "10 min",
    },
    {
        id: 6,
        title: "Fine-tuning vs. prompting: qué elegir",
        excerpt: "Ventajas, costos y casos de uso reales para decidir entre ajustar un modelo o mejorar el prompt.",
        category: "ia",
        tag: "IA",
        date: "2026-04-02",
        readTime: "7 min",
    },
    {
        id: 7,
        title: "Canvas API: partículas y animación con delta time",
        excerpt: "Construyendo un motor de partículas ligero usando requestAnimationFrame y delta time.",
        category: "javascript",
        tag: "JavaScript",
        date: "2026-04-15",
        readTime: "8 min",
    },
    {
        id: 8,
        title: "CI/CD para proyectos cloud-native",
        excerpt: "Pipelines que despliegan de forma segura en cada push, con rollback automático.",
        category: "cloud",
        tag: "Cloud",
        date: "2026-05-01",
        readTime: "6 min",
    },
];
function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}
function renderArticles(list) {
    const container = qs("#articlesContainer");
    if (!container)
        return;
    container.innerHTML = "";
    if (list.length === 0) {
        const empty = document.createElement("p");
        empty.className = "text-gray-500 font-mono text-sm col-span-full text-center py-12";
        empty.textContent = "// No se encontraron artículos con esos filtros";
        container.appendChild(empty);
        return;
    }
    list.forEach((article, i) => {
        const card = document.createElement("article");
        card.className = "article-card pop-in";
        card.style.setProperty("--delay", `${(i % 6) * 60}ms`);
        card.dataset.category = article.category;
        card.innerHTML = `
      <span class="article-tag">${article.tag}</span>
      <h3 class="article-title">${article.title}</h3>
      <p class="article-excerpt">${article.excerpt}</p>
      <div class="article-meta">
        <span>${formatDate(article.date)}</span>
        <span>${article.readTime} de lectura</span>
      </div>
    `;
        container.appendChild(card);
    });
    // Reaplica el efecto magnético a las tarjetas nuevas
    initMagneticCards();
}
function initCategoriesAndArticles() {
    const buttons = qsa(".category-card");
    const searchInput = qs("#searchInput");
    let activeCategory = "todos";
    function applyFilters() {
        const query = (searchInput?.value ?? "").trim().toLowerCase();
        const filtered = ARTICLES.filter((article) => {
            const matchesCategory = activeCategory === "todos" || article.category === activeCategory;
            const matchesQuery = query === "" ||
                article.title.toLowerCase().includes(query) ||
                article.excerpt.toLowerCase().includes(query);
            return matchesCategory && matchesQuery;
        });
        renderArticles(filtered);
    }
    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            buttons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            activeCategory = btn.dataset.category ?? "todos";
            applyFilters();
        });
    });
    let debounceTimer;
    searchInput?.addEventListener("input", () => {
        window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(applyFilters, 200);
    });
    applyFilters();
}
// =====================================================
// 7. CARRUSEL DE APRENDIZAJE
// =====================================================
function initLearningCarousel() {
    const track = qs("#learningTrack");
    const slides = qsa(".learning-slide", track ?? document);
    const dots = qsa(".carousel-dot");
    const prevBtn = qs("#prevLearning");
    const nextBtn = qs("#nextLearning");
    const status = qs("#carouselStatus");
    if (!track || slides.length === 0)
        return;
    const labels = ["JAVASCRIPT", "DOM", "CANVAS", "EVENT LOOP", "PERFORMANCE"];
    let current = 0;
    let autoplayTimer;
    function goTo(index) {
        current = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
        if (status) {
            status.textContent = `MODULE_0${current + 1} // ${labels[current] ?? ""}`;
        }
    }
    function next() {
        goTo(current + 1);
    }
    function prev() {
        goTo(current - 1);
    }
    nextBtn?.addEventListener("click", () => {
        next();
        restartAutoplay();
    });
    prevBtn?.addEventListener("click", () => {
        prev();
        restartAutoplay();
    });
    dots.forEach((dot) => {
        dot.addEventListener("click", () => {
            const target = Number(dot.dataset.slideTo ?? "0");
            goTo(target);
            restartAutoplay();
        });
    });
    function startAutoplay() {
        autoplayTimer = window.setInterval(next, 6000);
    }
    function restartAutoplay() {
        if (autoplayTimer)
            window.clearInterval(autoplayTimer);
        startAutoplay();
    }
    // Swipe táctil
    let touchStartX = 0;
    track.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener("touchend", (e) => {
        const delta = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 40) {
            delta < 0 ? next() : prev();
            restartAutoplay();
        }
    }, { passive: true });
    const carousel = qs("#learningCarousel");
    carousel?.addEventListener("mouseenter", () => {
        if (autoplayTimer)
            window.clearInterval(autoplayTimer);
    });
    carousel?.addEventListener("mouseleave", restartAutoplay);
    goTo(0);
    startAutoplay();
}
// =====================================================
// 8. CANVAS: PARTÍCULAS + MONITOR DE RENDIMIENTO
// =====================================================
function initParticleCanvas() {
    const canvas = qs("#codeCanvas");
    if (!canvas)
        return;
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    let width = 0;
    let height = 0;
    let particles = [];
    const PARTICLE_COUNT = 90;
    const MAX_LINK_DIST = 120;
    function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        width = rect.width;
        height = rect.height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
    }
    function createParticles() {
        particles = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            radius: Math.random() * 1.6 + 0.8,
            hue: 140 + Math.random() * 30,
        }));
    }
    const mouse = { x: -9999, y: -9999 };
    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener("mouseleave", () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });
    let lastTime = performance.now();
    function step(now) {
        const dt = clamp(now - lastTime, 0, 48);
        lastTime = now;
        ctx.clearRect(0, 0, width, height);
        // Actualiza y dibuja partículas
        particles.forEach((p) => {
            p.x += p.vx * (dt / 16.67);
            p.y += p.vy * (dt / 16.67);
            if (p.x < 0 || p.x > width)
                p.vx *= -1;
            if (p.y < 0 || p.y > height)
                p.vy *= -1;
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 90) {
                p.x -= dx * 0.01;
                p.y -= dy * 0.01;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, 0.85)`;
            ctx.fill();
        });
        // Líneas entre partículas cercanas
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i];
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_LINK_DIST) {
                    ctx.strokeStyle = `rgba(34, 197, 94, ${1 - dist / MAX_LINK_DIST})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(step);
    }
    resize();
    createParticles();
    requestAnimationFrame(step);
    window.addEventListener("resize", () => {
        resize();
        createParticles();
    });
}
const TECH_ICONS = [
    { glyph: "JS", label: "JavaScript" },
    { glyph: "TS", label: "TypeScript" },
    { glyph: "</>", label: "HTML5" },
    { glyph: "#{}", label: "CSS3" },
    { glyph: "⬢", label: "Node.js" },
    { glyph: "☁", label: "Cloud" },
    { glyph: "AI", label: "IA" },
    { glyph: "git", label: "Git" },
];
function spawnSparks(card, count = 10) {
    for (let i = 0; i < count; i++) {
        const spark = document.createElement("span");
        spark.className = "spark";
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 30;
        spark.style.setProperty("--sx", `${Math.cos(angle) * distance}px`);
        spark.style.setProperty("--sy", `${Math.sin(angle) * distance}px`);
        spark.style.background = Math.random() > 0.5 ? "#4ade80" : "#22c55e";
        card.appendChild(spark);
        spark.addEventListener("animationend", () => spark.remove());
    }
}
function renderTechIcons() {
    const grid = qs("#techGrid");
    if (!grid)
        return;
    TECH_ICONS.forEach((tech, i) => {
        const card = document.createElement("div");
        card.className = "tech-icon-card";
        card.style.setProperty("--delay", `${(i % 8) * 60}ms`);
        card.setAttribute("data-animate", "zoom");
        card.innerHTML = `
      <span class="tech-icon-glyph">${tech.glyph}</span>
      <span class="tech-icon-label">${tech.label}</span>
    `;
        let lastSpark = 0;
        card.addEventListener("mouseenter", () => {
            spawnSparks(card, 12);
            lastSpark = performance.now();
        });
        card.addEventListener("mousemove", (e) => {
            const now = performance.now();
            if (now - lastSpark > 220) {
                spawnSparks(card, 2);
                lastSpark = now;
            }
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            card.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px) scale(1.05)`;
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });
        grid.appendChild(card);
    });
}
function initTrailCanvas() {
    const canvas = qs("#trailCanvas");
    if (!canvas)
        return;
    const ctx = canvas.getContext("2d");
    if (!ctx)
        return;
    let width = 0;
    let height = 0;
    let trail = [];
    let ripples = [];
    function resize() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        width = rect.width;
        height = rect.height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }
    let pointerX = -9999;
    let pointerY = -9999;
    let pointerActive = false;
    function updatePointer(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        pointerX = clientX - rect.left;
        pointerY = clientY - rect.top;
        pointerActive = true;
    }
    canvas.addEventListener("mousemove", (e) => updatePointer(e.clientX, e.clientY));
    canvas.addEventListener("mouseleave", () => (pointerActive = false));
    canvas.addEventListener("touchmove", (e) => {
        const t = e.touches[0];
        if (t)
            updatePointer(t.clientX, t.clientY);
    }, { passive: true });
    function addRipple(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        ripples.push({ x: clientX - rect.left, y: clientY - rect.top, radius: 4, alpha: 0.8 });
    }
    canvas.addEventListener("click", (e) => addRipple(e.clientX, e.clientY));
    canvas.addEventListener("touchstart", (e) => {
        const t = e.touches[0];
        if (t)
            addRipple(t.clientX, t.clientY);
    }, { passive: true });
    function step() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
        ctx.fillRect(0, 0, width, height);
        if (pointerActive) {
            trail.push({ x: pointerX, y: pointerY, life: 1 });
        }
        trail = trail.filter((p) => p.life > 0.02);
        trail.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5 * p.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(34, 197, 94, ${p.life * 0.65})`;
            ctx.fill();
            p.life *= 0.92;
        });
        ripples = ripples.filter((r) => r.alpha > 0.02);
        ripples.forEach((r) => {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(74, 222, 128, ${r.alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            r.radius += 2.2;
            r.alpha *= 0.955;
        });
        requestAnimationFrame(step);
    }
    resize();
    requestAnimationFrame(step);
    window.addEventListener("resize", resize);
}
const TERMINAL_SCRIPT = [
    { prompt: "$", html: `<span class="terminal-keyword">const</span> dev = <span class="terminal-string">"Favio"</span>;` },
    { prompt: "$", html: `<span class="terminal-comment">// construyendo interfaces con TypeScript</span>` },
    { prompt: "$", html: `npm run build` },
    { html: `<span class="terminal-comment">✓ compilado en 0.42s — 0 errores</span>`, pause: 900 },
];
function initTerminal() {
    const body = qs("#terminalBody");
    if (!body)
        return;
    let cancelled = false;
    const bodyEl = body;
    async function typeLine(target, html, speed = 22) {
        // Escribe caracter por caracter respetando las etiquetas HTML simples.
        const container = document.createElement("span");
        target.appendChild(container);
        let i = 0;
        return new Promise((resolve) => {
            function tick() {
                if (cancelled)
                    return resolve();
                i++;
                container.innerHTML = html.length > 0 ? extractVisible(html, i) : "";
                if (i <= visibleLength(html)) {
                    window.setTimeout(tick, speed);
                }
                else {
                    resolve();
                }
            }
            tick();
        });
    }
    function visibleLength(html) {
        const div = document.createElement("div");
        div.innerHTML = html;
        return (div.textContent ?? "").length;
    }
    function extractVisible(html, count) {
        let visible = 0;
        let result = "";
        let inTag = false;
        for (const char of html) {
            if (char === "<")
                inTag = true;
            if (!inTag) {
                if (visible >= count)
                    break;
                visible++;
            }
            result += char;
            if (char === ">")
                inTag = false;
        }
        return result;
    }
    async function runScript() {
        bodyEl.innerHTML = "";
        for (const line of TERMINAL_SCRIPT) {
            if (cancelled)
                return;
            const lineEl = document.createElement("div");
            if (line.prompt) {
                const promptSpan = document.createElement("span");
                promptSpan.className = "terminal-prompt";
                promptSpan.textContent = `${line.prompt} `;
                lineEl.appendChild(promptSpan);
            }
            bodyEl.appendChild(lineEl);
            await typeLine(lineEl, line.html);
            await new Promise((r) => window.setTimeout(r, line.pause ?? 350));
        }
        const cursorLine = document.createElement("div");
        const cursorPrompt = document.createElement("span");
        cursorPrompt.className = "terminal-prompt";
        cursorPrompt.textContent = "$ ";
        const cursor = document.createElement("span");
        cursor.className = "terminal-cursor";
        cursorLine.appendChild(cursorPrompt);
        cursorLine.appendChild(cursor);
        bodyEl.appendChild(cursorLine);
        await new Promise((r) => window.setTimeout(r, 2600));
        if (!cancelled)
            runScript();
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                cancelled = false;
                runScript();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });
    observer.observe(body);
}
const LIVE_STATS = [
    { id: "statLines", base: 128430, step: [3, 22], interval: [700, 1800] },
    { id: "statCoffees", base: 342, step: [0, 1], interval: [2500, 6000] },
    { id: "statCommits", base: 5871, step: [1, 3], interval: [1500, 3200] },
    { id: "statBugs", base: 96, step: [0, 1], interval: [4000, 9000] },
];
function bumpValue(el, value) {
    el.textContent = value.toLocaleString("es-PE");
    el.classList.add("bump");
    window.setTimeout(() => el.classList.remove("bump"), 160);
}
function initLiveStats() {
    const cards = LIVE_STATS.map((stat) => ({ stat, el: qs(`#${stat.id}`) }))
        .filter((entry) => entry.el !== null);
    if (!cards.length)
        return;
    const values = new Map();
    cards.forEach(({ stat, el }) => {
        values.set(stat.id, stat.base);
        el.textContent = stat.base.toLocaleString("es-PE");
    });
    function scheduleNext({ stat, el }) {
        const [minStep, maxStep] = stat.step;
        const [minInterval, maxInterval] = stat.interval;
        const delay = minInterval + Math.random() * (maxInterval - minInterval);
        window.setTimeout(() => {
            const increment = Math.round(minStep + Math.random() * (maxStep - minStep));
            const next = (values.get(stat.id) ?? stat.base) + increment;
            values.set(stat.id, next);
            if (increment > 0)
                bumpValue(el, next);
            scheduleNext({ stat, el });
        }, delay);
    }
    let started = false;
    const section = qs("#livestats");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !started) {
                started = true;
                cards.forEach(scheduleNext);
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });
    if (section)
        observer.observe(section);
}
function initRuntimeMonitor() {
    const fpsEl = qs("#fpsValue");
    const frameEl = qs("#frameValue");
    const longTaskEl = qs("#longTaskValue");
    const heapEl = qs("#heapValue");
    if (!fpsEl || !frameEl || !longTaskEl || !heapEl)
        return;
    let frames = 0;
    let lastFpsUpdate = performance.now();
    let lastFrameTime = performance.now();
    let longTaskCount = 0;
    // PerformanceObserver para long tasks (si el navegador lo soporta)
    if ("PerformanceObserver" in window) {
        try {
            const po = new PerformanceObserver((list) => {
                longTaskCount += list.getEntries().length;
                longTaskEl.textContent = longTaskCount.toString();
                if (longTaskCount > 0)
                    longTaskEl.classList.add("warn");
            });
            po.observe({ entryTypes: ["longtask"] });
        }
        catch {
            // longtask no soportado en este navegador; se ignora silenciosamente
        }
    }
    function updateHeap() {
        const perf = performance;
        if (perf.memory) {
            const usedMB = perf.memory.usedJSHeapSize / 1048576;
            heapEl.textContent = `${usedMB.toFixed(1)} MB`;
        }
        else {
            heapEl.textContent = "N/A";
        }
    }
    function loop(now) {
        frames++;
        const frameDuration = now - lastFrameTime;
        lastFrameTime = now;
        frameEl.textContent = `${frameDuration.toFixed(2)} ms`;
        frameEl.classList.toggle("warn", frameDuration > 32);
        if (now - lastFpsUpdate >= 500) {
            const fps = Math.round((frames * 1000) / (now - lastFpsUpdate));
            fpsEl.textContent = fps.toString();
            fpsEl.classList.toggle("warn", fps < 45);
            frames = 0;
            lastFpsUpdate = now;
            updateHeap();
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}
// =====================================================
// 10. NEWSLETTER FORM
// =====================================================
function initNewsletterForm() {
    const form = qs("#newsletterForm");
    const input = qs("#emailInput");
    const message = qs("#formMessage");
    if (!form || !input || !message)
        return;
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const value = input.value.trim();
        message.classList.remove("hidden", "success", "error");
        if (!EMAIL_REGEX.test(value)) {
            message.textContent = "// Ingresa un correo válido";
            message.classList.add("error");
            form.classList.add("shake");
            window.setTimeout(() => form.classList.remove("shake"), 400);
            return;
        }
        message.textContent = `// ¡Listo! Te avisaremos a ${value}`;
        message.classList.add("success", "pop-in");
        input.value = "";
    });
}
// =====================================================
// 11. NAVBAR: sombra dinámica al hacer scroll
// =====================================================
function initNavbarScroll() {
    const header = qs("header");
    if (!header)
        return;
    window.addEventListener("scroll", () => {
        const scrolled = window.scrollY > 12;
        header.classList.toggle("shadow-glow", scrolled);
        header.classList.toggle("border-white/10", true);
    });
}
// =====================================================
// INIT
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    renderTechIcons();
    autoTagRevealElements();
    initScrollReveal();
    initCounters();
    initLetterHover();
    initCursorGlow();
    initCategoriesAndArticles();
    initLearningCarousel();
    initParticleCanvas();
    initTrailCanvas();
    initTerminal();
    initLiveStats();
    initRuntimeMonitor();
    initNewsletterForm();
    initNavbarScroll();
    initMagneticCards();
});