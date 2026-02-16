// script.js

const WEDDING_DATE_ISO = "2026-06-26T16:00:00";

const RSVP_ENDPOINT_URL =
  "https://script.google.com/macros/s/AKfycbxyS2mqT1OpocizHskL3ynkyIJJS2rpOiBP_hZ_3OFAs4lGTwgnH51Panw9ewMfibaJ9g/exec";

const $ = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, "0");

// ✅ Mobile viewport height fix
function setupVhUnit() {
  const set = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };
  set();
  window.addEventListener("resize", set, { passive: true });
  window.addEventListener("orientationchange", set, { passive: true });
}

// ✅ MUSIC
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
    } catch {}

    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
    document.removeEventListener("scroll", unlock);
  };

  document.addEventListener("click", unlock, { passive: true });
  document.addEventListener("touchstart", unlock, { passive: true });
  document.addEventListener("scroll", unlock, { passive: true, once: true });
}

// ТАЙМЕР
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

// RSVP -> Google Sheets
async function sendToGoogleSheets(payload) {
  const res = await fetch(RSVP_ENDPOINT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;

  try { data = JSON.parse(text); }
  catch { data = { ok: false, raw: text }; }

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

    const payload = {
      guestName: $("guestName").value.trim(),
      attendance: $("attendance").value,
      guestsCount: Number($("guestsCount").value) || 1,
      phone: $("phone").value.trim() || "",
      comment: $("comment").value.trim() || "",
      createdAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    const oldText = submitBtn?.textContent || "";
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

  backBtn?.addEventListener("click", () => {
    if (thanks) thanks.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// Reveal
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

// Smooth anchor scroll
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

document.addEventListener("DOMContentLoaded", () => {
  setupVhUnit();
  setupBackgroundMusic();
  startCountdown();
  setupRSVP();
  setupScrollReveal();
  setupSlowAnchorScroll();
});
