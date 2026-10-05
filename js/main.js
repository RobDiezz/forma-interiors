'use strict';

const header = document.querySelector('.header');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');

// Mobile navigation / State, focus and keyboard control
function setMenu(open, restoreFocus = false) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  navigation.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  if (restoreFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
document.querySelector('.brand').addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (event) => {
  if (menuButton.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') setMenu(false, true);
  if (event.key === 'Tab') {
    const items = [document.querySelector('.brand'), ...navigation.querySelectorAll('button, a'), menuButton];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
  if (event.matches) setMenu(false);
});
// Header scroll behaviour
function updateHeader() { header.classList.toggle('is-scrolled', window.scrollY > 12); }
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

// Anchor navigation / Native hash changes with destination focus
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', () => {
    setMenu(false);
    const target = document.querySelector(link.getAttribute('href'));
    if (target && target.id !== 'main' && target.id !== 'top') target.focus({ preventScroll: true });
    else if (target) document.querySelector('.header .brand').focus({ preventScroll: true });
  });
});

// Project reveals / Content remains visible without enhancement
const projectReveals = document.querySelectorAll('[data-project-reveal]');
const projectMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !projectMotion.matches) {
  const projectObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('project-reveal-pending');
        projectObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  projectReveals.forEach((element) => {
    element.classList.add('project-reveal-pending');
    projectObserver.observe(element);
  });
  // Reduced motion changes also reveal any pending content.
  projectMotion.addEventListener('change', (event) => {
    if (event.matches) {
      projectObserver.disconnect();
      projectReveals.forEach((element) => element.classList.remove('project-reveal-pending'));
    }
  });
}

// FAQ accordion / One open answer; native buttons support Enter and Space
const faqList = document.querySelector('.faq-list');
const faqButtons = [...faqList.querySelectorAll('.faq-question')];
function setFaq(button, open) {
  const answer = document.getElementById(button.getAttribute('aria-controls'));
  button.setAttribute('aria-expanded', String(open));
  answer.classList.toggle('is-closed', !open);
  // Closed answers leave the accessibility tree immediately, including in motion.
  answer.inert = !open;
  answer.setAttribute('aria-hidden', String(!open));
}
faqButtons.forEach((button, index) => {
  setFaq(button, index === 0);
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    faqButtons.forEach((item) => setFaq(item, item === button && open));
  });
});
faqList.classList.add('faq-ready');

// Demo form validation
// Demo form only.
// Connect a backend or external form service for real submissions.
const inquiryForm = document.querySelector('#inquiry-form');
const inquiryStatus = document.querySelector('#inquiry-status');
const formFields = [
  { input: document.querySelector('#client-name'), error: document.querySelector('#name-error'), message: 'Укажите ваше имя.' },
  { input: document.querySelector('#client-contact'), error: document.querySelector('#contact-error'), message: 'Укажите телефон или Telegram.' },
  { input: document.querySelector('#object-area'), error: document.querySelector('#area-error'), message: 'Укажите площадь числом больше нуля.' },
  { input: document.querySelector('#data-consent'), error: document.querySelector('#consent-error'), message: 'Подтвердите согласие, чтобы проверить форму.' }
];
// Optional area must be positive; required fields expose linked errors.
function validateField(field) {
  const input = field.input;
  const invalid = input.type === 'checkbox' ? !input.checked
    : input.type === 'number' ? input.validity.badInput || (input.value !== '' && Number(input.value) <= 0)
    : !input.value.trim();
  input.setAttribute('aria-invalid', String(invalid));
  field.error.textContent = invalid ? field.message : '';
  field.error.hidden = !invalid;
  return !invalid;
}
inquiryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  inquiryStatus.textContent = '';
  const invalidFields = formFields.filter(field => !validateField(field));
  if (invalidFields.length) {
    invalidFields[0].input.focus();
    return;
  }
  // Demo success state / Reset locally without sending or storing data.
  inquiryForm.reset();
  formFields.forEach(field => {
    field.input.removeAttribute('aria-invalid');
    field.error.textContent = '';
    field.error.hidden = true;
  });
  inquiryStatus.textContent = 'Форма заполнена. В демонстрационной версии данные не отправляются.';
});
// Recheck an invalid field as the user edits it.
inquiryForm.addEventListener('input', (event) => {
  inquiryStatus.textContent = '';
  const field = formFields.find(item => item.input === event.target);
  if (field && field.input.getAttribute('aria-invalid') === 'true') validateField(field);
});
// Disabled in HTML until the submit guard exists; never submits without JavaScript.
inquiryForm.querySelector('[type="submit"]').disabled = false;
