// NAIFU ナイフ — biography page interactions

// Intro counter loader (000 → 100), then reveal the page
const loader = document.getElementById("loader");
const loaderCount = document.getElementById("loaderCount");
if (loader && loaderCount) {
  document.body.style.overflow = "hidden";
  const duration = 1500;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    loaderCount.textContent = String(Math.floor(eased * 100)).padStart(3, "0");
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      loader.classList.add("done");
      document.body.style.overflow = "";
      setTimeout(() => loader.remove(), 900);
    }
  };
  requestAnimationFrame(tick);
}

// Sticky nav background on scroll
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Mobile menu toggle
const toggle = document.getElementById("navToggle");
const links = document.querySelector(".nav__links");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.classList.toggle("open", open);
});
links.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.classList.remove("open");
  })
);

// Reveal-on-scroll animation
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll("[data-reveal]").forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i % 4, 3) * 0.08}s`;
  revealObserver.observe(el);
});

// Animated stat counters
const animateCount = (el) => {
  const target = parseInt(el.dataset.count, 10);
  const duration = 1600;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString() + "+";
  };
  requestAnimationFrame(step);
};

const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);
document.querySelectorAll(".stat__num").forEach((el) => statObserver.observe(el));

// Video slider (2 videos per slide)
const videoTrack = document.getElementById("videoTrack");
if (videoTrack) {
  const slides = videoTrack.querySelectorAll(".slider__slide");
  const prevBtn = document.getElementById("videoPrev");
  const nextBtn = document.getElementById("videoNext");
  const dotsWrap = document.getElementById("videoDots");
  let index = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "slider__dot";
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Go to video slide ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap.querySelectorAll(".slider__dot");

  const update = () => {
    videoTrack.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;
  };
  const goTo = (i) => {
    index = Math.max(0, Math.min(i, slides.length - 1));
    update();
  };

  prevBtn.addEventListener("click", () => goTo(index - 1));
  nextBtn.addEventListener("click", () => goTo(index + 1));
  update();
}

// Current year in footer
document.getElementById("year").textContent = new Date().getFullYear();
