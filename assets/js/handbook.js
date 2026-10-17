/* AZ-305 Handbook — small page helpers: theme, reading progress, table-of-contents highlight */
(function () {
  var root = document.documentElement;

  // ----- Theme -----
  function storedTheme() {
    try { return localStorage.getItem("az305-theme"); } catch (e) { return null; }
  }
  function saveTheme(v) {
    try { localStorage.setItem("az305-theme", v); } catch (e) { /* storage unavailable */ }
  }
  var t = storedTheme();
  if (t === "light" || t === "dark") root.setAttribute("data-theme", t);

  function isDark() {
    var a = root.getAttribute("data-theme");
    if (a) return a === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      btn.addEventListener("click", function () {
        var next = isDark() ? "light" : "dark";
        root.setAttribute("data-theme", next);
        saveTheme(next);
      });
    }

    // ----- Reading progress -----
    var bar = document.querySelector(".progress");
    if (bar) {
      var onScroll = function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    // ----- Demo kit: open / close every portal demo on the page -----
    var demoBtn = document.querySelector("[data-demos-toggle]");
    if (demoBtn) {
      demoBtn.addEventListener("click", function () {
        var demos = document.querySelectorAll("details.demo");
        var anyClosed = Array.prototype.some.call(demos, function (d) { return !d.open; });
        Array.prototype.forEach.call(demos, function (d) { d.open = anyClosed; });
        demoBtn.textContent = anyClosed ? "Close all demos" : "Open all demos";
      });
    }
    // Opening a demo or tree node from a link (#id) expands it and every <details> around it
    function openTo(el) {
      if (!el) return;
      if (el.tagName === "DETAILS") el.open = true;
      var own = el.querySelector(":scope > details");
      if (own) own.open = true;
      for (var p = el.parentElement; p; p = p.parentElement) {
        if (p.tagName === "DETAILS") p.open = true;
      }
    }
    function openHashDemo() {
      openTo(location.hash && document.getElementById(location.hash.slice(1)));
    }
    window.addEventListener("hashchange", openHashDemo);
    openHashDemo();

    // ----- Service map tree: expand / collapse, keyword filter, jump links -----
    var tree = document.querySelector("[data-tree]");
    if (tree) {
      var all = function (sel) { return Array.prototype.slice.call(tree.querySelectorAll(sel)); };
      var status = document.querySelector("[data-tree-status]");
      var filter = document.querySelector("[data-tree-filter]");

      Array.prototype.forEach.call(document.querySelectorAll("[data-tree-expand]"), function (btn) {
        btn.addEventListener("click", function () {
          var mode = btn.getAttribute("data-tree-expand");
          all("li.tn-branch > details").forEach(function (d) { d.open = mode !== "none"; });
          all("li.tn-leaf > details").forEach(function (d) { d.open = mode === "all"; });
        });
      });

      document.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest("a.tn-jump, a.ft-link, a.ft-cat-head");
        if (!a) return;
        var target = document.getElementById(a.getAttribute("href").slice(1));
        if (!target) return;
        if (filter && filter.value) { filter.value = ""; runFilter(); }
        openTo(target);
        target.classList.remove("tn-flash");
        void target.offsetWidth;
        target.classList.add("tn-flash");
      });

      var runFilter = function () {
        var words = filter.value.toLowerCase().split(/\s+/).filter(Boolean);
        var items = all("li");
        items.forEach(function (li) { li.classList.remove("tn-hide", "tn-hit"); });
        if (!words.length) { if (status) status.textContent = ""; return; }
        var matches = function (text) {
          text = text.toLowerCase();
          return words.every(function (w) { return text.indexOf(w) !== -1; });
        };
        var keep = new Set();
        var hits = 0;
        all("li.tn-leaf").forEach(function (li) {
          if (li.classList.contains("tn-ref") || !matches(li.textContent)) return;
          hits++;
          li.classList.add("tn-hit");
          for (var p = li; p && p !== tree; p = p.parentElement) {
            if (p.tagName === "LI") keep.add(p);
            if (p.tagName === "DETAILS" && p !== li.firstElementChild) p.open = true;
          }
        });
        items.forEach(function (li) { if (!keep.has(li)) li.classList.add("tn-hide"); });
        if (status) {
          status.textContent = hits
            ? hits + (hits === 1 ? " match" : " matches") + " for “" + filter.value.trim() + "”. Open a highlighted leaf for the detail."
            : "No match for “" + filter.value.trim() + "”. Try a shorter word.";
        }
      };
      if (filter) filter.addEventListener("input", runFilter);
    }

    // ----- Glossary terms: tap or click an underlined term for its meaning -----
    var pop = null;
    function closePop() { if (pop) { pop.remove(); pop = null; } }
    document.addEventListener("click", function (ev) {
      var ab = ev.target.closest && ev.target.closest("abbr[data-g]");
      if (!ab) { if (pop && !pop.contains(ev.target)) closePop(); return; }
      ev.preventDefault();
      closePop();
      pop = document.createElement("div");
      pop.className = "abbr-pop";
      pop.setAttribute("role", "tooltip");
      var head = document.createElement("b"); head.textContent = ab.textContent;
      var text = document.createElement("span"); text.textContent = ab.getAttribute("title");
      var link = document.createElement("a"); link.href = "glossary.html#" + ab.getAttribute("data-g"); link.textContent = "Open in glossary →";
      pop.appendChild(head); pop.appendChild(text); pop.appendChild(document.createElement("br")); pop.appendChild(link);
      document.body.appendChild(pop);
      var r = ab.getBoundingClientRect();
      var left = Math.max(16, Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 16));
      pop.style.left = left + "px";
      pop.style.top = (r.bottom + window.scrollY + 6) + "px";
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") closePop();
      if (ev.key === "Enter" && document.activeElement && document.activeElement.matches("abbr[data-g]")) document.activeElement.click();
    });
    Array.prototype.forEach.call(document.querySelectorAll("abbr[data-g]"), function (ab) { ab.tabIndex = 0; });

    // ----- Glossary page: keyword filter -----
    var gf = document.querySelector("[data-gloss-filter]");
    if (gf) {
      var gItems = Array.prototype.slice.call(document.querySelectorAll(".g-item"));
      var gGroups = Array.prototype.slice.call(document.querySelectorAll(".g-group"));
      var gStatus = document.querySelector("[data-gloss-status]");
      gf.addEventListener("input", function () {
        var q = gf.value.trim().toLowerCase(), shown = 0;
        gItems.forEach(function (it) {
          var hit = !q || it.textContent.toLowerCase().indexOf(q) !== -1;
          it.classList.toggle("g-hide", !hit);
          if (hit) shown++;
        });
        gGroups.forEach(function (g) { g.classList.toggle("g-hide", !g.querySelector(".g-item:not(.g-hide)")); });
        if (gStatus) gStatus.textContent = q ? shown + (shown === 1 ? " term matches" : " terms match") + " “" + gf.value.trim() + "”" : gItems.length + " terms";
      });
    }

    // ----- Cross-cloud map: keyword filter, "I know" column order, only-differences toggle -----
    var xp = document.querySelector("[data-xc-page]");
    if (xp) {
      var xRows = Array.prototype.slice.call(xp.querySelectorAll(".xc-row:not(.xc-head)"));
      var xSecs = Array.prototype.slice.call(xp.querySelectorAll(".xc-sec"));
      var xf = xp.querySelector("[data-xc-filter]");
      var xd = xp.querySelector("[data-xc-diff]");
      var xStatus = xp.querySelector("[data-xc-status]");
      var xBtns = Array.prototype.slice.call(xp.querySelectorAll("[data-xc-first]"));
      xRows.forEach(function (r) { r._t = r.textContent.toLowerCase(); });

      var runX = function () {
        var words = xf.value.toLowerCase().split(/\s+/).filter(Boolean), onlyDiff = xd.checked, shown = 0;
        xRows.forEach(function (r) {
          var hit = (!onlyDiff || r.getAttribute("data-m") !== "same") &&
            words.every(function (w) { return r._t.indexOf(w) !== -1; });
          r.classList.toggle("xc-hide", !hit);
          if (hit) shown++;
        });
        xSecs.forEach(function (s) { s.classList.toggle("xc-hide", !s.querySelector(".xc-row:not(.xc-head):not(.xc-hide)")); });
        var filtered = words.length || onlyDiff;
        xStatus.textContent = filtered
          ? (shown ? shown + " of " + xRows.length + " rows" + (words.length ? " match “" + xf.value.trim() + "”" : "") + (onlyDiff ? " (differences only)" : "")
                   : "No match for “" + xf.value.trim() + "”. Try a shorter word or another cloud's name.")
          : xRows.length + " rows";
      };
      xf.addEventListener("input", runX);
      xd.addEventListener("change", runX);

      var setFirst = function (c) {
        xp.setAttribute("data-first", c);
        xBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-xc-first") === c ? "true" : "false"); });
      };
      xBtns.forEach(function (b) {
        b.addEventListener("click", function () {
          var c = b.getAttribute("data-xc-first");
          setFirst(c);
          try { localStorage.setItem("az305-xc-first", c); } catch (e) { /* storage unavailable */ }
        });
      });
      var savedFirst = null;
      try { savedFirst = localStorage.getItem("az305-xc-first"); } catch (e) { /* storage unavailable */ }
      if (savedFirst === "az" || savedFirst === "aws" || savedFirst === "gcp") setFirst(savedFirst);
    }

    // ----- TOC: open on desktop, highlight current section -----
    var tocDetails = document.querySelector(".toc details");
    if (tocDetails && window.matchMedia("(min-width: 1021px)").matches) tocDetails.open = true;

    var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var targets = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (current) current.classList.remove("active");
          current = map[e.target.id];
          if (current) current.classList.add("active");
        }
      });
    }, { rootMargin: "-90px 0px -70% 0px", threshold: 0 });
    targets.forEach(function (el) { io.observe(el); });
  });
})();
