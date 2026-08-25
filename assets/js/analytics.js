// Cloudflare Web Analytics bootstrap.
// Keep analytics isolated from site functionality so it can be removed safely.
(function () {
  if (document.querySelector('script[data-kagami-analytics="cloudflare"]')) return;

  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = JSON.stringify({
    token: 'f0f0a2e692db4af7ba8719ba940f38aa'
  });
  script.dataset.kagamiAnalytics = 'cloudflare';
  document.head.appendChild(script);
})();
