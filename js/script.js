// ---- Mobile nav drawer toggle -----------------------------------------------
const navToggle = document.querySelector('.nav__toggle');
const navDrawer = document.querySelector('.nav__drawer');
if (navToggle && navDrawer) {
  function closeDrawer() {
    document.body.classList.remove('nav__menu-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  navToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav__menu-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navDrawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));
  // Close on Escape and on viewport widening past the breakpoint.
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1024) closeDrawer(); });
}

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
const heroVideo   = document.querySelector('.hero-video');
const heroSticky  = document.querySelector('.hero__sticky, .subhero__sticky');
const heroSection = heroSticky ? heroSticky.parentElement : null;
const heroOverlay = document.querySelector('.hero__overlay, .subhero__overlay');

// Extend the hero section so the user has scroll real-estate to either:
//   • scrub the hero video (when present) — give a full viewport of runway
//   • get the sticky-image runway effect on static hero pages — ~5% of page
function setHeroRunway() {
  if (!heroSection || !heroSticky) return;
  heroSection.style.height = '';
  const stickyHeight = heroSticky.offsetHeight;
  let runway;
  if (heroVideo) {
    runway = stickyHeight; // ~1 viewport extra = ~2 viewport heights total
  } else {
    const pageHeight = document.documentElement.scrollHeight;
    runway = Math.max(0, (pageHeight - stickyHeight) * 0.05);
  }
  heroSection.style.height = `${stickyHeight + runway}px`;
}

if (heroSection) {
  requestAnimationFrame(setHeroRunway);
  window.addEventListener('load', setHeroRunway);
  window.addEventListener('resize', setHeroRunway);
}

if (heroImg && !heroVideo) {
  let ticking = false;
  function onHeroScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      if (y < vh * 1.5) {
        const p = clamp01(y / vh);
        const eased = easeOutCubic(p);
        const scale = 1.04 + eased * 0.14;
        heroImg.style.transform = `scale(${scale})`;
        if (heroOverlay) heroOverlay.style.opacity = String(eased * 0.3);
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onHeroScroll, { passive: true });
  window.addEventListener('resize', onHeroScroll, { passive: true });
  onHeroScroll();
}

// ---- Scroll-scrubbed hero video --------------------------------------------
// Tie video.currentTime to scroll progress within the hero section.
// User scrolls → video plays. Video ends exactly when the user has scrolled
// past the hero runway, at which point the next section is right below.
if (heroVideo && heroSection) {
  heroVideo.pause();
  // Some browsers (notably iOS Safari) won't expose video.duration until the
  // metadata has actually loaded. Track readiness and gate the scrubber on it.
  let duration = 0;
  let ticking = false;

  function onVideoMeta() {
    duration = heroVideo.duration || 0;
    // Park the video at frame 0 so first paint isn't a black frame.
    try { heroVideo.currentTime = 0; } catch (e) { /* not yet seekable */ }
    onVideoScroll();
  }
  if (heroVideo.readyState >= 1) {
    onVideoMeta();
  } else {
    heroVideo.addEventListener('loadedmetadata', onVideoMeta, { once: true });
  }

  function onVideoScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (!duration) return;
      const rect = heroSection.getBoundingClientRect();
      // Total scrollable distance inside the hero (section height - viewport).
      const scrollable = Math.max(1, heroSection.offsetHeight - window.innerHeight);
      // How far we've scrolled into the section, clamped 0..1.
      const progress = clamp01(-rect.top / scrollable);
      // Map progress to video timeline. Subtract a tiny epsilon at the end so
      // the video sits on its final frame rather than firing `ended` repeatedly.
      const t = Math.min(duration - 0.001, progress * duration);
      try { heroVideo.currentTime = t; } catch (e) { /* ignore seek-not-ready */ }
      // Reuse the dark-overlay fade for narrative weight as we scrub.
      if (heroOverlay) heroOverlay.style.opacity = String(progress * 0.25);
    });
  }
  window.addEventListener('scroll', onVideoScroll, { passive: true });
  window.addEventListener('resize', () => { setHeroRunway(); onVideoScroll(); }, { passive: true });
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
