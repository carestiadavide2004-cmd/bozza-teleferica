(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');

  /* ---------- Titolo dell'hero: comparsa parola per parola ---------- */
  var heroTitle = document.querySelector('.hero__title');
  if (heroTitle) {
    var words = heroTitle.textContent.trim().split(/\s+/);
    heroTitle.setAttribute('aria-label', heroTitle.textContent.trim());
    heroTitle.innerHTML = words.map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
  }

  /* ---------- Header: trasparente sull'hero, pieno dopo ---------- */
  var header = document.querySelector('.header');
  var hero = document.querySelector('.hero');
  var callbar = document.getElementById('callbar');
  var formSectionVisible = false;

  function updateHeader() {
    var limit = hero ? hero.offsetHeight - header.offsetHeight - 40 : 40;
    header.classList.toggle('is-solid', window.scrollY > limit);
  }

  /* ---------- Barra contatti su telefono ---------- */
  function updateCallbar() {
    var pastHero = hero ? window.scrollY > hero.offsetHeight * 0.55 : true;
    var overlayOpen = document.body.classList.contains('no-scroll');
    var show = pastHero && !formSectionVisible && !overlayOpen;
    callbar.classList.toggle('is-visible', show);
    callbar.setAttribute('aria-hidden', show ? 'false' : 'true');
    callbar.querySelectorAll('a').forEach(function (a) { a.tabIndex = show ? 0 : -1; });
    document.body.classList.toggle('callbar-on', show && window.innerWidth < 960);
  }

  var richiesta = document.getElementById('richiesta');
  if ('IntersectionObserver' in window && richiesta) {
    new IntersectionObserver(function (entries) {
      formSectionVisible = entries[0].isIntersecting;
      updateCallbar();
    }, { rootMargin: '0px 0px -25% 0px' }).observe(richiesta);
  }

  function onScroll() {
    updateHeader();
    updateCallbar();
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Menu a tre lineette ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');

  function openMenu() {
    menu.hidden = false;
    void menu.offsetWidth; // forza il reflow per far partire la transizione
    menu.classList.add('is-open');
    header.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Chiudi il menu');
    document.body.classList.add('no-scroll');
    updateCallbar();
    var first = menu.querySelector('a');
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu(returnFocus) {
    menu.classList.remove('is-open');
    header.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Apri il menu');
    document.body.classList.remove('no-scroll');
    updateCallbar();
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
  var lbDots = lb.querySelector('.lightbox__dots');
  var current = 0;
  var lastTrigger = null;

  photos.forEach(function () { lbDots.appendChild(document.createElement('span')); });

  function preload(index) {
    var p = photos[(index + photos.length) % photos.length];
    var im = new Image();
    im.src = p.src;
  }

  function show(index) {
    current = (index + photos.length) % photos.length;
    var p = photos[current];
    lbImg.classList.add('is-loading');
    var swap = function () {
      lbImg.onload = function () { lbImg.classList.remove('is-loading'); };
      lbImg.src = p.src;
      lbImg.alt = p.alt;
      if (lbImg.complete) lbImg.classList.remove('is-loading');
    };
    // breve dissolvenza tra una foto e l'altra
    if (lb.hidden || reduceMotion) swap();
    else window.setTimeout(swap, 180);
    lbCount.textContent = (current + 1) + ' di ' + photos.length;
    lbText.textContent = p.alt;
    Array.prototype.forEach.call(lbDots.children, function (d, i) {
      d.classList.toggle('is-active', i === current);
    });
    preload(current + 1);
    preload(current - 1);
  }

  function openLightbox(index, trigger) {
    lastTrigger = trigger;
    show(index);
    lb.hidden = false;
    void lb.offsetWidth;
    lb.classList.add('is-open');
    document.body.classList.add('no-scroll');
    updateCallbar();
    lb.querySelector('.lightbox__close').focus();
  }

  function closeLightbox() {
    lb.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    updateCallbar();
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
    if (e.target === lb || e.target.classList.contains('lightbox__figure') || e.target.classList.contains('lightbox__frame')) closeLightbox();
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

  /* ---------- Modulo richiesta di preventivo ---------- */
  var form = document.getElementById('form-evento');
  var conferma = document.getElementById('conferma');
  var riepilogo = document.getElementById('riepilogo');
  var summary = document.getElementById('form-summary');
  var dateInput = document.getElementById('f-data');

  var today = new Date();
  var iso = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
  dateInput.min = iso;

  var rules = [
    { id: 'f-tipo', err: 'e-tipo', check: function (v) { return v ? '' : 'Scegli il tipo di evento dall\'elenco.'; } },
    { id: 'f-data', err: 'e-data', check: function (v) {
      if (!v) return 'Indica la data dell\'evento, anche indicativa.';
      if (v < iso) return 'La data è già passata: scegli un giorno da oggi in poi.';
      return '';
    } },
    { id: 'f-ospiti', err: 'e-ospiti', check: function (v) {
      var n = Number(v);
      if (!v) return 'Indica quanti ospiti prevedete, anche approssimativamente.';
      if (!Number.isInteger(n) || n < 1) return 'Scrivi il numero di ospiti in cifre, ad esempio 60.';
      if (n > 2000) return 'Il numero sembra troppo alto: controlla le cifre.';
      return '';
    } },
    { id: 'f-nome', err: 'e-nome', check: function (v) { return v.trim().length >= 2 ? '' : 'Scrivi nome e cognome.'; } },
    { id: 'f-tel', err: 'e-tel', check: function (v) {
      var digits = v.replace(/\D/g, '');
      if (!digits) return 'Scrivi un numero di telefono per essere ricontattati.';
      if (/[^\d\s+().\/-]/.test(v)) return 'Il numero può contenere solo cifre, spazi e il segno +.';
      if (digits.length < 6 || digits.length > 15) return 'Il numero sembra incompleto: controlla le cifre.';
      return '';
    } },
    { id: 'f-email', err: 'e-email', check: function (v) {
      v = v.trim();
      if (!v) return '';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'L\'indirizzo email non sembra corretto, ad esempio nome@email.it.';
    } }
  ];

  function describedBy(input, errId, hasError) {
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== errId; });
    if (hasError) ids.push(errId);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    else input.removeAttribute('aria-describedby');
  }

  function validateField(rule) {
    var input = document.getElementById(rule.id);
    var msg = rule.check(input.value);
    document.getElementById(rule.err).textContent = msg;
    input.closest('.field').classList.toggle('has-error', !!msg);
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    describedBy(input, rule.err, !!msg);
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
    var invalid = rules.filter(function (rule) { return !validateField(rule); });
    if (invalid.length) {
      summary.textContent = invalid.length === 1
        ? 'Controlla il campo evidenziato.'
        : 'Controlla i ' + invalid.length + ' campi evidenziati.';
      document.getElementById(invalid[0].id).focus();
      return;
    }
    summary.textContent = '';

    var data = new FormData(form);
    riepilogo.innerHTML = '';
    addRow('Evento', data.get('tipo'));
    addRow('Data', formatDate(data.get('data')));
    addRow('Ospiti', 'circa ' + data.get('ospiti'));
    addRow('Dove', data.get('luogo') || 'Da decidere insieme');
    addRow('Nome', data.get('nome').trim());
    addRow('Telefono', data.get('telefono').trim());
    var email = (data.get('email') || '').trim();
    if (email) addRow('Email', email);
    var msg = (data.get('messaggio') || '').trim();
    if (msg) addRow('Messaggio', msg);

    form.hidden = true;
    conferma.hidden = false;
    conferma.focus({ preventScroll: true });
    conferma.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  document.getElementById('nuova-richiesta').addEventListener('click', function () {
    form.reset();
    rules.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      document.getElementById(rule.err).textContent = '';
      input.closest('.field').classList.remove('has-error');
      input.removeAttribute('aria-invalid');
      describedBy(input, rule.err, false);
    });
    conferma.hidden = true;
    form.hidden = false;
    document.getElementById('f-tipo').focus();
  });
})();
