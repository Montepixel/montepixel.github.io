(function () {
  const root = document.documentElement;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js-ready");

  const buttons = document.querySelectorAll("[data-set-lang]");
  const supported = Array.from(buttons, (button) => button.dataset.setLang);
  const panels = document.querySelectorAll("[data-locale]");
  const translations = window.PAGE_TRANSLATIONS || {};
  const motionPermission = document.querySelector("[data-motion-permission]");
  const motionLabels = { ru: "Включить эффект движения", en: "Enable motion effect", es: "Activar efecto de movimiento" };

  function preferredLanguage() {
    const saved = localStorage.getItem("montepixel-language");
    if (supported.includes(saved)) return saved;
    const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
    return supported.includes(browser) ? browser : "en";
  }

  function setLanguage(lang, updateHash) {
    if (!supported.includes(lang)) lang = supported.includes("en") ? "en" : supported[0];
    root.lang = lang;
    localStorage.setItem("montepixel-language", lang);
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.setLang === lang)));
    panels.forEach((panel) => {
      const active = panel.dataset.locale === lang;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = translations[lang]?.[node.dataset.i18n];
      if (value) node.textContent = value;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
      const value = translations[lang]?.[node.dataset.i18nAria];
      if (value) node.setAttribute("aria-label", value);
    });
    if (translations[lang]?.title) document.title = translations[lang].title;
    const description = document.querySelector('meta[name="description"]');
    if (description && translations[lang]?.description) description.content = translations[lang].description;
    if (motionPermission) motionPermission.setAttribute("aria-label", motionLabels[lang] || motionLabels.en);
    if (updateHash && location.hash.startsWith("#lang-")) history.replaceState(null, "", `#lang-${lang}`);
  }

  buttons.forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.setLang, true)));
  const hashLang = location.hash.match(/^#lang-(ru|en|es)$/)?.[1];
  setLanguage(hashLang || preferredLanguage(), false);

  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = new Date().getFullYear();

  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".page-progress span");
  const backTop = document.querySelector(".back-top");
  let scrollTicking = false;

  function updateScrollUI() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const ratio = Math.min(1, Math.max(0, scrollY / max));
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    if (header) header.classList.toggle("scrolled", scrollY > 12);
    if (backTop) backTop.classList.toggle("visible", scrollY > 540);
    scrollTicking = false;
  }

  updateScrollUI();
  addEventListener("scroll", () => {
    if (!scrollTicking) requestAnimationFrame(updateScrollUI);
    scrollTicking = true;
  }, { passive: true });

  const revealItems = document.querySelectorAll("[data-reveal]");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -9%", threshold: .08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const navLinks = document.querySelectorAll('.nav a[href^="#"]');
  const sections = Array.from(navLinks, (link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${current.target.id}`));
    }, { rootMargin: "-30% 0px -55%", threshold: [0, .25, .55] });
    sections.forEach((section) => navObserver.observe(section));
  }

  if (!reducedMotion) {
    const stage = document.querySelector("[data-parallax]");
    const mainCard = stage?.querySelector(".stage-main");
    let ambientFrame = 0;
    let nextAmbient = null;

    function scheduleAmbient(clientX, clientY, shiftX, shiftY) {
      nextAmbient = { clientX, clientY, shiftX, shiftY };
      if (ambientFrame) return;
      ambientFrame = requestAnimationFrame(() => {
        root.style.setProperty("--glow-x", `${nextAmbient.clientX}px`);
        root.style.setProperty("--glow-y", `${nextAmbient.clientY}px`);
        root.style.setProperty("--ambient-shift-x", `${nextAmbient.shiftX}px`);
        root.style.setProperty("--ambient-shift-y", `${nextAmbient.shiftY}px`);
        ambientFrame = 0;
      });
    }

    if (matchMedia("(pointer: fine)").matches) {
      addEventListener("pointermove", (event) => {
        const x = event.clientX / innerWidth - .5;
        const y = event.clientY / innerHeight - .5;
        scheduleAmbient(event.clientX, event.clientY, x * -10, y * -10);
      }, { passive: true });

      stage?.addEventListener("pointermove", (event) => {
        const rect = stage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        mainCard.style.transform = `rotateY(${x * 7 - 6}deg) rotateX(${y * -6 + 2}deg) translate3d(${x * 8}px,${y * 8}px,0)`;
      });
      stage?.addEventListener("pointerleave", () => { mainCard.style.transform = ""; });

      document.querySelectorAll("[data-tilt]").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - .5;
          const y = (event.clientY - rect.top) / rect.height - .5;
          card.style.setProperty("--rx", `${y * -2.6}deg`);
          card.style.setProperty("--ry", `${x * 3.2}deg`);
        });
        card.addEventListener("pointerleave", () => {
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
        });
      });
    } else {
      const handleOrientation = (event) => {
        if (!Number.isFinite(event.gamma) || !Number.isFinite(event.beta)) return;
        const x = Math.max(-1, Math.min(1, event.gamma / 35));
        const y = Math.max(-1, Math.min(1, (event.beta - 40) / 45));
        scheduleAmbient(innerWidth * (.5 + x * .22), innerHeight * (.42 + y * .16), x * -12, y * -10);
        if (mainCard) mainCard.style.transform = `rotateY(${x * 3.5 - 4}deg) rotateX(${y * -3 + 1}deg) translate3d(${x * 5}px,${y * 5}px,0)`;
      };

      addEventListener("deviceorientation", handleOrientation, { passive: true });
      if (motionPermission && typeof window.DeviceOrientationEvent?.requestPermission === "function") {
        motionPermission.hidden = false;
        motionPermission.addEventListener("click", async () => {
          try {
            const result = await window.DeviceOrientationEvent.requestPermission();
            if (result === "granted") motionPermission.hidden = true;
          } catch (_) {
            motionPermission.hidden = true;
          }
        });
      }

      addEventListener("touchmove", (event) => {
        const touch = event.touches[0];
        if (!touch) return;
        const x = touch.clientX / innerWidth - .5;
        const y = touch.clientY / innerHeight - .5;
        scheduleAmbient(touch.clientX, touch.clientY, x * -8, y * -8);
      }, { passive: true });
    }
  }
})();
