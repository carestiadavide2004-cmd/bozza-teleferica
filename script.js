(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* ---------- Header: trasparente sull'hero, pieno dopo ---------- */
  var header = document.querySelector('.header');
  var hero = document.querySelector('.hero');

  function updateHeader() {
    var limit = hero ? hero.offsetHeight - header.offsetHeight - 40 : 40;
    header.classList.toggle('is-solid', window.scrollY > limit);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader);

  /* ---------- Menu a tre lineette ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');

  function openMenu() {
    menu.hidden = false;
    // forza il reflow per far partire la transizione
    void menu.offsetWidth;
    menu.classList.add('is-open');
    header.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Chiudi il menu');
    document.body.classList.add('no-scroll');
    var first = menu.querySelector('a');
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu(returnFocus) {
    menu.classList.remove('is-open');
    header.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Apri il menu');
    document.body.classList.remove('no-scroll');
    window.setTimeout(function () {
      if (!menu.classList.contains('is-open')) menu.hidden = true;
    }, reduceMotion ? 0 : 350);
    if (returnFocus) burger.focus();
  }

  burger.addEventListener('click', function () {
    if (burger.getAttribute('aria-expanded') === 'true') closeMenu(true);
    else openMenu();
  });

  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu(false);
  });

  /* ---------- Comparsa leggera allo scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Toast ---------- */
  var toast = document.getElementById('toast');
  var toastTimer;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 2600);
  }

  /* ---------- Copia numero ---------- */
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () { showToast('Numero copiato: ' + text); };
      var fail = function () {
        if (fallbackCopy(text)) done();
        else showToast('Copia non riuscita. Il numero è ' + text);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fail);
      } else {
        fail();
      }
    });
  });

  /* ---------- Lightbox del giardino ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));
  var photos = items.map(function (btn) {
    var img = btn.querySelector('img');
    return { src: img.getAttribute('src'), alt: img.getAttribute('alt') };
  });
  var lb = document.getElementById('lightbox');
  var lbImg = lb.querySelector('.lightbox__img');
  var lbCount = document.getElementById('lb-count');
  var lbText = document.getElementById('lb-text');
  var current = 0;
  var lastTrigger = null;

  function show(index) {
    current = (index + photos.length) % photos.length;
    var p = photos[current];
    lbImg.classList.add('is-loading');
    lbImg.onload = function () { lbImg.classList.remove('is-loading'); };
    lbImg.src = p.src;
    lbImg.alt = p.alt;
    if (lbImg.complete) lbImg.classList.remove('is-loading');
    lbCount.textContent = (current + 1) + ' di ' + photos.length;
    lbText.textContent = p.alt;
  }

  function openLightbox(index, trigger) {
    lastTrigger = trigger;
    show(index);
    lb.hidden = false;
    void lb.offsetWidth;
    lb.classList.add('is-open');
    document.body.classList.add('no-scroll');
    lb.querySelector('.lightbox__close').focus();
  }

  function closeLightbox() {
    lb.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    window.setTimeout(function () {
      if (!lb.classList.contains('is-open')) lb.hidden = true;
    }, reduceMotion ? 0 : 300);
    if (lastTrigger) lastTrigger.focus();
  }

  items.forEach(function (btn, i) {
    btn.setAttribute('aria-label', 'Ingrandisci: ' + photos[i].alt);
    btn.addEventListener('click', function () { openLightbox(i, btn); });
  });

  lb.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  lb.querySelector('.lightbox__nav--prev').addEventListener('click', function () { show(current - 1); });
  lb.querySelector('.lightbox__nav--next').addEventListener('click', function () { show(current + 1); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lightbox__figure')) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (!lb.hidden) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'Tab') {
        // tiene il focus dentro la lightbox
        var f = lb.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });

  // Swipe sul telefono
  var startX = 0, startY = 0, tracking = false;
  lb.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    tracking = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      show(dx < 0 ? current + 1 : current - 1);
    }
  });

  /* ---------- Modulo richiesta evento ---------- */
  var form = document.getElementById('form-evento');
  var conferma = document.getElementById('conferma');
  var riepilogo = document.getElementById('riepilogo');
  var dateInput = document.getElementById('f-data');

  var today = new Date();
  var iso = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
  dateInput.min = iso;

  var rules = [
    { id: 'f-tipo', err: 'e-tipo', check: function (v) { return v ? '' : 'Scegli il tipo di evento.'; } },
    { id: 'f-data', err: 'e-data', check: function (v) {
      if (!v) return 'Indica la data dell\'evento.';
      if (v < iso) return 'La data deve essere da oggi in poi.';
      return '';
    } },
    { id: 'f-ospiti', err: 'e-ospiti', check: function (v) {
      var n = parseInt(v, 10);
      if (!v) return 'Indica quanti ospiti prevedete.';
      if (isNaN(n) || n < 1) return 'Inserisci un numero di ospiti valido.';
      return '';
    } },
    { id: 'f-nome', err: 'e-nome', check: function (v) { return v.trim().length >= 2 ? '' : 'Scrivi il tuo nome.'; } },
    { id: 'f-tel', err: 'e-tel', check: function (v) {
      var digits = v.replace(/\D/g, '');
      if (!digits) return 'Scrivi un numero di telefono per essere ricontattato.';
      if (digits.length < 6) return 'Il numero sembra incompleto: controlla le cifre.';
      return '';
    } }
  ];

  function validateField(rule) {
    var input = document.getElementById(rule.id);
    var msg = rule.check(input.value);
    var errEl = document.getElementById(rule.err);
    errEl.textContent = msg;
    input.closest('.field').classList.toggle('has-error', !!msg);
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', rule.err);
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
    return !msg;
  }

  rules.forEach(function (rule) {
    var input = document.getElementById(rule.id);
    var evt = input.tagName === 'SELECT' || input.type === 'date' ? 'change' : 'blur';
    input.addEventListener(evt, function () {
      if (input.closest('.field').classList.contains('has-error') || input.value) validateField(rule);
    });
    input.addEventListener('input', function () {
      if (input.closest('.field').classList.contains('has-error')) validateField(rule);
    });
  });

  function formatDate(value) {
    var parts = value.split('-');
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function addRow(label, value) {
    var row = document.createElement('div');
    var dt = document.createElement('dt');
    var dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    row.appendChild(dt);
    row.appendChild(dd);
    riepilogo.appendChild(row);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstInvalid = null;
    rules.forEach(function (rule) {
      if (!validateField(rule) && !firstInvalid) firstInvalid = document.getElementById(rule.id);
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    var data = new FormData(form);
    riepilogo.innerHTML = '';
    addRow('Evento', data.get('tipo'));
    addRow('Data', formatDate(data.get('data')));
    addRow('Ospiti', data.get('ospiti'));
    addRow('Nome', data.get('nome').trim());
    addRow('Telefono', data.get('telefono').trim());
    var msg = (data.get('messaggio') || '').trim();
    if (msg) addRow('Messaggio', msg);

    form.hidden = true;
    conferma.hidden = false;
    conferma.focus({ preventScroll: true });
    conferma.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  document.getElementById('nuova-richiesta').addEventListener('click', function () {
    form.reset();
    conferma.hidden = true;
    form.hidden = false;
    document.getElementById('f-tipo').focus();
  });
})();
