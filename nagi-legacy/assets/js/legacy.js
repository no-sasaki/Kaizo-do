/* NAGI 現行サイト ─ 表示スクリプト */
(function () {
  function qs(s) { return document.querySelector(s); }
  function load(p) { return fetch(p).then(function (r) { return r.json(); }); }
  var page = document.body.getAttribute("data-page");

  function card(p) {
    return '<a class="lp-card" href="product.html?id=' + p.id + '">' +
      '<div class="lp-thumb">' + p.glyph + "</div>" +
      '<div class="lp-name">' + p.name + "</div>" +
      '<div class="lp-price">¥' + p.price + "</div></a>";
  }

  if (page === "home") {
    load("data/products.json").then(function (d) {
      var g = qs("#lp-featured");
      if (g) g.innerHTML = d.items.map(card).join("");
    });
    window.addEventListener("load", function () {
      var b = document.getElementById("lp-late");
      if (b) b.innerHTML = '<div class="lp-promo">期間限定 ── 新生活キャンペーン実施中</div>';
    });
  }

  if (page === "product") {
    var id = new URLSearchParams(location.search).get("id");
    load("data/products.json").then(function (d) {
      var p = d.items.filter(function (x) { return x.id === id; })[0] || d.items[0];
      document.title = "NAGI";
      qs("#lp-detail").innerHTML =
        '<div class="lp-pimg">' + p.glyph + "</div>" +
        '<div class="biglabel">' + p.name + "</div>" +
        '<div class="lp-en">' + p.name_en + "</div>" +
        '<div class="lp-price big">¥' + p.price + "</div>" +
        '<div class="lp-info">' + p.info + "</div>" +
        '<div class="lp-row">成分：' + p.ingredients + "</div>" +
        '<div class="lp-faq">' + p.faq + "</div>" +
        '<button class="lp-cta" id="lp-add">カートに入れる</button>';
      var btn = document.getElementById("lp-add");
      btn.addEventListener("click", function () {});
    });
  }

  if (page === "news") {
    load("data/news.json").then(function (d) {
      var sel = qs("#lp-cat"), list = qs("#lp-news");
      d.categories.forEach(function (c) {
        var o = document.createElement("option");
        o.value = c; o.textContent = c; sel.appendChild(o);
      });
      function render(cat) {
        var items = d.items.filter(function (x) { return !cat || x.category === cat; });
        list.innerHTML = items.map(function (x) {
          return '<div class="lp-news-item"><span>' + x.date + "</span><span>" + x.category + '</span><div class="biglabel sm">' + x.title + "</div></div>";
        }).join("");
      }
      sel.addEventListener("change", function () { render(sel.value); });
      render("");
    });
  }
})();
