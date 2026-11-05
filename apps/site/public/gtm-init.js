// Google Tag Manager, only on the live site: local previews and automated tests must not
// count as visits. Loaded from a file because the CSP allows no inline script.
if (location.hostname === 'niftyfix.in') {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-NVRZF3S6';
  document.head.append(script);
}
