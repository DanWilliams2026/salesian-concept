// Page transition — intercept same-origin link clicks
document.addEventListener('click', e => {
  const a = e.target.closest('a');
  if (!a || !a.href) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  if (a.target === '_blank') return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (url.pathname === location.pathname && url.hash) return;
  e.preventDefault();
  document.body.classList.add('page-out');
  setTimeout(() => { location.href = a.href; }, 280);
});

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('main-nav');

  // Nav scroll — rAF throttled so it never runs more than once per paint frame
  let rafNav = false;
  function onScroll() {
    if (rafNav) return;
    rafNav = true;
    requestAnimationFrame(() => {
      rafNav = false;
      const scrolled = window.scrollY > 60;
      nav?.classList.toggle('scrolled', scrolled);
      nav?.classList.toggle('at-top', !scrolled);
    });
  }
  window.addEventListener('scroll', onScroll, {passive: true});
  onScroll();

  // Scroll-reveal — auto-tag key elements, then observe
  document.querySelectorAll('.feat-card, .pillar, .stat-item, .tl-item, .data-table tr, article').forEach((el, i) => {
    if (!el.hasAttribute('data-reveal')) {
      el.setAttribute('data-reveal', '');
      el.setAttribute('data-delay', String((i % 6) + 1));
    }
  });

  const revealIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealIo.unobserve(entry.target);
      }
    });
  }, {threshold: 0.1, rootMargin: '0px 0px -32px 0px'});

  document.querySelectorAll('[data-reveal]').forEach(el => revealIo.observe(el));

  // Active nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item > a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // Modal
  window.openModal = function() {
    document.getElementById('modal')?.classList.add('open');
    const wrap = document.getElementById('modal-form-wrap');
    const success = document.getElementById('modal-success');
    if (wrap) wrap.style.display = 'block';
    if (success) success.style.display = 'none';
  };
  window.closeModal = function() {
    document.getElementById('modal')?.classList.remove('open');
  };
  window.submitForm = function() {
    document.getElementById('modal-form-wrap').style.display = 'none';
    document.getElementById('modal-success').style.display = 'block';
  };
  document.getElementById('modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal')) closeModal();
  });
});
