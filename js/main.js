// Marotta Consulting — animations et comportements du site
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Intro (accueil) puis apparition du titre ---------- */

  var preloader = document.querySelector(".preloader");
  function markLoaded() { root.classList.add("is-loaded"); }

  if (preloader && !root.classList.contains("skip-intro") && !reduceMotion) {
    window.addEventListener("load", function () { setTimeout(markLoaded, 1300); });
    setTimeout(markLoaded, 2600); // au cas où une image tarde
    try { sessionStorage.setItem("intro-vue", "1"); } catch (e) {}
  } else {
    requestAnimationFrame(markLoaded);
  }

  /* ---------- En-tête : opaque au défilement, masqué quand on descend ---------- */

  var header = document.querySelector(".site-header");
  var lastY = window.scrollY;
  function onScrollHeader() {
    var y = window.scrollY;
    if (!header) return;
    header.classList.toggle("is-solid", y > 40);
    var menuOpen = header.classList.contains("menu-open");
    header.classList.toggle("is-hidden", !menuOpen && y > 300 && y > lastY);
    lastY = y;
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Menu mobile ---------- */

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      header.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Mot qui change dans le titre ---------- */

  var rotator = document.querySelector(".rotator");
  if (rotator && !reduceMotion) {
    var words = rotator.getAttribute("data-words").split(",");
    var em = rotator.querySelector("em");
    var i = 0;
    setInterval(function () {
      rotator.classList.add("is-out");
      setTimeout(function () {
        i = (i + 1) % words.length;
        em.textContent = words[i];
        rotator.classList.remove("is-out");
        rotator.classList.add("is-in");
        void em.offsetWidth; // relance la transition
        rotator.classList.remove("is-in");
      }, 550);
    }, 2600);
  }

  /* ---------- Halo qui suit la souris ---------- */

  var hero = document.querySelector(".hero");
  if (hero && finePointer && !reduceMotion) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", e.clientX - r.left + "px");
      hero.style.setProperty("--my", e.clientY - r.top + "px");
    });
  }

  /* ---------- Boutons « aimantés » ---------- */

  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".btn, .badge").forEach(function (el) {
      var strength = el.classList.contains("badge") ? 0.25 : 0.2;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * strength;
        var y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = "translate(" + x + "px," + y + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Apparitions au défilement ---------- */

  var revealSelectors = [
    "[data-reveal]", ".section-title", ".section-intro", ".solution", ".about-figure",
    ".about > div", ".card", ".contact-side", ".prose > *", ".pillar", ".steps li",
    ".cta h2", ".cta p", ".cta .btn", ".cta-contacts > div", ".footer-grid > *"
  ];
  var toReveal = document.querySelectorAll(revealSelectors.join(","));

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    toReveal.forEach(function (el) {
      // léger décalage entre éléments voisins
      var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.matches(revealSelectors.join(",")); });
      var index = siblings.indexOf(el);
      el.style.setProperty("--delay", Math.min(index, 5) * 0.09 + "s");
      el.classList.add("reveal");
      io.observe(el);
    });

    var steps = document.querySelector(".steps");
    if (steps) {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) { steps.classList.add("is-in"); obs.disconnect(); }
      }, { threshold: 0.3 }).observe(steps);
    }
  } else {
    var s = document.querySelector(".steps");
    if (s) s.classList.add("is-in");
  }

  /* ---------- Manifeste : les mots s'allument au défilement ---------- */

  var manifesto = document.querySelector(".manifesto-text");
  if (manifesto && !reduceMotion) {
    var accents = (manifesto.getAttribute("data-accent") || "").split(",");
    var html = manifesto.textContent.trim().split(/\s+/).map(function (w) {
      var clean = w.replace(/[.,:;!?]/g, "").toLowerCase();
      var cls = accents.indexOf(clean) > -1 ? "w accent" : "w";
      return '<span class="' + cls + '">' + w + "</span>";
    }).join(" ");
    manifesto.setAttribute("aria-label", manifesto.textContent.trim());
    manifesto.innerHTML = html;
    manifesto.classList.add("is-split");
    var spans = manifesto.querySelectorAll(".w");

    var ticking = false;
    function lightWords() {
      ticking = false;
      var r = manifesto.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 quand le haut du texte arrive en bas de l'écran, 1 quand le bas atteint le milieu
      var progress = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      progress = Math.max(0, Math.min(1, progress));
      var lit = Math.round(progress * spans.length);
      spans.forEach(function (span, n) { span.classList.toggle("is-lit", n < lit); });
    }
    lightWords();
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(lightWords); }
    }, { passive: true });
  }

  /* ---------- Photo manquante : on laisse voir le dégradé de fond ---------- */

  document.querySelectorAll(".solution-img, .about-photo").forEach(function (img) {
    function hide() { img.style.visibility = "hidden"; }
    if (img.complete && img.naturalWidth === 0) hide();
    img.addEventListener("error", hide);
  });

  /* ---------- Année du copyright ---------- */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Page contact : message de retour et sujet présélectionné ---------- */

  var params = new URLSearchParams(window.location.search);

  // Site statique : le formulaire prépare un e-mail dans la messagerie du visiteur
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (name) { return form.elements[name].value.trim(); };
      var title = "[marotta.ch] " + v("sujet") + (v("objet") ? " – " + v("objet") : "");
      var body = v("message") + "\n\n—\n" + v("nom") + "\n" + v("email");
      window.location.href = "mailto:thibaud@marotta.ch?subject=" + encodeURIComponent(title) +
        "&body=" + encodeURIComponent(body);
      var done = document.getElementById("form-success");
      if (done) done.classList.add("is-visible");
    });
  }

  var subject = document.getElementById("sujet");
  if (subject && params.get("sujet")) {
    Array.prototype.forEach.call(subject.options, function (opt) {
      if (opt.value === params.get("sujet")) subject.value = opt.value;
    });
  }
})();
