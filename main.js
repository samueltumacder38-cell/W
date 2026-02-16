/* =============================================
   MINECRAFT PORTFOLIO — SCREEN NAVIGATION JS
   ============================================= */

(function () {
  'use strict';

  // ────────── Splash texts ──────────
  const SPLASHES = [
    'Also try creativity!', 'Game dev is magic!', 'Now with 3D!',
    'Pixel perfect!', 'Craft your future!', 'Level up!',
    '100% organic pixels!', 'As seen on screen!', 'Also try Blender!',
    'Now hiring!', '10/10 would hire!', 'Open for collab!',
    'Building worlds daily!', 'Achievement unlocked!', 'Press F5!',
    'New textures!', 'Try spinning!', 'Low poly is art!',
  ];

  // ────────── Loading tips ──────────
  const TIPS = [
    'Building terrain...', 'Loading chunks...', 'Spawning mobs...',
    'Generating ores...', 'Lighting up caves...', 'Planting trees...',
    'Filling oceans...', 'Crafting workbench...', 'Preparing spawn point...',
    'Simulating world...', 'Loading textures...', 'Compiling shaders...',
  ];

  // ────────── State ──────────
  let loadingTarget = null;
  let galleryItems = [];
  let currentGalleryIndex = 0;
  let openGalleryModalAt = null;

  // ────────── DOM Helpers ──────────
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

  // ────────── SCREEN NAVIGATION ──────────
  function showScreen(id, skipLoading) {
    const target = document.getElementById(id);
    if (!target) return;

    // Content screens go through loading
    const contentScreens = ['screen-about', 'screen-portfolio', 'screen-gameproject', 'screen-contact'];
    if (!skipLoading && contentScreens.includes(id)) {
      startLoading(id);
      return;
    }

    // Hide all screens
    $$('.mc-screen').forEach(s => {
      s.classList.remove('active', 'mc-screen-enter');
    });

    // Show target
    target.classList.add('active', 'mc-screen-enter');

    // Restart particles if going back to title
    if (id === 'screen-title') initParticles();

  }

  // ────────── LOADING SCREEN ──────────
  function startLoading(targetId) {
    loadingTarget = targetId;
    showScreen('screen-loading', true);

    const bar = $('#loadingBar');
    const tip = $('#loadingTip');
    bar.style.width = '0%';
    tip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 18 + 4;
      if (progress >= 100) {
        progress = 100;
        bar.style.width = '100%';
        clearInterval(interval);
        setTimeout(() => {
          showScreen(loadingTarget, true);
          loadingTarget = null;
        }, 350);
      } else {
        bar.style.width = progress + '%';
        if (Math.random() > 0.55) {
          tip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
        }
      }
    }, 120);
  }

  // ────────── WORLD SELECTION ──────────
  function initWorldSelection() {
    const entries = $$('.mc-world-entry');

    function playEntry(entry) {
      const goto = entry.getAttribute('data-goto');
      if (!goto) return;

      const projectIndexRaw = entry.getAttribute('data-project-index');
      if (projectIndexRaw !== null) {
        const parsed = Number(projectIndexRaw);
        if (!Number.isNaN(parsed) && typeof openGalleryModalAt === 'function') {
          openGalleryModalAt(parsed);
          return;
        }
      }

      showScreen(goto);
    }

    // Click to open immediately
    entries.forEach(entry => {
      entry.addEventListener('click', () => {
        playEntry(entry);
      });
    });

    // Search
    const searchInput = $('#worldSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        entries.forEach(entry => {
          const name = (entry.getAttribute('data-world-name') || '').toLowerCase();
          const details = (entry.querySelector('.mc-world-details')?.textContent || '').toLowerCase();
          entry.style.display = (name.includes(q) || details.includes(q)) ? '' : 'none';
        });
      });
    }
  }

  // ────────── GALLERY MODAL ──────────
  function initGallery() {
    galleryItems = $$('.mc-gallery-item');
    const modal = $('#portfolioModal');
    const modalImg = $('#modalImage');
    const modalVid = $('#modalVideo');
    const modalVidSrc = $('#modalVideoSource');
    const modalTitle = $('#modalTitle');
    const modalDesc = $('#modalDescription');
    const closeBtn = $('.mc-modal-close');
    const prevBtn = $('.mc-modal-prev');
    const nextBtn = $('.mc-modal-next');

    function openModal(index) {
      currentGalleryIndex = index;
      const item = galleryItems[index];
      if (!item) return;

      const img = item.querySelector('img');
      const vid = item.querySelector('video');
      const overlay = item.querySelector('.mc-item-overlay');
      const title = overlay?.querySelector('h4')?.textContent || '';
      const desc = overlay?.querySelector('p')?.textContent || '';

      modalTitle.textContent = title;
      modalDesc.textContent = desc;

      if (vid) {
        modalImg.classList.remove('show');
        modalVid.classList.add('show');
        modalVidSrc.src = vid.querySelector('source')?.src || vid.src;
        modalVid.load();
        modalVid.play().catch(() => {});
      } else if (img) {
        modalVid.classList.remove('show');
        modalVid.pause();
        modalImg.classList.add('show');
        modalImg.src = img.src;
        modalImg.alt = img.alt;
      }

      // Arrow visibility
      prevBtn.classList.toggle('hidden', index <= 0);
      nextBtn.classList.toggle('hidden', index >= galleryItems.length - 1);

      modal.classList.add('show');
    }

    openGalleryModalAt = openModal;

    function closeModal() {
      modal.classList.remove('show');
      modalVid.pause();
    }

    galleryItems.forEach((item, i) => {
      item.addEventListener('click', () => openModal(i));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') openModal(i);
      });
    });

    closeBtn?.addEventListener('click', closeModal);
    prevBtn?.addEventListener('click', () => {
      if (currentGalleryIndex > 0) openModal(currentGalleryIndex - 1);
    });
    nextBtn?.addEventListener('click', () => {
      if (currentGalleryIndex < galleryItems.length - 1) openModal(currentGalleryIndex + 1);
    });

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('show')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft' && currentGalleryIndex > 0) openModal(currentGalleryIndex - 1);
      if (e.key === 'ArrowRight' && currentGalleryIndex < galleryItems.length - 1) openModal(currentGalleryIndex + 1);
    });
  }

  // ────────── CERTIFICATE PREVIEW ──────────
  function initCertificate() {
    const cert = $('.mc-cert-card');
    if (!cert) return;

    cert.addEventListener('click', () => {
      const imgSrc = cert.getAttribute('data-certificate-image');
      const title = cert.getAttribute('data-certificate-title');
      const desc = cert.getAttribute('data-certificate-description');
      if (!imgSrc) return;

      const modal = $('#portfolioModal');
      const modalImg = $('#modalImage');
      const modalVid = $('#modalVideo');
      const modalTitle = $('#modalTitle');
      const modalDesc = $('#modalDescription');
      const prevBtn = $('.mc-modal-prev');
      const nextBtn = $('.mc-modal-next');

      modalVid.classList.remove('show');
      modalVid.pause();
      modalImg.classList.add('show');
      modalImg.src = imgSrc;
      modalImg.alt = title || 'Certificate';
      modalTitle.textContent = title || '';
      modalDesc.textContent = desc || '';
      prevBtn?.classList.add('hidden');
      nextBtn?.classList.add('hidden');

      modal.classList.add('show');
    });

    cert.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') cert.click();
    });
  }

  // ────────── GLOBAL DATA-GOTO HANDLER ──────────
  function initNavigation() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-goto]');
      if (!btn) return;
      // Skip world entries — they use select/dblclick
      if (btn.classList.contains('mc-world-entry')) return;
      e.preventDefault();
      showScreen(btn.getAttribute('data-goto'));
    });
  }

  // ────────── SPLASH TEXT ──────────
  function initSplash() {
    const el = $('.mc-splash');
    if (!el) return;
    el.textContent = SPLASHES[Math.floor(Math.random() * SPLASHES.length)];
  }

  // ────────── BACKGROUND PARTICLES (Title Screen) ──────────
  let particleAnimId = null;

  function initParticles() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ['#5B8731', '#8B6914', '#7F7F7F', '#BC9862', '#3978A8', '#FFAA00', '#C45A38', '#3D3D3D'];
    const BLOCK = 8;
    const COUNT = 60;

    const blocks = [];
    for (let i = 0; i < COUNT; i++) {
      blocks.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.3 + Math.random() * 0.7,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: BLOCK + Math.floor(Math.random() * 6),
        opacity: 0.25 + Math.random() * 0.4,
      });
    }

    if (particleAnimId) cancelAnimationFrame(particleAnimId);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      blocks.forEach(b => {
        ctx.globalAlpha = b.opacity;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.size, b.size);
        b.y += b.speed;
        if (b.y > canvas.height) {
          b.y = -b.size;
          b.x = Math.random() * canvas.width;
        }
      });
      ctx.globalAlpha = 1;
      particleAnimId = requestAnimationFrame(draw);
    }
    draw();

    // Resize handler
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  // ────────── INIT ──────────
  function init() {
    initSplash();
    initNavigation();
    initWorldSelection();
    initGallery();
    initCertificate();
    initParticles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
