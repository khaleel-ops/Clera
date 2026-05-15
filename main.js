(function () {
  "use strict";

  var reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce) {
    document.documentElement.classList.add("reduce-motion");
  }

  function removeLoading() {
    document.body.classList.remove("is-loading");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", removeLoading);
  } else {
    requestAnimationFrame(removeLoading);
  }

  function assignMotionStagger() {
    document.querySelectorAll("[data-reveal]").forEach(function (container) {
      container.querySelectorAll("[data-reveal-child]").forEach(function (child, i) {
        child.style.setProperty("--motion-i", String(i));
      });
    });
  }
  assignMotionStagger();

  var dateEl = document.getElementById("proposal-date");
  if (dateEl) {
    dateEl.textContent = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  }

  /* Reading progress */
  var readBar = document.getElementById("read-progress");
  function onScrollProgress() {
    if (!readBar || reduce) return;
    var el = document.documentElement;
    var max = el.scrollHeight - el.clientHeight;
    var p = max > 0 ? el.scrollTop / max : 0;
    readBar.style.transform = "scaleX(" + p + ")";
  }
  window.addEventListener("scroll", onScrollProgress, { passive: true });
  onScrollProgress();

  /* TOC: inline + fixed sidebar */
  var sidebar = document.getElementById("toc-sidebar");
  var indicator = document.getElementById("toc-track-indicator");

  function syncSidebarVisibility() {
    if (!sidebar) return;
    if (window.matchMedia("(min-width: 1400px)").matches) {
      sidebar.removeAttribute("hidden");
    } else {
      sidebar.setAttribute("hidden", "");
    }
    layoutSidebarTrack();
    updateTocIndicator();
  }

  function layoutSidebarTrack() {
    if (!sidebar || sidebar.hasAttribute("hidden")) return;
    var nav = sidebar.querySelector(".toc-sidebar-items");
    var track = sidebar.querySelector(".toc-track");
    if (nav && track) {
      track.style.minHeight = nav.offsetHeight + "px";
    }
  }

  function updateTocIndicator() {
    if (!sidebar || !indicator || sidebar.hasAttribute("hidden")) return;
    var track = sidebar.querySelector(".toc-track");
    var nav = sidebar.querySelector(".toc-sidebar-items");
    var active = nav && nav.querySelector("a.is-active");
    if (!track || !nav || !active) {
      indicator.style.opacity = "0";
      return;
    }
    indicator.style.opacity = "1";
    var trackRect = track.getBoundingClientRect();
    var linkRect = active.getBoundingClientRect();
    var h = linkRect.height;
    var top = linkRect.top - trackRect.top;
    indicator.style.height = h + "px";
    indicator.style.transform = "translateY(" + Math.max(0, top) + "px)";
  }

  window.addEventListener("resize", syncSidebarVisibility);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncSidebarVisibility);
  } else {
    syncSidebarVisibility();
  }

  var sectionIds = [];
  document.querySelectorAll(".toc__list a[href^='#']").forEach(function (a) {
    var id = a.getAttribute("href");
    if (id && id.length > 1) sectionIds.push(id.slice(1));
  });

  function setActiveToc() {
    var threshold = 120;
    var activeId = null;
    for (var i = sectionIds.length - 1; i >= 0; i--) {
      var sec = document.getElementById(sectionIds[i]);
      if (sec && sec.getBoundingClientRect().top <= threshold) {
        activeId = sectionIds[i];
        break;
      }
    }
    if (!activeId && sectionIds[0]) activeId = sectionIds[0];
    document.querySelectorAll('.toc__list a[href^="#"], .toc-sidebar-items a[href^="#"]').forEach(function (a) {
      var href = a.getAttribute("href");
      var id = href && href.slice(1);
      a.classList.toggle("is-active", id === activeId);
    });
    updateTocIndicator();
  }

  if (sectionIds.length) {
    window.addEventListener("scroll", setActiveToc, { passive: true });
    setActiveToc();
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll("[data-reveal]");

  function splitType(el, mode) {
    if (!el || el.dataset.typeSplit) return;
    el.dataset.typeSplit = "1";
    var text = el.textContent.replace(/\s+/g, " ").trim();
    el.textContent = "";
    if (mode === "chars") {
      for (var c = 0; c < text.length; c++) {
        var ch = text.charAt(c);
        var charSpan = document.createElement("span");
        charSpan.className = ch === " " ? "type-char type-char--space" : "type-char";
        charSpan.style.setProperty("--type-i", String(c));
        charSpan.textContent = ch === " " ? "\u00a0" : ch;
        el.appendChild(charSpan);
      }
      return;
    }
    var parts = text.split(/(\s+)/);
    var wordIndex = 0;
    parts.forEach(function (part) {
      if (!part.trim()) {
        el.appendChild(document.createTextNode(" "));
        return;
      }
      var wordSpan = document.createElement("span");
      wordSpan.className = "type-word";
      wordSpan.style.setProperty("--type-i", String(wordIndex));
      wordIndex += 1;
      wordSpan.textContent = part;
      el.appendChild(wordSpan);
    });
  }

  function playType(el) {
    if (!el || el.classList.contains("is-typed")) return;
    splitType(el, el.getAttribute("data-type") || "words");
    requestAnimationFrame(function () {
      el.classList.add("is-typed");
    });
  }

  function playTypesIn(container) {
    if (!container) return;
    if (container.hasAttribute("data-type")) playType(container);
    container.querySelectorAll("[data-type]").forEach(playType);
  }

  document.querySelectorAll(".kicker:not([data-type])").forEach(function (el) {
    el.setAttribute("data-type", "chars");
  });
  document.querySelectorAll(".section-heading:not([data-type])").forEach(function (el) {
    el.setAttribute("data-type", "words");
  });

  var heroReveal = document.querySelector(".post > [data-reveal]");
  if (heroReveal && !reduce) {
    requestAnimationFrame(function () {
      heroReveal.classList.add("is-inview");
      playTypesIn(heroReveal);
    });
  }

  if (revealEls.length) {
    if (reduce) {
      revealEls.forEach(function (el) {
        el.classList.add("is-inview");
        playTypesIn(el);
      });
    } else {
      function revealInView(el) {
        var r = el.getBoundingClientRect();
        return r.top < window.innerHeight * 0.9 && r.bottom > 0;
      }
      revealEls.forEach(function (el) {
        if (revealInView(el)) {
          el.classList.add("is-inview");
          playTypesIn(el);
        }
      });
      var ioReveal = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            en.target.classList.add("is-inview");
            playTypesIn(en.target);
          });
        },
        { threshold: 0.06, rootMargin: "0px 0px -5% 0px" }
      );
      revealEls.forEach(function (el) {
        ioReveal.observe(el);
      });
    }
  }

  var visualEls = document.querySelectorAll("[data-hero-visual], [data-section-visual]");

  visualEls.forEach(function (visual) {
    if (reduce) return;
    var frame = visual.querySelector(".hero-visual__frame");
    if (!frame) return;
    visual.addEventListener("mousemove", function (e) {
      var rect = visual.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      var intensity = visual.hasAttribute("data-section-visual") ? 0.75 : 1;
      frame.style.setProperty("--hero-tilt-x", px * 12 * intensity + "px");
      frame.style.setProperty("--hero-tilt-y", py * 10 * intensity + "px");
      frame.style.setProperty("--hero-rot-x", -py * 5 * intensity + "deg");
      frame.style.setProperty("--hero-rot-y", px * 6 * intensity + "deg");
    });
    visual.addEventListener("mouseleave", function () {
      frame.style.setProperty("--hero-tilt-x", "0px");
      frame.style.setProperty("--hero-tilt-y", "0px");
      frame.style.setProperty("--hero-rot-x", "0deg");
      frame.style.setProperty("--hero-rot-y", "0deg");
    });
  });

  document.querySelectorAll(".kicker").forEach(function (kicker) {
    kicker.addEventListener("mouseenter", function () {
      if (!kicker.classList.contains("is-typed")) playType(kicker);
    });
  });

  if (!reduce) {
    var masthead = document.querySelector(".masthead");
    var lastScrollY = window.scrollY;
    var scrollTicking = false;

    function onScrollMotion() {
      var y = window.scrollY;
      if (masthead) {
        masthead.classList.toggle("is-scrolled", y > 24);
        if (y > 120) {
          masthead.classList.toggle("is-hidden", y > lastScrollY + 4);
        } else {
          masthead.classList.remove("is-hidden");
        }
      }
      lastScrollY = y;

      visualEls.forEach(function (visual) {
        var frame = visual.querySelector(".hero-visual__frame");
        if (!frame) return;
        var rect = visual.getBoundingClientRect();
        var center = rect.top + rect.height * 0.5 - window.innerHeight * 0.5;
        var strength = visual.hasAttribute("data-section-visual") ? 0.04 : 0.06;
        var parallax = Math.max(-32, Math.min(32, center * -strength));
        frame.style.setProperty("--hero-scroll-y", parallax + "px");
      });
      scrollTicking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!scrollTicking) {
          scrollTicking = true;
          requestAnimationFrame(onScrollMotion);
        }
      },
      { passive: true }
    );
    onScrollMotion();

    var compareFlow = document.querySelector(".compare-flow");
    if (compareFlow) {
      var ioCompare = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            en.target.classList.toggle("is-animated", en.isIntersecting);
          });
        },
        { threshold: 0.4 }
      );
      ioCompare.observe(compareFlow);
    }

    document.querySelectorAll(".insight-card, .hypothesis, .stat").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--card-tilt-x", px * 6 + "px");
        card.style.setProperty("--card-tilt-y", py * 5 + "px");
      });
      card.addEventListener("mouseleave", function () {
        card.style.setProperty("--card-tilt-x", "0px");
        card.style.setProperty("--card-tilt-y", "0px");
      });
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        var id = anchor.getAttribute("href");
        if (!id || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top: top, behavior: "smooth" });
      });
    });
  }

  function countUp(el, target, ms) {
    if (reduce) {
      el.textContent = String(target);
      return;
    }
    var start = performance.now();
    function frame(now) {
      var t = Math.min(1, (now - start) / ms);
      var eased = 1 - Math.pow(1 - t, 3.2);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var statNums = document.querySelectorAll(".stat__num[data-count]");
  if (statNums.length) {
    if (reduce) {
      statNums.forEach(function (el) {
        el.textContent = el.getAttribute("data-count") || "0";
      });
    } else {
      var ioStats = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting || en.target.dataset.counted) return;
            en.target.dataset.counted = "1";
            var raw = en.target.getAttribute("data-count");
            var target = raw === null || raw === "" ? 0 : parseInt(raw, 10);
            if (isNaN(target)) target = 0;
            countUp(en.target, target, target === 0 ? 400 : 1400);
            var statCard = en.target.closest(".stat");
            if (statCard) statCard.classList.add("is-counted");
          });
        },
        { threshold: 0.35 }
      );
      statNums.forEach(function (el) {
        ioStats.observe(el);
      });
    }
  }

  if (!reduce) {
    document.querySelectorAll(".btn-magnetic").forEach(function (wrap) {
      var btn = wrap.querySelector(".btn");
      if (!btn) return;
      wrap.addEventListener("mousemove", function (e) {
        var rect = wrap.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = "translate(" + x * 0.12 + "px, " + y * 0.12 + "px)";
      });
      wrap.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });

    document.addEventListener(
      "pointerdown",
      function (e) {
        var btn = e.target.closest("[data-ripple]");
        if (!btn || btn.disabled) return;
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 2.2;
        var circle = document.createElement("span");
        circle.className = "ripple";
        circle.style.width = size + "px";
        circle.style.height = size + "px";
        circle.style.left = e.clientX - rect.left - size / 2 + "px";
        circle.style.top = e.clientY - rect.top - size / 2 + "px";
        btn.appendChild(circle);
        setTimeout(function () {
          circle.remove();
        }, 700);
      },
      true
    );
  }

  var faqItems = document.querySelectorAll("[data-faq-item]");
  function closeFaqItem(item) {
    item.classList.remove("is-open");
    var btn = item.querySelector(".faq__trigger");
    var inner = item.querySelector(".faq__panel-inner");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (inner) inner.setAttribute("inert", "");
  }
  function openFaqItem(item) {
    item.classList.add("is-open");
    var btn = item.querySelector(".faq__trigger");
    var inner = item.querySelector(".faq__panel-inner");
    if (btn) btn.setAttribute("aria-expanded", "true");
    if (inner) inner.removeAttribute("inert");
  }

  faqItems.forEach(function (item) {
    var trigger = item.querySelector(".faq__trigger");
    if (!trigger) return;
    trigger.addEventListener("click", function () {
      var willOpen = !item.classList.contains("is-open");
      if (willOpen) {
        faqItems.forEach(function (other) {
          if (other !== item) closeFaqItem(other);
        });
        openFaqItem(item);
      } else {
        closeFaqItem(item);
      }
    });
  });
})();
