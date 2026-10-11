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
