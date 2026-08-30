const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('#mobile-nav');

if (menuButton && mobileNav) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menuButton.querySelector('.sr-only').textContent = open ? 'Open menu' : 'Close menu';
    mobileNav.hidden = open;
  });
  mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.querySelector('.sr-only').textContent = 'Open menu';
    mobileNav.hidden = true;
  }));
}

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
