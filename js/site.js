document.querySelectorAll('a[href="/join/"]').forEach((link) => {
  if (link.textContent.trim() === 'Create profile') link.textContent = 'Draft profile';
});

const siteHeader = document.querySelector('.site-header');
if (siteHeader && !siteHeader.querySelector('.menu-button')) {
  const desktopNav = siteHeader.querySelector('.desktop-nav');
  if (desktopNav) {
    const generatedMobileNav = document.createElement('nav');
    generatedMobileNav.className = 'mobile-nav';
    generatedMobileNav.id = 'mobile-nav';
    generatedMobileNav.setAttribute('aria-label', 'Mobile');
    generatedMobileNav.hidden = true;
    generatedMobileNav.innerHTML = desktopNav.innerHTML;
    const desktopDraftLink = siteHeader.querySelector('.desktop-cta[href="/join/"]');
    if (desktopDraftLink && !generatedMobileNav.querySelector('a[href="/join/"]')) generatedMobileNav.append(desktopDraftLink.cloneNode(true));
    generatedMobileNav.querySelector('.desktop-cta')?.classList.remove('button', 'button-small', 'desktop-cta');
    const generatedMenuButton = document.createElement('button');
    generatedMenuButton.className = 'menu-button';
    generatedMenuButton.type = 'button';
    generatedMenuButton.setAttribute('aria-expanded', 'false');
    generatedMenuButton.setAttribute('aria-controls', 'mobile-nav');
    generatedMenuButton.innerHTML = '<span class="sr-only">Open menu</span><span></span><span></span>';
    siteHeader.querySelector('.nav-row').append(generatedMenuButton);
    siteHeader.append(generatedMobileNav);
  }
}

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

document.querySelectorAll('[data-track]').forEach((link) => link.addEventListener('click', () => {
  try { window.zaraz?.track(link.dataset.track); } catch { /* Analytics never blocks navigation. */ }
}));

const footer = document.querySelector('.site-footer');
if (footer) {
  const channels = [
    { name: 'Instagram', href: 'https://www.instagram.com/arctura.network/', icon: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.25"/><circle cx="17.4" cy="6.6" r="1" class="social-icon-fill"/>' },
    { name: 'X', href: 'https://x.com/ArcturaNetwork', icon: '<path d="M5 4l14 16M19 4L5 20"/>' },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/arctura-network/', icon: '<path d="M6 9v10M6 5.5v.1M10.5 19v-5.5c0-2.2 1.2-3.5 3.2-3.5s3.3 1.3 3.3 3.5V19M10.5 10v9"/>' },
    { name: 'GitHub', href: 'https://github.com/virtualmase/arctura.network', icon: '<path d="M9 19c-4.5 1.4-4.5-2.3-6.3-2.8M15 21v-3.5c0-1 .1-1.4-.5-2 3.1-.3 6.4-1.5 6.4-7A5.4 5.4 0 0019.5 5c.1-.4.6-1.9-.2-3.5 0 0-1.2-.4-3.7 1.4a12.7 12.7 0 00-6.7 0C6.4 1.1 5.2 1.5 5.2 1.5 4.4 3.1 4.9 4.6 5 5a5.4 5.4 0 00-1.4 3.7c0 5.4 3.3 6.6 6.4 7-.5.4-.6.9-.6 1.8V21"/>' },
    { name: 'Google', href: 'https://share.google/K0L9x8JHH3nojsPn9', icon: '<path d="M20 12.2c0-.7-.1-1.4-.2-2H12v3.6h4.5a4.2 4.2 0 01-1.8 2.7v2.4h3c1.7-1.6 2.3-3.9 2.3-6.7zM12 20c2.2 0 4.1-.7 5.6-2l-3-2.3c-.8.5-1.7.8-2.6.8a4.9 4.9 0 01-4.6-3.4H4.3v2.4A8 8 0 0012 20zM7.4 13.1a5.1 5.1 0 010-3.2V7.5H4.3a8 8 0 000 8l3.1-2.4zM12 7.5c1.3 0 2.5.5 3.4 1.3L18 6.2A8 8 0 004.3 7.5l3.1 2.4A4.9 4.9 0 0112 7.5z" class="social-icon-fill"/>' },
  ];
  let socialLinks = footer.querySelector('.social-links');
  if (!socialLinks) {
    socialLinks = document.createElement('nav');
    socialLinks.className = 'social-links footer-social-bottom';
    (footer.querySelector('.footer-brand') || footer.querySelector('.footer-bottom'))?.append(socialLinks);
  }
  socialLinks.setAttribute('aria-label', 'Official Arctura channels');
  socialLinks.innerHTML = channels.map(({ name, href, icon }) => `<a class="social-link" href="${href}" target="_blank" rel="me noopener" aria-label="Arctura Network on ${name}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icon}</svg><span>${name}</span></a>`).join('');
}
