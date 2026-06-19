(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.querySelector(".hero");
  const footer = document.querySelector(".site-footer");
  const stickyCta = document.querySelector(".sticky-mobile-cta");

  const revealItems = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      revealObserver.observe(item);
    });
  }

  const setupCarousel = (name) => {
    const carousel = document.querySelector(`[data-carousel="${name}"]`);
    if (!carousel) return;

    const prev = document.querySelector(`[data-carousel-prev="${name}"]`);
    const next = document.querySelector(`[data-carousel-next="${name}"]`);
    const progress = document.querySelector(`[data-progress="${name}"]`);
    const cards = [...carousel.children];

    const getStep = () => {
      const first = cards[0];
      if (!first) return carousel.clientWidth;
      return first.getBoundingClientRect().width + parseFloat(getComputedStyle(carousel).gap || 0);
    };

    const move = (direction) => {
      carousel.scrollBy({ left: getStep() * direction, behavior: prefersReducedMotion ? "auto" : "smooth" });
    };

    prev?.addEventListener("click", () => move(-1));
    next?.addEventListener("click", () => move(1));

    const update = () => {
      const max = Math.max(carousel.scrollWidth - carousel.clientWidth, 1);
      const ratio = Math.min(Math.max(carousel.scrollLeft / max, 0), 1);
      if (progress) progress.style.transform = `scaleX(${Math.max(1 / cards.length, ratio)})`;

      if (name === "testimonials") {
        const center = carousel.scrollLeft + carousel.clientWidth / 2;
        let active = cards[0];
        let nearest = Infinity;
        cards.forEach((card) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          const distance = Math.abs(center - cardCenter);
          if (distance < nearest) {
            nearest = distance;
            active = card;
          }
        });
        cards.forEach((card) => card.classList.toggle("is-active", card === active));
      }
    };

    carousel.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    requestAnimationFrame(update);
  };

  ["ingredients", "journey", "testimonials"].forEach(setupCarousel);

  if (window.location.hash) {
    window.addEventListener("load", () => {
      const target = document.querySelector(window.location.hash);
      if (!target) return;
      target.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: "auto", block: "start" });
      }, 80);
    }, { once: true });
  }

  document.querySelectorAll(".faq-list details").forEach((detail) => {
    detail.addEventListener("toggle", () => {
      if (!detail.open) return;
      document.querySelectorAll(".faq-list details").forEach((other) => {
        if (other !== detail) other.open = false;
      });
    });
  });

  if (!prefersReducedMotion && matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".magnetic").forEach((button) => {
      button.addEventListener("mousemove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        button.style.transform = `translate(${x * 0.09}px, ${y * 0.14}px)`;
      });
      button.addEventListener("mouseleave", () => {
        button.style.transform = "";
      });
    });

    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateY(-3px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });

    const parallaxItems = document.querySelectorAll("[data-parallax]");
    window.addEventListener("scroll", () => {
      parallaxItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const speed = Number(item.dataset.parallax || 0.05);
        item.style.translate = `0 ${window.scrollY * speed}px`;
      });
    }, { passive: true });
  }

  if (stickyCta && hero && footer && "IntersectionObserver" in window) {
    const offerSection = document.querySelector("#comprar");
    let heroVisible = true;
    let footerVisible = false;
    let offerVisible = false;
    let offerPassed = false;

    const syncStickyCta = () => {
      const show = !heroVisible && !offerVisible && !offerPassed && !footerVisible;
      stickyCta.classList.toggle("is-visible", show);
    };

    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      syncStickyCta();
    }, { threshold: 0.05 }).observe(hero);

    if (offerSection) {
      new IntersectionObserver(([entry]) => {
        offerVisible = entry.isIntersecting;
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          offerPassed = true;
        }
        syncStickyCta();
      }).observe(offerSection);
    }

    new IntersectionObserver(([entry]) => {
      footerVisible = entry.isIntersecting;
      syncStickyCta();
    }, { threshold: 0.02 }).observe(footer);
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    });
  });
})();
