/* =====================================================================
   NAGI ─ 擬似ヘッドレス・レンダラー
   /data/*.json（コンテンツの「型」と中身）を読み込み、HTMLに描画する。
   ＝「表示層」。コンテンツモデルと表現が分離していることを体現する層。
   ===================================================================== */
(function () {
  "use strict";

  var qs = function (s, r) { return (r || document).querySelector(s); };
  var qp = function (k) { return new URLSearchParams(location.search).get(k); };
  var el = function (tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };
  var fmtDate = function (iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0");
  };

  function loadJSON(path) {
    return fetch(path, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("404: " + path);
      return r.json();
    });
  }

  /* ---------- product card ---------- */
  function productCard(p) {
    var a = el("a", "product reveal");
    a.href = "products.html?id=" + encodeURIComponent(p.id);
    a.innerHTML =
      '<div class="product__img">' +
        (p.collection_label ? '<span class="product__tag">' + esc(p.collection_label) + "</span>" : "") +
        '<div class="ph">' + esc(p.glyph || "凪") + "</div>" +
      "</div>" +
      '<div class="product__meta">' +
        '<div class="product__name">' + esc(p.name_ja) + "</div>" +
        '<div class="product__en">' + esc(p.name_en) + "</div>" +
        '<div class="product__desc">' + esc(p.tagline_ja || "") + "</div>" +
      "</div>";
    return a;
  }

  /* ---------- journal card ---------- */
  function journalCard(a) {
    var node = el("a", "jcard reveal");
    node.href = "journal.html?id=" + encodeURIComponent(a.id);
    node.innerHTML =
      '<div class="jcard__cat">' + esc(a.category_ja || a.category) + "</div>" +
      '<div class="jcard__title">' + esc(a.title_ja) + "</div>" +
      '<div class="jcard__excerpt">' + esc(a.excerpt_ja || "") + "</div>" +
      '<div class="jcard__date">' + fmtDate(a.date) + (a.read_min ? " ・ " + a.read_min + " min" : "") + "</div>";
    return node;
  }

  function fill(container, nodes) {
    container.innerHTML = "";
    nodes.forEach(function (n) { container.appendChild(n); });
  }

  function observeReveals(root) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.1 });
    (root || document).querySelectorAll(".reveal").forEach(function (n) { io.observe(n); });
  }

  /* ================================================================ HOME */
  function initHome() {
    loadJSON("data/products.json").then(function (data) {
      var grid = qs("#home-collection");
      if (!grid) return;
      fill(grid, data.items.slice(0, 3).map(productCard));
      observeReveals(grid);
    });
    loadJSON("data/journal.json").then(function (data) {
      var grid = qs("#home-journal");
      if (!grid) return;
      fill(grid, data.items.slice(0, 3).map(journalCard));
      observeReveals(grid);
    });
  }

  /* ============================================================ PRODUCTS */
  function initProducts() {
    var id = qp("id");
    var list = qs("#product-list");
    var detail = qs("#product-detail");
    loadJSON("data/products.json").then(function (data) {
      if (id && detail) {
        var p = data.items.filter(function (x) { return x.id === id; })[0];
        if (!p) { detail.innerHTML = '<p class="state">製品が見つかりませんでした。</p>'; return; }
        document.title = p.name_ja + " ｜ NAGI 凪";
        detail.innerHTML =
          '<nav class="bc"><a href="index.html">NAGI</a> ／ <a href="products.html">Collections</a> ／ ' + esc(p.name_ja) + "</nav>" +
          '<div class="pdetail">' +
            '<div class="pdetail__img">' + esc(p.glyph || "凪") + "</div>" +
            "<div>" +
              '<p class="kicker">' + esc(p.collection_label || "") + (p.ritual_step ? " ・ Ritual " + p.ritual_step : "") + "</p>" +
              "<h1>" + esc(p.name_ja) + "</h1>" +
              '<div class="en">' + esc(p.name_en) + "</div>" +
              '<p class="lead">' + esc(p.lead_ja || "") + "</p>" +
              "<div>" + (p.key_ingredients || []).map(function (i) { return '<span class="ingredient">' + esc(i) + "</span>"; }).join("") + "</div>" +
              '<div class="spec" style="margin-top:1.6rem"><dl>' +
                "<dt>Price</dt><dd>" + esc(p.price_ja || "—") + "</dd>" +
                "<dt>Size</dt><dd>" + esc(p.size || "—") + "</dd>" +
                "<dt>Made in</dt><dd>" + esc(p.made_in || "—") + "</dd>" +
              "</dl></div>" +
              '<div style="margin-top:2rem"><a class="btn" href="products.html">← コレクションへ戻る</a></div>' +
            "</div>" +
          "</div>";
        return;
      }
      if (list) {
        fill(list, data.items.map(productCard));
        observeReveals(list);
      }
    }).catch(function () {
      if (detail) detail.innerHTML = '<p class="state">コンテンツを読み込めませんでした。</p>';
      if (list) list.innerHTML = '<p class="state">コンテンツを読み込めませんでした。</p>';
    });
  }

  /* ============================================================= JOURNAL */
  function initJournal() {
    var id = qp("id");
    var list = qs("#journal-list");
    var detail = qs("#journal-detail");
    loadJSON("data/journal.json").then(function (data) {
      if (id && detail) {
        var a = data.items.filter(function (x) { return x.id === id; })[0];
        if (!a) { detail.innerHTML = '<p class="state">記事が見つかりませんでした。</p>'; return; }
        document.title = a.title_ja + " ｜ NAGI Journal";
        var body = (a.body || []).map(function (b) {
          if (b.h2) return "<h2>" + esc(b.h2) + "</h2>";
          if (b.p) return "<p>" + esc(b.p) + "</p>";
          return "";
        }).join("");
        detail.innerHTML =
          '<nav class="bc"><a href="index.html">NAGI</a> ／ <a href="journal.html">Journal</a> ／ ' + esc(a.title_ja) + "</nav>" +
          '<div class="article__head">' +
            '<div class="cat">' + esc(a.category_ja || a.category) + "</div>" +
            "<h1>" + esc(a.title_ja) + "</h1>" +
            '<div class="date">' + fmtDate(a.date) + (a.read_min ? " ・ " + a.read_min + " min read" : "") + "</div>" +
          "</div>" +
          '<div class="article__hero-img">' + esc(a.glyph || "凪") + "</div>" +
          '<div class="article__body">' + body +
            '<div style="margin-top:2.5rem"><a class="btn btn--line" href="journal.html">← ジャーナル一覧へ</a></div>' +
          "</div>";
        return;
      }
      if (list) {
        fill(list, data.items.map(journalCard));
        observeReveals(list);
      }
    }).catch(function () {
      if (detail) detail.innerHTML = '<p class="state">コンテンツを読み込めませんでした。</p>';
      if (list) list.innerHTML = '<p class="state">コンテンツを読み込めませんでした。</p>';
    });
  }

  /* ---------- boot via data-page on <body> ---------- */
  var page = document.body.getAttribute("data-page");
  if (page === "home") initHome();
  else if (page === "products") initProducts();
  else if (page === "journal") initJournal();
  observeReveals(document);

  /* active nav */
  var file = (location.pathname.split("/").pop() || "index.html").split("?")[0];
  document.querySelectorAll(".nav__links a[data-nav]").forEach(function (a) {
    if (a.getAttribute("data-nav") === file) a.classList.add("is-active");
  });
})();
