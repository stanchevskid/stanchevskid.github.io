const COUNTER_TOTAL_DURATION_MS = 2000;
const STAGGER_STEP_MS = 60;
const STAGGER_MAX_MS = 480;

function computeAge(isoDate) {
    const birth = new Date(isoDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age -= 1;
    }
    return age;
}

function initCounters() {
    const counters = document.querySelectorAll(".num");
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.5 });

    counters.forEach((counter) => observer.observe(counter));
}

function animateCounter(element) {
    const endValue = element.dataset.birthdate
        ? computeAge(element.dataset.birthdate)
        : Number(element.dataset.val);
    if (!endValue || endValue < 1) return;

    const stepDuration = Math.floor(COUNTER_TOTAL_DURATION_MS / endValue);
    let currentValue = 0;

    const timer = setInterval(() => {
        currentValue += 1;
        element.textContent = currentValue;
        if (currentValue >= endValue) clearInterval(timer);
    }, stepDuration);
}

function initStagger() {
    document.querySelectorAll("[data-stagger]").forEach((container) => {
        container.querySelectorAll(".reveal").forEach((element, index) => {
            const delay = Math.min(index * STAGGER_STEP_MS, STAGGER_MAX_MS);
            element.style.setProperty("--reveal-delay", `${delay}ms`);
        });
    });
}

function initReveals() {
    const elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
        elements.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px" });

    elements.forEach((element) => observer.observe(element));
}

function initHeroDive() {
    const inner = document.querySelector(".hero .hero__inner");
    if (!inner) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scrollCue = document.querySelector(".hero__scroll");
    let ticking = false;

    const update = () => {
        ticking = false;
        const scrollY = window.scrollY;
        const progress = Math.min(scrollY / (window.innerHeight * 0.9), 1);
        inner.style.transform = `translateY(${scrollY * 0.25}px) scale(${1 + progress * 0.15})`;
        inner.style.opacity = Math.max(0, 1 - progress * 2);
        if (scrollCue) scrollCue.style.opacity = Math.max(0, 1 - progress * 3);
    };

    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }, { passive: true });
}

function initThemeToggle() {
    const button = document.querySelector(".theme-toggle");
    if (!button) return;

    button.addEventListener("click", () => {
        const root = document.documentElement;
        const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        const applyTheme = () => {
            root.setAttribute("data-theme", nextTheme);
            localStorage.setItem("theme", nextTheme);
        };

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!document.startViewTransition || reducedMotion) {
            applyTheme();
            return;
        }

        root.classList.add("theme-switching");
        const transition = document.startViewTransition(applyTheme);
        transition.finished.finally(() => root.classList.remove("theme-switching"));
        transition.ready.then(() => {
            const rect = button.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const radius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            );
            document.documentElement.animate(
                { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
                { duration: 650, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
            );
        });
    });
}

function initNavPill() {
    const nav = document.querySelector(".site-nav");
    const pill = nav ? nav.querySelector(".site-nav__pill") : null;
    if (!nav || !pill) return;

    const links = Array.from(nav.querySelectorAll("ul a"));
    const selected = nav.querySelector("a.selected");

    const moveTo = (link) => {
        const navRect = nav.getBoundingClientRect();
        const rect = link.getBoundingClientRect();
        pill.style.width = `${rect.width}px`;
        pill.style.height = `${rect.height}px`;
        pill.style.transform = `translate(${rect.left - navRect.left}px, ${rect.top - navRect.top}px)`;
        pill.classList.add("is-visible");
    };

    const rest = () => {
        if (selected) {
            moveTo(selected);
        } else {
            pill.classList.remove("is-visible");
        }
    };

    links.forEach((link) => {
        link.addEventListener("mouseenter", () => moveTo(link));
        link.addEventListener("focus", () => moveTo(link));
    });
    nav.addEventListener("mouseleave", rest);
    window.addEventListener("resize", rest);

    pill.classList.add("no-transition");
    rest();
    requestAnimationFrame(() => {
        requestAnimationFrame(() => pill.classList.remove("no-transition"));
    });
}

function initMobileMenu() {
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector(".mobile-menu");
    const backdrop = document.querySelector(".mobile-menu__backdrop");
    if (!toggle || !menu || !backdrop) return;

    const setOpen = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        menu.classList.toggle("is-open", open);
        backdrop.classList.toggle("is-open", open);
        backdrop.hidden = !open;
    };

    toggle.addEventListener("click", () => {
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    backdrop.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setOpen(false);
    });
    window.addEventListener("resize", () => {
        if (window.innerWidth > 720) setOpen(false);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initStagger();
    initReveals();
    initCounters();
    initHeroDive();
    initThemeToggle();
    initNavPill();
    initMobileMenu();
});
