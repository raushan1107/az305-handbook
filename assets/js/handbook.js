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
    // Opening a demo from a link (#demo-...) expands it
    function openHashDemo() {
      var el = location.hash && document.getElementById(location.hash.slice(1));
      if (el && el.tagName === "DETAILS") el.open = true;
    }
    window.addEventListener("hashchange", openHashDemo);
    openHashDemo();

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
