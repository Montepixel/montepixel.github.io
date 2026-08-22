(function () {
  const buttons = document.querySelectorAll("[data-set-lang]");
  const supported = Array.from(buttons, (button) => button.dataset.setLang);
  const panels = document.querySelectorAll("[data-locale]");
  const translations = window.PAGE_TRANSLATIONS || {};

  function preferredLanguage() {
    const saved = localStorage.getItem("montepixel-language");
    if (supported.includes(saved)) return saved;
    const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
    return supported.includes(browser) ? browser : "en";
  }

  function setLanguage(lang, updateHash) {
    if (!supported.includes(lang)) lang = supported.includes("en") ? "en" : supported[0];
    document.documentElement.lang = lang;
    localStorage.setItem("montepixel-language", lang);

    buttons.forEach((button) => {
      const active = button.dataset.setLang === lang;
      button.setAttribute("aria-pressed", String(active));
    });

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

    if (updateHash && location.hash.startsWith("#lang-")) history.replaceState(null, "", `#lang-${lang}`);
  }

  buttons.forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.setLang, true)));
  const hashLang = location.hash.match(/^#lang-(ru|en|es)$/)?.[1];
  setLanguage(hashLang || preferredLanguage(), false);

  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = new Date().getFullYear();

  const backTop = document.querySelector(".back-top");
  if (backTop) {
    const updateBackTop = () => backTop.classList.toggle("visible", window.scrollY > 540);
    updateBackTop();
    addEventListener("scroll", updateBackTop, { passive: true });
  }
})();
