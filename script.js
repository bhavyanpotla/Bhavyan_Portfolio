const siteLoader = document.getElementById("site-loader");

if (siteLoader) {
  document.body.classList.add("loading");

  setTimeout(() => {
    siteLoader.classList.add("is-hidden");
    document.body.classList.remove("loading");

    setTimeout(() => {
      siteLoader.remove();
    }, 1000);
  }, 5000);
}
const nav = document.querySelector(".nav");
const menu = document.querySelector(".menu");

menu?.addEventListener("click", () => nav.classList.toggle("open"));
document.querySelectorAll(".nav-links a").forEach(a =>
  a.addEventListener("click", () => nav.classList.remove("open"))
);

// Lightweight active-section tracking.
const links = [...document.querySelectorAll(".nav-links a")];
const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(a => a.classList.toggle(
        "active",
        a.getAttribute("href") === "#" + entry.target.id
      ));
      entry.target.classList.add("is-active");
    }
  });
}, { threshold: .2 });
sections.forEach(s => observer.observe(s));

// Fast, subtle card interaction. Disabled for reduced-motion users.
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!prefersReduced && window.matchMedia("(pointer:fine)").matches) {
  document.querySelectorAll(".tilt").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform =
        `perspective(1200px) rotateX(${-y * 2.5}deg) rotateY(${x * 3.5}deg) translateZ(2px)`;
    }, { passive: true });
    card.addEventListener("pointerleave", () => card.style.transform = "");
  });
}

// Reveal-on-scroll.
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("revealed");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .08 });

document.querySelectorAll(
  ".profile-card,.stat,.milestone,.mission,.edu,.skill,.resume-card,.contact-panel"
).forEach(el => revealObserver.observe(el));

// Hero role typing/deleting loop.
const roleEl = document.querySelector(".typing-role");
if (roleEl) {
  const roles = [
    "Front-End Web Developer",
    "UI & Database Developer",
    "Tech Freelancer",
    "CS-AI Apprentice",
    "Aspiring AI FullStack Strategist"
  ];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let roleIndex = 0, charIndex = 0, deleting = false;

  const typeRole = () => {
    const role = roles[roleIndex];
    roleEl.textContent = role.slice(0, charIndex);

    if (reducedMotion) {
      roleEl.textContent = role;
      return;
    }

    let delay = deleting ? 42 : 78;
    if (!deleting && charIndex < role.length) charIndex++;
    else if (deleting && charIndex > 0) charIndex--;
    else if (!deleting && charIndex === role.length) {
      deleting = true;
      delay = 1500;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 350;
    }
    setTimeout(typeRole, delay);
  };
  typeRole();
}

// Contact modal + Web3Forms submission (works on GitHub Pages).
const contactModal = document.querySelector('.contact-modal');
const openContactButtons = document.querySelectorAll('.ping-trigger');
const closeContactButtons = document.querySelectorAll('[data-close-contact]');
const contactForm = document.querySelector('.contact-form');
const contactStatus = document.querySelector('.contact-form-status');

const openContact = (e) => {
  if (e) e.preventDefault();
  if (!contactModal) return;
  contactModal.classList.add('is-open');
  contactModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('contact-locked');
  contactModal.querySelector('input[name="name"]')?.focus();
};
const closeContact = () => {
  if (!contactModal) return;
  contactModal.classList.remove('is-open');
  contactModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('contact-locked');
};
openContactButtons.forEach(btn => btn.addEventListener('click', openContact));
closeContactButtons.forEach(btn => btn.addEventListener('click', closeContact));

if (window.location.hash === '#contact-form') {
  requestAnimationFrame(() => openContact());
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && contactModal?.classList.contains('is-open')) closeContact();
});

contactForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const submit = contactForm.querySelector('button[type="submit"]');
  if (submit) { submit.disabled = true; submit.innerHTML = 'TRANSMITTING…'; }
  if (contactStatus) contactStatus.textContent = '';
  try {
    const accessKey = contactForm.querySelector('input[name="access_key"]')?.value?.trim();
    if (!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
      throw new Error('Missing Web3Forms access key');
    }
    const formData = new FormData(contactForm);
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Submission failed');
    contactForm.reset();
    if (contactStatus) contactStatus.textContent = 'Signal received. Thanks — I’ll get back to you.';
    if (submit) submit.innerHTML = 'MESSAGE SENT ✓';
  } catch (err) {
    if (contactStatus) contactStatus.textContent = err.message === 'Missing Web3Forms access key'
      ? 'Add your Web3Forms access key in index.html before publishing.'
      : 'Could not transmit right now. Please try again.';
    if (submit) { submit.disabled = false; submit.innerHTML = 'TRANSMIT MESSAGE <span>↗</span>'; }
  }
});
