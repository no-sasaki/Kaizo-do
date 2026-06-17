/* Kaizō-dō ─ platform interactions: copy buttons, scroll reveal, progress */
(function () {
  "use strict";

  /* copy-to-clipboard for prompt cards */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sel = btn.getAttribute("data-copy");
      var src = document.querySelector(sel);
      if (!src) return;
      var text = src.innerText;
      navigator.clipboard.writeText(text).then(function () {
        var label = btn.textContent;
        btn.textContent = "コピーしました ✓";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.textContent = label;
          btn.classList.remove("copied");
        }, 1600);
      });
    });
  });

  /* scroll reveal */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* highlight active rail item on scroll */
  var rail = document.querySelectorAll(".rail a[href^='#']");
  if (rail.length) {
    var targets = [];
    rail.forEach(function (a) {
      var t = document.querySelector(a.getAttribute("href"));
      if (t) targets.push({ a: a, t: t });
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          rail.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
          var m = targets.find(function (x) { return x.t === e.target; });
          if (m) { m.a.classList.add("is-active"); m.a.setAttribute("aria-current", "true"); }
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    targets.forEach(function (x) { spy.observe(x.t); });
  }

  /* mark current nav link */
  var path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a[data-page]").forEach(function (a) {
    if (a.getAttribute("data-page") === path) a.classList.add("is-active");
  });
})();
