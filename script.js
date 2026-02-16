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
// ✅ MUSIC: autoplay muted -> unmute after first click + fade in
// =======================
function setupBackgroundMusic() {
  const music = $("bg-music");
  if (!music) return;

  // на всякий: стартуем тихо после разблокировки
  const TARGET_VOLUME = 0.35;

  const enableSoundOnce = async () => {
    try {
      music.muted = false;
      music.volume = 0;

      // иногда браузеру надо явное play() после жеста
      await music.play().catch(() => {});

      let vol = 0;
      const step = 0.03;
      const tickMs = 180;

      const fade = setInterval(() => {
        vol = Math.min(TARGET_VOLUME, vol + step);
        music.volume = vol;
        if (vol >= TARGET_VOLUME) clearInterval(fade);
      }, tickMs);

      document.removeEventListener("click", enableSoundOnce);
      document.removeEventListener("touchstart", enableSoundOnce);
    } catch {
      // молча: если браузер упёрся, ничего страшного
    }
  };

  document.addEventListener("click", enableSoundOnce, { passive: true });
  document.addEventListener("touchstart", enableSoundOnce, { passive: true });
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
  setupBackgroundMusic();
  startCountdown();
  setupRSVP();
  setupScrollReveal();
  setupSlowAnchorScroll();
});
