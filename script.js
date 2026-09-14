/* Portfolio — Alessandro Riina
   Due soli comportamenti: cambio lingua e cambio tema.
   Le preferenze restano nel browser di chi visita, se disponibile. */

(function () {
  var html = document.documentElement;
  var langBtn = document.getElementById('langBtn');
  var themeBtn = document.getElementById('themeBtn');

  function save(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { /* navigazione privata: ignora */ }
  }
  function load(k) {
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  /* ---------- lingua ---------- */
  function setLang(lang) {
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang);
    langBtn.textContent = lang === 'it' ? 'EN' : 'IT';
    langBtn.setAttribute('aria-label', lang === 'it' ? 'Switch to English' : 'Passa all’italiano');
    save('lang', lang);
  }

  var savedLang = load('lang');
  if (savedLang !== 'it' && savedLang !== 'en') {
    // prima visita: seguo la lingua del browser
    var nav = (navigator.language || 'it').toLowerCase();
    savedLang = nav.indexOf('it') === 0 ? 'it' : 'en';
  }
  setLang(savedLang);

  langBtn.addEventListener('click', function () {
    setLang(html.getAttribute('data-lang') === 'it' ? 'en' : 'it');
  });

  /* ---------- tema ---------- */
  function setTheme(mode) {
    if (mode === 'auto') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', mode);
    }
    save('theme', mode);
  }

  var savedTheme = load('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);

  themeBtn.addEventListener('click', function () {
    var current = html.getAttribute('data-theme');
    if (!current) {
      // da automatico passo all'opposto di quello che il sistema sta mostrando
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'light' : 'dark');
    } else {
      setTheme(current === 'dark' ? 'light' : 'dark');
    }
  });

  /* ---------- visualizzatore a schermo intero ----------
     Ogni immagine dentro .shots e ogni copertina .p-cover si apre ingrandita.
     Frecce per scorrere le immagini dello stesso progetto, Esc per chiudere. */

  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var group = [];
  var index = 0;

  function captionFor(img) {
    var fig = img.closest('figure');
    if (!fig) return '';
    var lang = html.getAttribute('data-lang');
    var cap = fig.querySelector('figcaption.' + lang) || fig.querySelector('figcaption');
    return cap ? cap.innerHTML : '';
  }

  var lbFig = document.getElementById('lbFig');
  var lbScroll = document.getElementById('lbScroll');

  function unzoom() {
    lbFig.classList.remove('zoomed');
    lbScroll.scrollTop = 0;
    lbScroll.scrollLeft = 0;
  }

  function show(i) {
    if (!group.length) return;
    index = (i + group.length) % group.length;
    var img = group[index];
    unzoom();
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || '';
    lbCap.innerHTML = captionFor(img);
    var multi = group.length > 1;
    document.getElementById('lbPrev').hidden = !multi;
    document.getElementById('lbNext').hidden = !multi;
  }

  // un tocco sull'immagine la porta a grandezza piena, con scorrimento
  lbImg.addEventListener('click', function (e) {
    e.stopPropagation();
    var wasZoomed = lbFig.classList.contains('zoomed');
    if (wasZoomed) {
      unzoom();
    } else {
      lbFig.classList.add('zoomed');
      // centro la vista sul punto toccato
      var r = lbImg.getBoundingClientRect();
      lbScroll.scrollLeft = (lbImg.offsetWidth - lbScroll.clientWidth) / 2;
    }
  });

  function open(img) {
    var shots = img.closest('.shots');
    group = shots ? Array.prototype.slice.call(shots.querySelectorAll('img')) : [img];
    show(group.indexOf(img));
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.hidden = true;
    unzoom();
    lbImg.removeAttribute('src');
    document.body.style.overflow = '';
  }

  var zoomables = document.querySelectorAll('.shots img, .p-cover');
  Array.prototype.forEach.call(zoomables, function (img) {
    img.classList.add('zoomable');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.addEventListener('click', function () { open(img); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); }
    });
  });

  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', function (e) { e.stopPropagation(); show(index - 1); });
  document.getElementById('lbNext').addEventListener('click', function (e) { e.stopPropagation(); show(index + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-figure')) close(); });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
  });

  // scorrimento con lo swipe su telefono (disattivato mentre l'immagine è ingrandita,
  // altrimenti trascinare per guardare cambierebbe immagine)
  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null || lbFig.classList.contains('zoomed')) { x0 = null; return; }
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 55) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
})();
