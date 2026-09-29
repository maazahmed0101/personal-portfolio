/*
 * Portfolio behaviour: mobile menu, typing text, hero intro, scroll reveals, EmailJS contact form.
 *
 * Load order in index.html matters: Bootstrap -> EmailJS -> SweetAlert2 -> GSAP -> this file.
 * (Previously this file ran before EmailJS had loaded, so `emailjs` was undefined, the script
 *  aborted, and no contact-form handler was ever attached.)
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------------------------------
  // Configuration (values unchanged from the original project)
  // ---------------------------------------------------------------------------------------
  var EMAILJS = {
    publicKey: "TyHmMX8WhakS1cBwa",
    serviceId: "service_2o12paq",
    templateId: "template_8oyy2zb",
  };
  var TYPING_WORDS = ["Web Developer", "Frontend Developer", "Freelancer"];

  var root = document.documentElement;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var isDesktop = window.matchMedia("(min-width: 992px)"); // Bootstrap "lg": hero/about switch to two columns

  // ---------------------------------------------------------------------------------------
  // Mobile menu: keep the hamburger "X" state in sync with Bootstrap's collapse
  // ---------------------------------------------------------------------------------------
  function initMenu() {
    var toggler = document.getElementById("menuBtn");
    var menu = document.getElementById("navbarNav");
    if (!toggler || !menu) return;

    menu.addEventListener("show.bs.collapse", function () {
      toggler.classList.add("active");
    });
    menu.addEventListener("hide.bs.collapse", function () {
      toggler.classList.remove("active");
    });

    // Close the open menu after choosing a section (otherwise it covers the page on phones)
    menu.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        if (
          menu.classList.contains("show") &&
          window.bootstrap &&
          window.bootstrap.Collapse
        ) {
          window.bootstrap.Collapse.getOrCreateInstance(menu, {
            toggle: false,
          }).hide();
        }
      });
    });
  }

  // ---------------------------------------------------------------------------------------
  // Typing text (same words and speeds as before)
  // ---------------------------------------------------------------------------------------
  function initTyping(startDelayMs) {
    var output = document.getElementById("typing-text");
    if (!output) return;

    if (reducedMotion.matches) {
      // no typing loop: show a static role
      output.textContent = TYPING_WORDS[0];
      return;
    }

    var wordIndex = 0;
    var charIndex = 0;
    var isDeleting = false;

    function type() {
      var word = TYPING_WORDS[wordIndex];
      charIndex += isDeleting ? -1 : 1;
      output.textContent = word.substring(0, charIndex);

      var delay = isDeleting ? 50 : 150;
      if (!isDeleting && charIndex === word.length) {
        delay = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % TYPING_WORDS.length;
        delay = 500;
      }
      setTimeout(type, delay);
    }

    setTimeout(type, startDelayMs || 0);
  }

  // ---------------------------------------------------------------------------------------
  // Animations (GSAP). Start-states are in CSS under `.anim`; `.is-revealed` marks finished items.
  // ---------------------------------------------------------------------------------------
  function markRevealed(elements) {
    elements.forEach(function (el) {
      el.classList.add("is-revealed");
    });
  }

  // Tween `targets` from an offset/opacity 0 to rest, then hand control back to CSS
  // (clearProps) so hover/float styles keep working afterwards.
  function enter(targets, offsets, vars) {
    var elements = gsap.utils.toArray(targets);
    if (!elements.length) return;
    var from = Object.assign({ opacity: 0 }, offsets);
    var to = { opacity: 1, ease: "power2.out" };
    Object.keys(offsets).forEach(function (key) {
      to[key] = key === "scale" ? 1 : 0;
    });
    Object.assign(to, vars);
    to.onComplete = function () {
      markRevealed(elements);
      gsap.set(elements, { clearProps: "opacity,transform" });
    };
    gsap.fromTo(elements, from, to);
  }

  function heroIntro() {
    var wide = isDesktop.matches;
    var image = document.querySelector('[data-hero="image"]');

    // Slide distances are small and never exceed the room left of the viewport edge,
    // so the entrance can't create horizontal scrolling.
    var fromLeft = wide ? { x: -48 } : { y: 24 };
    var fromRight = { y: 32 };
    if (wide && image) {
      var room = root.clientWidth - image.getBoundingClientRect().right - 2;
      fromRight = { x: Math.max(0, Math.min(48, room)) };
    }
    var rise = { y: 20 };

    function at(selector, offsets, vars, position) {
      // Each hero item is its own timeline entry so positions stay readable
      timeline.call(
        function () {
          enter(selector, offsets, vars);
        },
        null,
        position,
      );
    }

    var timeline = gsap.timeline();

    // Header (same idea as before, much shorter: no more ~5s wait for the nav links)
    gsap.from(".headerH21", {
      y: -60,
      duration: 0.6,
      ease: "power2.out",
      clearProps: "transform",
    });
    gsap.from(".headerLi li", {
      y: -60,
      duration: 0.6,
      delay: 0.1,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "transform",
    });

    // Greeting -> name -> role (typing) -> paragraph -> social icons -> button, image from the right
    at('[data-hero="greeting"]', fromLeft, { duration: 0.7 }, 0.1);
    at('[data-hero="name"]', fromLeft, { duration: 0.7 }, 0.25);
    at('[data-hero="role"]', fromLeft, { duration: 0.7 }, 0.4);
    at('[data-hero="text"]', fromLeft, { duration: 0.7 }, 0.55);
    at('[data-hero="social"]', rise, { duration: 0.6, stagger: 0.1 }, 0.8);
    at('[data-hero="cta"]', rise, { duration: 0.6 }, 1.0);
    at('[data-hero="image"]', fromRight, { duration: 0.9 }, 0.3);

    initTyping(750);

    // Fail-safe: never leave the hero hidden if the tab was throttled / a tween didn't finish
    setTimeout(function () {
      document.querySelectorAll("[data-hero]").forEach(function (el) {
        if (!el.classList.contains("is-revealed")) {
          el.style.opacity = "";
          el.style.transform = "";
          el.classList.add("is-revealed");
        }
      });
    }, 4500);
  }

  function scrollReveals() {
    var all = Array.prototype.slice.call(
      document.querySelectorAll("[data-reveal]"),
    );
    if (!("IntersectionObserver" in window)) {
      markRevealed(all);
      return;
    }

    // dir: where the item comes from. Two-column layouts slide sideways on desktop only;
    // stacked (tablet/phone) layouts use a small upward move so nothing pokes past the viewport.
    function offsetsFor(dir, distance) {
      var wide = isDesktop.matches;
      if (dir === "left") return wide ? { x: -40 } : { y: 24 };
      if (dir === "right") return wide ? { x: 30 } : { y: 24 };
      if (dir === "scale") return { y: 24, scale: 0.97 };
      return { y: distance || 24 }; // 'up' / 'fade'
    }

    var groups = [
      // ABOUT
      { sel: "#About .imgContainer", dir: "left", vars: { duration: 0.8 } },
      { sel: "#About .sec2header", dir: "up", vars: { duration: 0.7 } },
      {
        sel: "#About .sec2H3, #About .sec2P",
        dir: "right",
        vars: { duration: 0.7, delay: 0.1, stagger: 0.12 },
      },
      {
        sel: "#About .sec2Button",
        dir: "up",
        distance: 16,
        vars: { duration: 0.6, delay: 0.35 },
      },
      // SKILLS
      { sel: "#Service .sec3h1", dir: "up", vars: { duration: 0.7 } },
      {
        sel: "#Service .sec3Col",
        dir: "up",
        distance: 32,
        vars: { duration: 0.7, stagger: 0.15 },
      },
      // PROJECTS
      { sel: "#Portfolio .sec4H1", dir: "up", vars: { duration: 0.7 } },
      {
        sel: "#Portfolio .col1sec4, #Portfolio .col2",
        dir: "up",
        distance: 30,
        vars: { duration: 0.7, stagger: 0.12 },
      },
      // CONTACT
      { sel: "#Contact .sec5h1", dir: "up", vars: { duration: 0.7 } },
      { sel: "#contact-form", dir: "scale", vars: { duration: 0.8 } },
      // FOOTER
      {
        sel: ".CopyRight p",
        dir: "fade",
        distance: 12,
        vars: { duration: 0.9 },
      },
    ];

    groups.forEach(function (group) {
      var items = gsap.utils.toArray(group.sel);
      if (!items.length) return;

      var observer = new IntersectionObserver(
        function (entries) {
          var visible = [];
          var skipped = [];
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              visible.push(entry.target);
            } else if (entry.boundingClientRect.bottom <= 0) {
              skipped.push(entry.target); // already scrolled past (e.g. page restored lower down)
            }
          });
          skipped.forEach(function (el) {
            observer.unobserve(el);
          });
          markRevealed(skipped);
          if (!visible.length) return;

          visible.forEach(function (el) {
            observer.unobserve(el);
          });
          visible.sort(function (a, b) {
            return items.indexOf(a) - items.indexOf(b);
          });
          enter(visible, offsetsFor(group.dir, group.distance), group.vars);
        },
        { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
      );

      items.forEach(function (el) {
        observer.observe(el);
      });
    });
  }

  function initAnimations() {
    if (!window.gsap || reducedMotion.matches) {
      // Nothing is hidden waiting for an animation that will not run
      root.classList.remove("anim");
      initTyping(0);
      return;
    }
    try {
      heroIntro();
      scrollReveals();
    } catch (error) {
      console.error(
        "Animation setup failed, showing content without animation:",
        error,
      );
      root.classList.remove("anim");
      document
        .querySelectorAll("[data-hero], [data-reveal]")
        .forEach(function (el) {
          el.style.opacity = "";
          el.style.transform = "";
          el.classList.add("is-revealed");
        });
      initTyping(0);
    }
  }

  // ---------------------------------------------------------------------------------------
  // Contact form (EmailJS): ONE submit handler, ONE request per submit
  // ---------------------------------------------------------------------------------------
  function notify(icon, title, text) {
    if (window.Swal) {
      window.Swal.fire({
        title: title,
        text: text,
        icon: icon,
        confirmButtonColor: "#0ef",
      });
    } else {
      window.alert(title + "\n" + text);
    }
  }

  function describeError(error) {
    if (error && typeof error === "object") {
      if (error.text) return String(error.text);
      if (error.message) return String(error.message);
      if (error.status === 0)
        return "Network error. Please check your internet connection.";
    }
    if (typeof error === "string" && error) return error;
    return "Unknown error.";
  }

  function initContactForm() {
    var form = document.getElementById("contact-form");
    var button = document.getElementById("sendBtn");
    if (!form || !button) return;

    var idleLabel = button.textContent.trim() || "Send Message";
    var sending = false;

    if (window.emailjs && typeof window.emailjs.init === "function") {
      window.emailjs.init(EMAILJS.publicKey);
    } else {
      console.error(
        "EmailJS library did not load; the contact form cannot send.",
      );
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (sending) return; // ignore double clicks / repeated Enter presses

      if (!window.emailjs) {
        notify(
          "error",
          "Error!",
          "The email service could not be loaded. Please check your connection and reload the page.",
        );
        return;
      }

      sending = true;
      button.disabled = true;
      button.textContent = "Sending...";

      var request;
      try {
        request = window.emailjs.sendForm(
          EMAILJS.serviceId,
          EMAILJS.templateId,
          form,
        );
      } catch (error) {
        request = Promise.reject(error);
      }

      request
        .then(
          function () {
            form.reset(); // only after a confirmed success
            notify(
              "success",
              "Message Sent!",
              "Your message has been delivered successfully 🚀",
            );
          },
          function (error) {
            console.error("EmailJS send failed:", error);
            notify(
              "error",
              "Error!",
              "Your message could not be sent. " +
                describeError(error) +
                " Please try again.",
            );
          },
        )
        .then(function () {
          sending = false;
          button.disabled = false;
          button.textContent = idleLabel;
        });
    });
  }

  // ---------------------------------------------------------------------------------------
  initMenu();
  initContactForm();
  initAnimations();
})();
