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
  /* update <title> and <meta name=description> from content (SEO is content-driven) */
  function setSEO(title, desc) {
    if (title) document.title = title;
    var m = qs('meta[name="description"]');
    if (m && desc) m.setAttribute("content", desc);
  }
  /* inject Product structured data (JSON-LD) so search engines understand the page */
  function injectJSONLD(p) {
    var prev = qs("#nagi-jsonld"); if (prev) prev.remove();
    var ld = {
      "@context": "https://schema.org", "@type": "Product",
      name: p.name_ja, description: (p.seo && p.seo.description_ja) || p.lead_ja,
      brand: { "@type": "Brand", name: "NAGI" },
      category: p.collection_label || undefined
    };
    if (p.price_ja) {
      ld.offers = { "@type": "Offer", price: String(p.price_ja).replace(/[^\d]/g, ""), priceCurrency: "JPY", availability: "https://schema.org/InStock" };
    }
    var s = document.createElement("script");
    s.type = "application/ld+json"; s.id = "nagi-jsonld";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }

  function renderPDP(p, byId, articles) {
    var gallery = (p.gallery && p.gallery.length) ? p.gallery : [{ glyph: p.glyph, alt_ja: p.name_ja }];
    var thumbs = gallery.map(function (g, i) {
      return '<button class="gallery__thumb" data-glyph="' + esc(g.glyph) + '" data-alt="' + esc(g.alt_ja) + '" aria-current="' + (i === 0 ? "true" : "false") + '">' + esc(g.glyph) + "</button>";
    }).join("");

    var vprops = (p.value_props || []).map(function (v) {
      return '<div class="vprop"><div class="ic" aria-hidden="true">' + esc(v.icon) + '</div><h3>' + esc(v.title_ja) + "</h3><p>" + esc(v.body_ja) + "</p></div>";
    }).join("");

    var variations = (p.variations || []).map(function (v) {
      var opts = v.options.map(function (o, i) {
        return '<button class="chip" aria-pressed="' + (i === 0 ? "true" : "false") + '">' + esc(o) + "</button>";
      }).join("");
      return '<div class="varblock"><h4>' + esc(v.axis_ja) + '</h4><div class="varblock__row" role="group" aria-label="' + esc(v.axis_ja) + '">' + opts + "</div></div>";
    }).join("");

    var ctas = (p.cta || []).map(function (c) {
      var cls = c.kind === "primary" ? "btn" : (c.kind === "secondary" ? "btn btn--line" : "btn btn--ghost2");
      return '<a class="' + cls + '" href="' + esc(c.href || "#") + '" data-analytics="' + esc(c.analytics || "") + '">' + esc(c.label_ja) + "</a>";
    }).join("");

    var specs = (p.specs && p.specs.length ? p.specs : [
      { label_ja: "容量", value_ja: p.size }, { label_ja: "原産国", value_ja: p.made_in }
    ]).map(function (s) {
      return "<dt>" + esc(s.label_ja) + "</dt><dd>" + esc(s.value_ja || "—") + "</dd>";
    }).join("");

    var faq = (p.faq && p.faq.length) ? '<section class="wrap"><h2 class="display" style="font-size:clamp(1.6rem,3vw,2.2rem);color:var(--seiji-deep);margin-bottom:1.4rem">よくある質問</h2><div class="faq">' +
      p.faq.map(function (f) {
        return '<div class="faq__item"><button class="faq__q" aria-expanded="false"><span>' + esc(f.q_ja) + '</span><span class="mk" aria-hidden="true">＋</span></button><div class="faq__a"><div>' + esc(f.a_ja) + "</div></div></div>";
      }).join("") + "</div></section>" : "";

    var relProd = (p.related_products || []).map(function (rid) { return byId[rid]; }).filter(Boolean);
    var relProdHTML = relProd.length ? '<section class="wrap"><div class="sec-head"><div><p class="label">Pairs with</p><h2 class="display" style="font-size:clamp(1.8rem,4vw,2.6rem)">あわせて使う</h2></div><a href="products.html">すべての製品 →</a></div><div class="collection">' +
      relProd.map(function (rp) {
        return '<a class="product" href="products.html?id=' + encodeURIComponent(rp.id) + '"><div class="product__img"><span class="product__tag">' + esc(rp.collection_label || "") + '</span><div class="ph">' + esc(rp.glyph) + '</div></div><div class="product__meta"><div class="product__name">' + esc(rp.name_ja) + '</div><div class="product__en">' + esc(rp.name_en) + "</div></div></a>";
      }).join("") + "</div></section>" : "";

    var relArt = (p.related_articles || []).map(function (aid) { return (articles || {})[aid]; }).filter(Boolean);
    var relArtHTML = relArt.length ? '<section class="wrap"><div class="sec-head"><div><p class="label">Journal</p><h2 class="display" style="font-size:clamp(1.8rem,4vw,2.6rem)">読みもの</h2></div><a href="journal.html">すべての記事 →</a></div><div class="related-articles">' +
      relArt.map(function (a) {
        return '<a class="jcard" href="journal.html?id=' + encodeURIComponent(a.id) + '"><div class="jcard__cat">' + esc(a.category_ja || a.category) + '</div><div class="jcard__title">' + esc(a.title_ja) + '</div><div class="jcard__excerpt">' + esc(a.excerpt_ja || "") + "</div></a>";
      }).join("") + "</div></section>" : "";

    var region = p.region_note_ja ? '<div class="region-note"><b>多地域メモ：</b>' + esc(p.region_note_ja) + "</div>" : "";

    return (
      '<section class="wrap pdp">' +
        '<nav class="bc"><a href="index.html">NAGI</a> ／ <a href="products.html">Collections</a> ／ ' + esc(p.name_ja) + "</nav>" +
        '<div class="pdp__top">' +
          '<div><div class="gallery__main" id="gMain" role="img" aria-label="' + esc(gallery[0].alt_ja) + '">' + esc(gallery[0].glyph) + "</div>" +
            (gallery.length > 1 ? '<div class="gallery__thumbs">' + thumbs + "</div>" : "") +
          "</div>" +
          '<div class="pdp__info">' +
            '<p class="kicker">' + esc(p.collection_label || "") + (p.ritual_step ? " ・ Ritual " + p.ritual_step : "") + "</p>" +
            "<h1>" + esc(p.name_ja) + "</h1>" +
            '<div class="en">' + esc(p.name_en) + "</div>" +
            (p.audience_ja ? '<div class="pdp__audience">こんな方へ ── ' + esc(p.audience_ja) + "</div>" : "") +
            '<p class="pdp__lead">' + esc(p.lead_ja || "") + "</p>" +
            '<div class="pdp__price">' + esc(p.price_ja || "") + (p.price_note_ja ? "<small>" + esc(p.price_note_ja) + "</small>" : "") + "</div>" +
            variations +
            '<div class="cta-group">' + ctas + "</div>" +
            region +
          "</div>" +
        "</div>" +
      "</section>" +
      (vprops ? '<section class="ritual"><div class="wrap"><div class="sec-head"><div><p class="label">Why NAGI</p><h2 class="display" style="font-size:clamp(1.8rem,4vw,2.6rem)">選ばれる理由</h2></div></div><div class="vprops">' + vprops + "</div></div></section>" : "") +
      '<section class="wrap"><div style="max-width:760px"><p class="label">Details</p><h2 class="display" style="font-size:clamp(1.6rem,3vw,2.2rem);color:var(--seiji-deep);margin-bottom:1.2rem">仕様</h2><div class="specblock"><dl>' + specs + "</dl></div></div></section>" +
      faq + relProdHTML + relArtHTML +
      '<section class="wrap" style="padding-top:0"><a class="btn btn--line" href="products.html">← コレクションへ戻る</a></section>'
    );
  }

  function wirePDP(root) {
    /* gallery thumbnail switching */
    var main = qs("#gMain", root);
    (root || document).querySelectorAll(".gallery__thumb").forEach(function (t) {
      t.addEventListener("click", function () {
        (root || document).querySelectorAll(".gallery__thumb").forEach(function (x) { x.setAttribute("aria-current", "false"); });
        t.setAttribute("aria-current", "true");
        if (main) { main.textContent = t.getAttribute("data-glyph"); main.setAttribute("aria-label", t.getAttribute("data-alt")); }
      });
    });
    /* variation chips (single-select per group) */
    (root || document).querySelectorAll(".varblock__row").forEach(function (g) {
      g.querySelectorAll(".chip").forEach(function (c) {
        c.addEventListener("click", function () {
          g.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          c.setAttribute("aria-pressed", "true");
        });
      });
    });
    /* FAQ accordion */
    (root || document).querySelectorAll(".faq__q").forEach(function (q) {
      q.addEventListener("click", function () {
        var open = q.getAttribute("aria-expanded") === "true";
        q.setAttribute("aria-expanded", String(!open));
        var a = q.nextElementSibling;
        a.style.maxHeight = open ? null : a.scrollHeight + "px";
      });
    });
  }

  function initProducts() {
    var id = qp("id");
    var list = qs("#product-list");
    var detail = qs("#product-detail");

    if (id && detail) {
      Promise.all([loadJSON("data/products.json"), loadJSON("data/journal.json").catch(function () { return { items: [] }; })])
        .then(function (res) {
          var data = res[0], journal = res[1];
          var p = data.items.filter(function (x) { return x.id === id; })[0];
          if (!p) { detail.innerHTML = '<p class="state">製品が見つかりませんでした。</p>'; return; }
          var byId = {}; data.items.forEach(function (x) { byId[x.id] = x; });
          var articles = {}; (journal.items || []).forEach(function (x) { articles[x.id] = x; });
          setSEO((p.seo && p.seo.title_ja) || (p.name_ja + " ｜ NAGI 凪"), (p.seo && p.seo.description_ja) || p.lead_ja);
          injectJSONLD(p);
          detail.innerHTML = renderPDP(p, byId, articles);
          wirePDP(detail);
        })
        .catch(function () { detail.innerHTML = '<p class="state">コンテンツを読み込めませんでした。</p>'; });
      return;
    }

    loadJSON("data/products.json").then(function (data) {
      if (list) {
        fill(list, data.items.map(productCard));
        observeReveals(list);
      }
    }).catch(function () {
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
