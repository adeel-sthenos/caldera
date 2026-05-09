// ---- Live clock (Eastern Time, since the company is in DC/MD) ----
function updateClock() {
  const now = new Date();
  const opts = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York' };
  const el = document.getElementById('clock');
  if (el) el.textContent = now.toLocaleTimeString('en-US', opts);
}
updateClock();
setInterval(updateClock, 30000);

// ---- Hero scroll effects ---------------------------------------------------
// • Pin the hero for 5% of total page scroll (sticky runway).
// • Gentle zoom on the image as the user scrolls past.
// • Dark overlay fades from 0 to 0.3 across the same range.
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (n) => Math.max(0, Math.min(1, n));

const heroImg     = document.querySelector('.hero-img');
const heroSticky  = document.querySelector('.hero__sticky, .subhero__sticky');
const heroSection = heroSticky ? heroSticky.parentElement : null;
const heroOverlay = document.querySelector('.hero__overlay, .subhero__overlay');

// Extend the hero section so it pins for ~5% of the rest of the page's scroll.
function setHeroRunway() {
  if (!heroSection || !heroSticky) return;
  // Reset to CSS default before measuring, otherwise our previous extension
  // would inflate the next reading.
  heroSection.style.height = '';
  // Force a layout read after the reset.
  const stickyHeight = heroSticky.offsetHeight;
  const pageHeight = document.documentElement.scrollHeight;
  const runway = Math.max(0, (pageHeight - stickyHeight) * 0.05);
  heroSection.style.height = `${stickyHeight + runway}px`;
}

if (heroSection) {
  // Measure once initial layout has settled.
  requestAnimationFrame(setHeroRunway);
  window.addEventListener('load', setHeroRunway);
  window.addEventListener('resize', setHeroRunway);
}

if (heroImg) {
  let ticking = false;
  function onHeroScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      // Only do work while the hero is in or near the viewport.
      if (y < vh * 1.5) {
        const p = clamp01(y / vh);
        const eased = easeOutCubic(p);
        // Gentler zoom: 1.04 → 1.18 (was 1.08 → 1.50).
        const scale = 1.04 + eased * 0.14;
        heroImg.style.transform = `scale(${scale})`;
        // Dark overlay: 0 → 0.3.
        if (heroOverlay) heroOverlay.style.opacity = String(eased * 0.3);
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onHeroScroll, { passive: true });
  window.addEventListener('resize', onHeroScroll, { passive: true });
  onHeroScroll();
}

// ---- Reveal on scroll for headings ----
const revealEls = document.querySelectorAll('.h-display, .act-full__h, .tech__h, .about__h, .cta-strip__h, .walls__cell-stat, .stats__num');
revealEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)';
});
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));
