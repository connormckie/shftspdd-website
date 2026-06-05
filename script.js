const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const menuBtn = document.querySelector(".menu-btn");
const mobileNav = document.getElementById("mobile-nav");

if (menuBtn && mobileNav) {
  menuBtn.addEventListener("click", () => {
    const open = menuBtn.getAttribute("aria-expanded") === "true";
    menuBtn.setAttribute("aria-expanded", String(!open));
    mobileNav.hidden = open;
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuBtn.setAttribute("aria-expanded", "false");
      mobileNav.hidden = true;
    });
  });
}