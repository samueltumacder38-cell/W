(() => {
  const typingState = {
    words: ["a Game Developer", "a 3D Modeler", "a 2D Artist"],
    wordIdx: 0,
    charIdx: 0,
    deleting: false,
    el: null
  };

  const galleryState = { items: [], index: 0 };
  const particleField = {
    canvas: null,
    ctx: null,
    particles: [],
    bounds: { width: 0, height: 0 },
    animationId: null,
    resizeHandler: null,
    pointerHandlers: {},
    mouse: { x: 0, y: 0, active: false },
    config: {
      density: 22000,
      maxCount: 140,
      minSpeed: 0.05,
      maxSpeed: 0.4,
      baseSize: 1.2,
      linkDistance: 140,
      mouseRadius: 160
    }
  };
  const dom = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    initTypingEffect();
    initScrollHandlers();
    initScrollTriggers();
    initPortfolioInteractions();
    initCertificatePreview();
    initModalControls();
    initKeyboardShortcuts();
    initParticleField();
  }

  function cacheDom() {
    dom.sections = Array.from(document.querySelectorAll('section'));
    dom.dockItems = Array.from(document.querySelectorAll('.dock-item'));
    dom.scrollTriggers = Array.from(document.querySelectorAll('[data-scroll-target]'));
    dom.portfolioItems = Array.from(document.querySelectorAll('.portfolio-item'));
    dom.modal = document.getElementById('portfolioModal');
    dom.modalImage = document.getElementById('modalImage');
    dom.modalVideo = document.getElementById('modalVideo');
    dom.modalVideoSource = document.getElementById('modalVideoSource');
    dom.modalTitle = document.getElementById('modalTitle');
    dom.modalDescription = document.getElementById('modalDescription');
    dom.modalClose = document.querySelector('.modal-close');
    dom.modalPrev = document.querySelector('.modal-prev');
    dom.modalNext = document.querySelector('.modal-next');
    dom.galleryMap = buildGalleryMap();
    dom.certificateCards = Array.from(document.querySelectorAll('.certificate-card[data-certificate-image]'));
    dom.hero = document.querySelector('.hero');
    dom.heroCanvas = document.querySelector('.hero-particles');
  }

  function buildGalleryMap() {
    const map = new Map();
    document.querySelectorAll('.portfolio-category').forEach(category => {
      const label = category.textContent.trim();
      const gallery = category.nextElementSibling;
      if (gallery && gallery.classList.contains('portfolio-gallery')) {
        map.set(label, Array.from(gallery.querySelectorAll('.portfolio-item')));
      }
    });
    map.set('Award', Array.from(document.querySelectorAll('.award-card')));
    return map;
  }

  function initTypingEffect() {
    typingState.el = document.querySelector('.typed');
    if (!typingState.el) return;
    typeEffect();
  }

  function typeEffect() {
    const el = typingState.el;
    if (!el) return;
    const word = typingState.words[typingState.wordIdx];
    typingState.charIdx += typingState.deleting ? -1 : 1;
    typingState.charIdx = Math.max(0, Math.min(typingState.charIdx, word.length));
    el.textContent = word.substring(0, typingState.charIdx);

    if (!typingState.deleting && typingState.charIdx === word.length) {
      typingState.deleting = true;
      setTimeout(typeEffect, 1200);
      return;
    }

    if (typingState.deleting && typingState.charIdx === 0) {
      typingState.deleting = false;
      typingState.wordIdx = (typingState.wordIdx + 1) % typingState.words.length;
    }

    setTimeout(typeEffect, typingState.deleting ? 50 : 90);
  }

  function initScrollHandlers() {
    const handleScroll = () => {
      revealSections();
      syncDockWithView();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('load', handleScroll);
    handleScroll();
  }

  function revealSections() {
    const trigger = window.innerHeight * 0.82;
    dom.sections.forEach(section => {
      if (section.getBoundingClientRect().top < trigger) {
        section.classList.add('visible');
      }
    });
  }

  function syncDockWithView() {
    const scrollY = window.scrollY + window.innerHeight / 2;
    let currentId = 'home';
    dom.sections.forEach(section => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (scrollY >= top && scrollY < bottom) currentId = section.id;
    });
    setActiveDock(currentId);
  }

  function initScrollTriggers() {
    dom.scrollTriggers.forEach(trigger => {
      const targetId = trigger.dataset.scrollTarget;
      const handleTrigger = event => {
        event.preventDefault();
        scrollToSection(targetId);
      };
      trigger.addEventListener('click', handleTrigger);
      if (!isNativeInteractive(trigger)) {
        trigger.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            handleTrigger(event);
          }
        });
      }
    });
  }

  function isNativeInteractive(element) {
    return ['A', 'BUTTON'].includes(element.tagName);
  }

  function scrollToSection(id) {
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveDock(id);
  }

  window.scrollToSection = scrollToSection;

  function setActiveDock(targetId) {
    dom.dockItems.forEach(item => {
      const matches = (item.dataset.scrollTarget || '').toLowerCase() === (targetId || '').toLowerCase();
      item.classList.toggle('active', matches);
    });
  }

  function initPortfolioInteractions() {
    dom.portfolioItems.forEach(item => {
      item.addEventListener('click', () => openGalleryAt(item));
      item.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          openGalleryAt(item);
        }
      });
    });
  }

  function openGalleryAt(element) {
    if (!element) return;
    toggleModalArrows(false);
    galleryState.items = getGalleryItemsFor(element);
    galleryState.index = Math.max(galleryState.items.indexOf(element), 0);
    showGalleryIndex(galleryState.index);
    openModal();
  }

  function getGalleryItemsFor(element) {
    const category = getCategory(element);
    if (category && dom.galleryMap.has(category)) {
      return dom.galleryMap.get(category);
    }
    return dom.portfolioItems;
  }

  function getCategory(element) {
    if (!element) return '';
    if (element.classList.contains('award-card')) return 'Award';
    const gallery = element.closest('.portfolio-gallery');
    if (!gallery) return '';
    const header = gallery.previousElementSibling;
    return header && header.classList.contains('portfolio-category') ? header.textContent.trim() : '';
  }

  function showGalleryIndex(index) {
    if (!galleryState.items.length) return;
    if (index < 0) index = galleryState.items.length - 1;
    if (index >= galleryState.items.length) index = 0;
    galleryState.index = index;
    const data = getItemData(galleryState.items[index]);
    displayModalMedia(data);
  }

  function getItemData(element) {
    if (!element) return { src: '', title: '', desc: '' };
    if (element.classList.contains('award-card')) {
      const img = element.querySelector('img');
      return {
        src: img ? img.src : '',
        title: element.querySelector('.award-title')?.textContent || 'Award',
        desc: element.querySelector('.award-year')?.textContent || ''
      };
    }
    const overlay = element.querySelector('.overlay');
    const title = overlay?.querySelector('h4')?.textContent || '';
    const desc = overlay?.querySelector('p')?.textContent || '';
    if (element.classList.contains('video-item')) {
      const video = element.querySelector('video');
      const src = video ? (video.querySelector('source')?.src || video.src) : '';
      return { src, title, desc, isVideo: true };
    }
    const img = element.querySelector('img');
    return { src: img ? img.src : '', title, desc, isVideo: false };
  }

  function displayModalMedia(data) {
    if (!dom.modalImage || !dom.modalVideo) return;
    if (data.isVideo) {
      dom.modalImage.classList.remove('show');
      dom.modalVideo.classList.add('show');
      if (dom.modalVideoSource) {
        dom.modalVideoSource.src = data.src || '';
      }
      dom.modalVideo.pause();
      dom.modalVideo.currentTime = 0;
      dom.modalVideo.load();
    } else {
      dom.modalVideo.classList.remove('show');
      dom.modalImage.classList.add('show');
      dom.modalImage.src = data.src || '';
      dom.modalVideo.pause();
    }
    dom.modalTitle.textContent = data.title || '';
    dom.modalDescription.textContent = data.desc || '';
  }

  function initModalControls() {
    if (!dom.modal) return;
    dom.modalPrev?.addEventListener('click', event => {
      event.stopPropagation();
      showGalleryIndex(galleryState.index - 1);
    });
    dom.modalNext?.addEventListener('click', event => {
      event.stopPropagation();
      showGalleryIndex(galleryState.index + 1);
    });
    dom.modalClose?.addEventListener('click', closeModal);
    dom.modal.addEventListener('click', event => {
      if (event.target === dom.modal) closeModal();
    });
  }

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', event => {
      if (!dom.modal?.classList.contains('show')) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showGalleryIndex(galleryState.index - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showGalleryIndex(galleryState.index + 1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
      }
    });
  }

  function openModal() {
    if (!dom.modal) return;
    dom.modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!dom.modal) return;
    dom.modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    dom.modalVideo?.pause();
    toggleModalArrows(false);
  }

  function initCertificatePreview() {
    if (!dom.certificateCards?.length) return;
    dom.certificateCards.forEach(card => {
      card.addEventListener('click', () => openCertificate(card));
    });
  }

  function openCertificate(card) {
    const data = {
      src: card.dataset.certificateImage,
      title: card.dataset.certificateTitle || 'Certificate',
      desc: card.dataset.certificateDescription || ''
    };
    galleryState.items = [];
    toggleModalArrows(true);
    displayModalMedia(data);
    openModal();
  }

  function toggleModalArrows(hidden) {
    [dom.modalPrev, dom.modalNext].forEach(arrow => {
      if (!arrow) return;
      arrow.classList.toggle('hidden', hidden);
    });
  }

  function initParticleField() {
    if (!dom.hero || !dom.heroCanvas) return;
    particleField.canvas = dom.heroCanvas;
    particleField.ctx = particleField.canvas.getContext('2d');
    const setup = () => {
      resizeParticleCanvas();
      seedParticleField();
    };
    particleField.resizeHandler = debounce(setup, 180);
    setup();
    window.addEventListener('resize', particleField.resizeHandler, { passive: true });
    particleField.pointerHandlers.move = event => updatePointerPosition(event);
    particleField.pointerHandlers.enter = event => {
      particleField.mouse.active = true;
      updatePointerPosition(event);
    };
    particleField.pointerHandlers.leave = () => {
      particleField.mouse.active = false;
    };
    dom.hero.addEventListener('pointermove', particleField.pointerHandlers.move);
    dom.hero.addEventListener('pointerenter', particleField.pointerHandlers.enter);
    dom.hero.addEventListener('pointerleave', particleField.pointerHandlers.leave);
    startParticleAnimation();
  }

  function resizeParticleCanvas() {
    if (!particleField.canvas || !dom.hero) return;
    const width = dom.hero.clientWidth;
    const height = dom.hero.clientHeight;
    if (!width || !height) return;
    const ratio = window.devicePixelRatio || 1;
    particleField.canvas.width = width * ratio;
    particleField.canvas.height = height * ratio;
    particleField.canvas.style.width = `${width}px`;
    particleField.canvas.style.height = `${height}px`;
    particleField.ctx.setTransform(1, 0, 0, 1, 0, 0);
    particleField.ctx.scale(ratio, ratio);
    particleField.bounds.width = width;
    particleField.bounds.height = height;
  }

  function seedParticleField() {
    const { bounds, config } = particleField;
    const area = bounds.width * bounds.height;
    if (!area) return;
    const targetCount = Math.min(config.maxCount, Math.max(36, Math.floor(area / config.density)));
    particleField.particles = Array.from({ length: targetCount }, () => createParticle());
  }

  function createParticle() {
    const { bounds, config } = particleField;
    const angle = Math.random() * Math.PI * 2;
    const speed = config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed);
    return {
      x: Math.random() * bounds.width,
      y: Math.random() * bounds.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: config.baseSize + Math.random() * config.baseSize,
      alpha: 0.35 + Math.random() * 0.45
    };
  }

  function startParticleAnimation() {
    if (particleField.animationId) cancelAnimationFrame(particleField.animationId);
    const step = () => {
      renderParticleField();
      particleField.animationId = requestAnimationFrame(step);
    };
    particleField.animationId = requestAnimationFrame(step);
  }

  function renderParticleField() {
    const { ctx, bounds, particles } = particleField;
    if (!ctx || !bounds.width || !bounds.height) return;
    ctx.clearRect(0, 0, bounds.width, bounds.height);
    particles.forEach(particle => {
      updateParticle(particle);
      drawParticle(particle);
    });
    drawParticleConnections();
  }

  function updateParticle(particle) {
    const { bounds, config, mouse } = particleField;
    particle.x += particle.vx;
    particle.y += particle.vy;
    if (particle.x <= 0 || particle.x >= bounds.width) {
      particle.vx *= -1;
      particle.x = clamp(particle.x, 0, bounds.width);
    }
    if (particle.y <= 0 || particle.y >= bounds.height) {
      particle.vy *= -1;
      particle.y = clamp(particle.y, 0, bounds.height);
    }
    if (mouse.active) {
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < config.mouseRadius) {
        const force = (config.mouseRadius - dist) / config.mouseRadius;
        particle.vx -= (dx / dist) * force * 0.08;
        particle.vy -= (dy / dist) * force * 0.08;
      }
    }
    const speed = Math.hypot(particle.vx, particle.vy);
    if (speed > config.maxSpeed) {
      particle.vx = (particle.vx / speed) * config.maxSpeed;
      particle.vy = (particle.vy / speed) * config.maxSpeed;
    }
  }

  function drawParticle(particle) {
    const { ctx } = particleField;
    ctx.beginPath();
    ctx.fillStyle = `rgba(0, 255, 214, ${particle.alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 255, 214, 0.35)';
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawParticleConnections() {
    const { ctx, particles, config } = particleField;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const p1 = particles[i];
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.hypot(dx, dy);
        if (dist > config.linkDistance) continue;
        const alpha = (1 - dist / config.linkDistance) * 0.55;
        ctx.strokeStyle = `rgba(0, 173, 181, ${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  function updatePointerPosition(event) {
    if (!dom.hero) return;
    const rect = dom.hero.getBoundingClientRect();
    particleField.mouse.x = event.clientX - rect.left;
    particleField.mouse.y = event.clientY - rect.top;
  }

  function debounce(fn, delay = 100) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();
