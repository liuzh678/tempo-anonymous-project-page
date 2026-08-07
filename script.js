const copyButton = document.querySelector("[data-copy='bibtex']");
const bibtex = document.getElementById("bibtex");

if (copyButton && bibtex) {
  copyButton.addEventListener("click", async () => {
    const originalLabel = copyButton.textContent;
    try {
      await navigator.clipboard.writeText(bibtex.textContent.trim());
      copyButton.textContent = "Copied";
    } catch {
      copyButton.textContent = "Copy failed";
    }

    window.setTimeout(() => {
      copyButton.textContent = originalLabel;
    }, 1600);
  });
}

const siteNav = document.querySelector(".site-nav");
const navLinkStrip = document.querySelector(".nav-links");
const sectionLinks = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
const sectionTargets = sectionLinks
  .map((link) => ({ link, target: document.querySelector(link.getAttribute("href")) }))
  .filter(({ target }) => target);

let navigationFramePending = false;
let activeNavigationTarget;

const updateNavigation = () => {
  siteNav?.classList.toggle("is-scrolled", window.scrollY > 10);

  const activationOffset = (siteNav?.offsetHeight || 0) + 150;
  let currentTarget = sectionTargets[0]?.target;

  sectionTargets.forEach(({ target }) => {
    if (target.getBoundingClientRect().top <= activationOffset) {
      currentTarget = target;
    }
  });

  sectionTargets.forEach(({ link, target }) => {
    const isActive = target === currentTarget;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (currentTarget && currentTarget !== activeNavigationTarget) {
    activeNavigationTarget = currentTarget;
    const activeLink = sectionTargets.find(({ target }) => target === currentTarget)?.link;
    if (activeLink && navLinkStrip) {
      const stripBounds = navLinkStrip.getBoundingClientRect();
      const linkBounds = activeLink.getBoundingClientRect();
      const centeredPosition =
        navLinkStrip.scrollLeft +
        linkBounds.left -
        stripBounds.left -
        (navLinkStrip.clientWidth - linkBounds.width) / 2;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      navLinkStrip.scrollTo({ left: centeredPosition, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  }

  navigationFramePending = false;
};

window.addEventListener(
  "scroll",
  () => {
    if (!navigationFramePending) {
      window.requestAnimationFrame(updateNavigation);
      navigationFramePending = true;
    }
  },
  { passive: true }
);

updateNavigation();
