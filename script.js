(() => {
  const header = document.querySelector('[data-header]');
  const menuBtn = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  const form = document.querySelector('#leadForm');
  const status = document.querySelector('#formStatus');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 14);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!open));
      mobileNav.hidden = open;
      document.body.classList.toggle('menu-open', !open);
    });
    mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      menuBtn.setAttribute('aria-expanded', 'false');
      mobileNav.hidden = true;
      document.body.classList.remove('menu-open');
    }));
  }

  const revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(el => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -45px' });
    revealItems.forEach(el => observer.observe(el));
  }

  document.querySelectorAll('.faq-item button').forEach(button => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const answer = document.getElementById(button.getAttribute('aria-controls'));
      const willOpen = button.getAttribute('aria-expanded') !== 'true';

      document.querySelectorAll('.faq-item').forEach(other => {
        const otherButton = other.querySelector('button');
        const otherAnswer = document.getElementById(otherButton.getAttribute('aria-controls'));
        other.classList.remove('is-open');
        otherButton.setAttribute('aria-expanded', 'false');
        if (otherAnswer) otherAnswer.hidden = true;
      });

      if (willOpen) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        answer.hidden = false;
      }
    });
  });

  document.querySelectorAll('[data-pending-link]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      window.alert('URL pendiente de confirmación por INMEGA.');
    });
  });

  if (reduceMotion) {
    document.querySelectorAll('svg').forEach(svg => {
      try { svg.pauseAnimations?.(); } catch (_) {}
    });
  }

  if (form) {
    const required = [...form.querySelectorAll('[required]')];

    const validateField = field => {
      const wrapper = field.closest('.field');
      if (!wrapper) return field.checkValidity();
      const error = wrapper.querySelector('.error');
      let message = '';
      if (!field.value.trim()) message = 'Este campo es obligatorio.';
      else if (field.type === 'email' && !field.validity.valid) message = 'Escribe un correo válido.';
      else if (field.type === 'number' && !field.validity.valid) message = 'Escribe un valor válido.';
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (error) error.textContent = message;
      return !message;
    };

    required.forEach(field => {
      if (field.type !== 'checkbox') {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
          if (field.getAttribute('aria-invalid') === 'true') validateField(field);
        });
      }
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      status.textContent = '';
      status.className = 'form-status full';

      const fieldsOk = required.filter(f => f.type !== 'checkbox').map(validateField).every(Boolean);
      const legal = form.querySelector('input[name="privacidad"]');
      if (!legal.checked) {
        status.textContent = 'Debes aceptar el aviso de privacidad para continuar.';
        status.classList.add('is-warning');
        legal.focus();
        return;
      }
      if (!fieldsOk) {
        status.textContent = 'Revisa los campos marcados.';
        status.classList.add('is-warning');
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }

      const endpoint = form.dataset.endpoint || '';
      if (!endpoint || endpoint.startsWith('[')) {
        status.textContent = 'Integración pendiente: conecta aquí el endpoint del CRM/formulario antes de publicar.';
        status.classList.add('is-warning');
        return;
      }

      try {
        const payload = Object.fromEntries(new FormData(form).entries());
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Error de envío');
        window.location.href = 'gracias.html';
      } catch (error) {
        status.textContent = 'No pudimos enviar el formulario. Intenta de nuevo.';
        status.classList.add('is-warning');
      }
    });
  }

  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (dot && ring) {
      document.body.classList.add('cursor-ready');
      let x = 0, y = 0, rx = 0, ry = 0;
      window.addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px,${y}px)`; });
      const tick = () => {
        rx += (x - rx) * .16;
        ry += (y - ry) * .16;
        ring.style.transform = `translate(${rx}px,${ry}px)`;
        requestAnimationFrame(tick);
      };
      tick();
      document.querySelectorAll('a,button,input,textarea').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
      });
    }
  }

  const platformMockup = document.querySelector('.platform-mockup');
  const mockupStage = platformMockup?.closest('.product-stage');
  if (platformMockup && mockupStage) {
    const nativeWidth = 1078;
    const nativeHeight = 744;
    const fitPlatformMockup = () => {
      const scale = Math.max(mockupStage.clientWidth, 1) / nativeWidth;
      platformMockup.style.transform = `scale(${scale})`;
      mockupStage.style.height = `${nativeHeight * scale}px`;
    };
    fitPlatformMockup();
    new ResizeObserver(fitPlatformMockup).observe(mockupStage);
  }
})();
