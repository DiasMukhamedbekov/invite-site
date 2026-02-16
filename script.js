// script.js

// =======================
// НАСТРОЙКЫ
// =======================

// Той уақыты (жергілікті уақыт): 26 маусым 2026 жыл, 16:00
const WEDDING_DATE_ISO = "2026-06-26T16:00:00";

// ✅ ТВОЙ Apps Script Web App URL
const RSVP_ENDPOINT_URL =
  "https://script.google.com/macros/s/AKfycbxyS2mqT1OpocizHskL3ynkyIJJS2rpOiBP_hZ_3OFAs4lGTwgnH51Panw9ewMfibaJ9g/exec";

const $ = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, "0");

// =======================
// ✅ LIVE BACKGROUND
// bokeh + sparkles + parallax
// =======================
function setupLiveBackground() {
  const bokehLayer = $("bokehLayer");
  const sparkleLayer = $("sparkleLayer");
  const photo = document.querySelector(".bg__photo");
  const mesh = document.querySelector(".bg__mesh");
  if (!bokehLayer || !sparkleLayer) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Create bokeh dots (soft circles)
  const BOKEH_COUNT = reduceMotion ? 10 : 18;
  const dots = [];

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  for (let i = 0; i < BOKEH_COUNT; i++) {
    const el = document.createElement("div");
    el.className = "bokeh-dot";

    const size = rand(120, 320);
    const startX = rand(-10, 110);
    const startY = rand(-10, 110);
    const endX = startX + rand(-18, 18);
    const endY = startY + rand(18, 42);

    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = `${startX}%`;
    el.style.top = `${startY}%`;

    el.style.setProperty("--x0", "0px");
    el.style.setProperty("--y0", "0px");
    el.style.setProperty("--x1", `${(endX - startX) * 6}px`);
    el.style.setProperty("--y1", `${(endY - startY) * 6}px`);
    el.style.setProperty("--s", `${rand(0.85, 1.25)}`);

    const duration = rand(14, 26);
    const delay = rand(-10, 0);
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;

    // tint variety: rose/lavender white-ish
    const tintPick = Math.random();
    if (tintPick < 0.33) el.style.filter = "hue-rotate(320deg) saturate(1.1)";
    else if (tintPick < 0.66) el.style.filter = "hue-rotate(260deg) saturate(1.1)";
    else el.style.filter = "saturate(1.05)";

    bokehLayer.appendChild(el);
    dots.push(el);
  }

  // --- Sparkles (small stars)
  const SPARKLE_COUNT = reduceMotion ? 8 : 14;

  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const sp = document.createElement("div");
    sp.className = "sparkle";

    sp.style.left = `${rand(6, 94)}%`;
    sp.style.top = `${rand(8, 92)}%`;

    const s = rand(10, 22);
    sp.style.width = `${s}px`;
    sp.style.height = `${s}px`;

    const duration = rand(2.8, 5.2);
    const delay = rand(0, 4);
    sp.style.animationDuration = `${duration}s`;
    sp.style.animationDelay = `${delay}s`;

    // slightly different brightness
    sp.style.opacity = "0";

    sparkleLayer.appendChild(sp);
  }

  if (reduceMotion) return;

  // --- Parallax (mouse + scroll) very subtle
  let mouseX = 0.5, mouseY = 0.5;
  let targetX = 0.5, targetY = 0.5;

  const onMove = (e) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    targetX = e.clientX / w;
    targetY = e.clientY / h;
  };

  window.addEventListener("mousemove", onMove, { passive: true });

  function loop() {
    // smooth
    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    const dx = (mouseX - 0.5) * 18;
    const dy = (mouseY - 0.5) * 14;

    const scrollY = window.scrollY || 0;
    const scrollPar = Math.min(18, scrollY / 120);

    if (photo) photo.style.transform = `scale(1.08) translate3d(${dx * 0.6}px, ${dy * 0.6 + scrollPar}px, 0)`;
    if (mesh) mesh.style.transform = `translate3d(${dx * 0.35}px, ${dy * 0.35}px, 0) scale(1.04)`;

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

// =======================
// ✅ MUSIC (mobile-friendly)
// autoplay muted -> unmute after first gesture (touch/click/scroll)
// =======================
function setupBackgroundMusic() {
  const music = $("bg-music");
  if (!music) return;

  const TARGET_VOLUME = 0.35;
  let unlocked = false;

  const unlock = async () => {
    if (unlocked) return;
    unlocked = true;

    try {
      music.muted = false;
      music.volume = 0;

      await music.play().catch(() => {});

      let v = 0;
      const fade = setInterval(() => {
        v = Math.min(TARGET_VOLUME, v + 0.03);
        music.volume = v;
        if (v >= TARGET_VOLUME) clearInterval(fade);
      }, 180);
    } catch {
      // ok
    }

    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
    document.removeEventListener("scroll", unlock);
  };

  document.addEventListener("click", unlock, { passive: true });
  document.addEventListener("touchstart", unlock, { passive: true });
  document.addEventListener("scroll", unlock, { passive: true, once: true });
}

// =======================
// ТАЙМЕР
// =======================
function startCountdown() {
  const target = new Date(WEDDING_DATE_ISO);

  function tick() {
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      $("cdDays").textContent = "0";
      $("cdHours").textContent = "00";
      $("cdMinutes").textContent = "00";
      $("cdSeconds").textContent = "00";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    $("cdDays").textContent = String(days);
    $("cdHours").textContent = pad2(hours);
    $("cdMinutes").textContent = pad2(minutes);
    $("cdSeconds").textContent = pad2(seconds);
  }

  tick();
  setInterval(tick, 1000);
}

// =======================
// RSVP -> Google Sheets
// =======================
async function sendToGoogleSheets(payload) {
  const res = await fetch(RSVP_ENDPOINT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = { ok: false, raw: text };
  }

  if (!data.ok) throw new Error(data.error || "Жіберу сәтсіз болды");
  return data;
}

function setupRSVP() {
  const form = $("rsvpForm");
  const thanks = $("thanksBox");
  const backBtn = $("backToFormBtn");
  const submitBtn = $("submitBtn");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const guestName = $("guestName").value.trim();
    const attendance = $("attendance").value;
    const guestsCount = Number($("guestsCount").value);
    const phone = $("phone").value.trim();
    const comment = $("comment").value.trim();

    const payload = {
      guestName,
      attendance,
      guestsCount: Number.isFinite(guestsCount) ? guestsCount : 1,
      phone: phone || "",
      comment: comment || "",
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    const oldText = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Жіберілуде…";
    }

    try {
      await sendToGoogleSheets(payload);

      form.hidden = true;
      if (thanks) thanks.hidden = false;

      form.reset();
      $("guestsCount").value = "1";
    } catch (err) {
      alert("Қате: " + (err?.message || err));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = oldText || "Жіберу";
      }
    }
  });

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      if (thanks) thanks.hidden = true;
      form.hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

// =======================
// ✅ Scroll reveal
// =======================
function setupScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  items.forEach((el) => io.observe(el));
}

// =======================
// ✅ Slower smooth scroll for anchors
// =======================
function setupSlowAnchorScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  if (!links.length) return;

  const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function animateScrollTo(targetY, duration = 1000) {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();

    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = easeInOutCubic(t);
      window.scrollTo(0, startY + diff * eased);
      if (t < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY;
      animateScrollTo(y, 1000);
    });
  });
}

// =======================
// START
// =======================
document.addEventListener("DOMContentLoaded", () => {
  setupLiveBackground();
  setupBackgroundMusic();
  startCountdown();
  setupRSVP();
  setupScrollReveal();
  setupSlowAnchorScroll();
});
