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

    // ----- Casebook: one case visible at a time (tabs), #case-n deep links, "next case" buttons -----
    var cbPanels = Array.prototype.slice.call(document.querySelectorAll("[data-cb-case]"));
    var cbTabs = Array.prototype.slice.call(document.querySelectorAll("[data-cb-tab]"));
    if (cbPanels.length && cbTabs.length) {
      var cbIds = cbPanels.map(function (p) { return p.id; });
      var showCase = function (id, scroll) {
        cbPanels.forEach(function (p) { p.hidden = p.id !== id; });
        cbTabs.forEach(function (t) {
          var on = t.getAttribute("data-cb-tab") === id;
          t.setAttribute("aria-selected", on ? "true" : "false");
          t.tabIndex = on ? 0 : -1;
        });
        if (history.replaceState) history.replaceState(null, "", "#" + id);
        if (scroll) document.getElementById(id).scrollIntoView();
      };
      cbTabs.forEach(function (t, i) {
        t.addEventListener("click", function () { showCase(t.getAttribute("data-cb-tab"), false); });
        t.addEventListener("keydown", function (e) {
          var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
          if (!d) return;
          var nt = cbTabs[(i + d + cbTabs.length) % cbTabs.length];
          showCase(nt.getAttribute("data-cb-tab"), false); nt.focus();
        });
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-cb-goto]"), function (el) {
        el.addEventListener("click", function (e) {
          var id = el.getAttribute("data-cb-goto");
          e.preventDefault();
          if (cbIds.indexOf(id) !== -1) showCase(id, true);
          else { var target = document.getElementById(id); if (target) target.scrollIntoView(); }
        });
      });
      var fromHash = function () {
        var h = location.hash.slice(1);
        if (cbIds.indexOf(h) !== -1) { showCase(h, true); return true; }
        return false;
      };
      if (!fromHash()) showCase(cbIds[0], false);
      window.addEventListener("hashchange", fromHash);
    }

    // ----- Casebook: grade on submit, reveal answers and architecture, cross-cloud toggle, retry -----
    Array.prototype.forEach.call(document.querySelectorAll("[data-cb-case]"), function (cs) {
      var form = cs.querySelector(".cb-quiz"), reveal = cs.querySelector(".cb-reveal"), score = cs.querySelector(".cb-score");
      var submitBtn = cs.querySelector("[data-cb-submit]"), resetBtn = cs.querySelector("[data-cb-reset]");
      var warn = cs.querySelector(".cb-warn"), spotRes = cs.querySelector(".cb-spot-res");
      var crossBtn = cs.querySelector("[data-cb-cross]"), cross = cs.querySelector(".cb-cross");
      var each = function (sel, fn) { Array.prototype.forEach.call(form.querySelectorAll(sel), fn); };
      var label = "Submit my design", armed = false;
      var brief = cs.querySelector(".cb-brief-text"), hintsUsed = 0;

      // Hints: show a guiding question and highlight this decision's key phrases in the brief.
      var highlight = function (phrase, tag) {
        var walker = document.createTreeWalker(brief, NodeFilter.SHOW_TEXT), nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(function (n) {
          var i = n.nodeValue.toLowerCase().indexOf(phrase);
          if (i === -1) return;
          var r = document.createRange(), m = document.createElement("mark");
          m.className = "cb-hl"; m.setAttribute("data-hl", tag);
          r.setStart(n, i); r.setEnd(n, i + phrase.length);
          r.surroundContents(m);
        });
      };
      var unhighlight = function (tag) {
        Array.prototype.forEach.call(brief.querySelectorAll('mark[data-hl="' + tag + '"]'), function (m) {
          var parent = m.parentNode;
          while (m.firstChild) parent.insertBefore(m.firstChild, m);
          parent.removeChild(m);
        });
        brief.normalize();
      };
      Array.prototype.forEach.call(cs.querySelectorAll("[data-cb-hint]"), function (btn, idx) {
        var box = btn.parentNode.nextElementSibling, tag = cs.id + "-h" + idx;
        var phrases = JSON.parse(btn.getAttribute("data-triggers") || "[]");
        btn.addEventListener("click", function () {
          var open = box.hidden;
          box.hidden = !open;
          btn.setAttribute("aria-expanded", open ? "true" : "false");
          btn.textContent = open ? "Hide hint" : "Reveal hint";
          if (open) {
            if (!btn.hasAttribute("data-used")) { btn.setAttribute("data-used", ""); hintsUsed++; }
            phrases.forEach(function (p) { highlight(p, tag); });
          } else unhighlight(tag);
        });
        var jump = box.querySelector("[data-cb-jump]");
        if (jump) jump.addEventListener("click", function () {
          var first = brief.querySelector('mark[data-hl="' + tag + '"]');
          if (first) first.scrollIntoView({ block: "center" });
        });
      });

      form.addEventListener("change", function () {
        if (!armed) return;
        armed = false; warn.hidden = true; submitBtn.textContent = label;
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var open = Array.prototype.filter.call(form.querySelectorAll(".cb-q"), function (q) { return !q.querySelector("input:checked"); }).length;
        if (open && !armed) {
          armed = true;
          warn.textContent = open + (open === 1 ? " decision is" : " decisions are") + " still unanswered. Answer them, or press again to submit anyway.";
          warn.hidden = false; submitBtn.textContent = "Submit anyway";
          return;
        }
        grade();
      });

      function grade() {
        var spots = form.querySelectorAll(".cb-spot input"), spotRight = 0;
        Array.prototype.forEach.call(spots, function (inp) {
          var ok = inp.getAttribute("data-ok") === "1", lab = inp.closest(".cb-opt");
          if (ok && inp.checked) { lab.classList.add("is-right"); spotRight++; }
          else if (ok) lab.classList.add("is-missed");
          else if (inp.checked) lab.classList.add("is-wrong");
          else { lab.classList.add("is-fine"); spotRight++; }
        });
        spotRes.textContent = spotRight + " of " + spots.length + " phrases classified correctly. Green: constraints you caught. Amber: constraints you missed. Red: background you ticked as a constraint.";
        spotRes.hidden = false;

        var qs = form.querySelectorAll(".cb-q"), qRight = 0;
        Array.prototype.forEach.call(qs, function (q) {
          var chosen = q.querySelector("input:checked"), res = q.querySelector(".cb-res");
          Array.prototype.forEach.call(q.querySelectorAll("input"), function (inp) {
            var lab = inp.closest(".cb-opt");
            if (inp.getAttribute("data-ok") === "1") lab.classList.add("is-right");
            else if (inp.checked) lab.classList.add("is-wrong");
          });
          if (!chosen) { res.textContent = "Not answered"; res.className = "cb-res skip"; }
          else if (chosen.getAttribute("data-ok") === "1") { res.textContent = "Correct"; res.className = "cb-res ok"; qRight++; }
          else { res.textContent = "Not quite"; res.className = "cb-res no"; }
          res.hidden = false;
          q.querySelector(".cb-after").hidden = false;
        });

        each(".cb-why", function (w) { w.hidden = false; });
        each("input", function (i) { i.disabled = true; });
        form.classList.add("is-done");
        submitBtn.hidden = true; resetBtn.hidden = false; warn.hidden = true; armed = false;

        var pct = qRight / qs.length;
        var verdict = pct === 1 ? "Every decision matches the reference design. Now check the configuration table: the details are where real designs differ."
          : pct >= 0.7 ? "A solid design. For each decision marked 'Not quite', read the trigger words: they show the sentence in the brief that decides it."
          : "Worth a second pass. Read the explanation under every option above, re-read the brief, then try the case again.";
        score.innerHTML = '<p class="cb-big">' + qRight + " of " + qs.length + " design decisions right · " + spotRight + " of " + spots.length + " phrases classified correctly</p>" +
          "<p>" + verdict + "</p>" +
          (hintsUsed ? "<p>Hints used: " + hintsUsed + ". Fine while learning; in the exam you'll spot those phrases on your own.</p>" : "") +
          "<p>Scroll up: every decision now explains the service, why it fits and how to reason to it. Read on for the reference architecture.</p>";
        reveal.hidden = false;
        score.focus();
      }

      resetBtn.addEventListener("click", function () {
        form.reset();
        each(".cb-opt", function (l) { l.classList.remove("is-right", "is-wrong", "is-missed", "is-fine"); });
        each(".cb-why, .cb-after, .cb-res", function (el) { el.hidden = true; });
        each("input", function (i) { i.disabled = false; });
        form.classList.remove("is-done");
        spotRes.hidden = true; reveal.hidden = true; cross.hidden = true;
        crossBtn.setAttribute("aria-expanded", "false");
        crossBtn.textContent = "Show how AWS and Google Cloud would do it";
        submitBtn.hidden = false; submitBtn.textContent = label; resetBtn.hidden = true;
        Array.prototype.forEach.call(cs.querySelectorAll("[data-cb-hint]"), function (btn, idx) {
          btn.removeAttribute("data-used"); btn.setAttribute("aria-expanded", "false"); btn.textContent = "Reveal hint";
          btn.parentNode.nextElementSibling.hidden = true;
          unhighlight(cs.id + "-h" + idx);
        });
        hintsUsed = 0;
        cs.scrollIntoView();
      });

      crossBtn.addEventListener("click", function () {
        var show = cross.hidden;
        cross.hidden = !show;
        crossBtn.setAttribute("aria-expanded", show ? "true" : "false");
        crossBtn.textContent = show ? "Hide the AWS and Google Cloud comparison" : "Show how AWS and Google Cloud would do it";
      });
    });

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
