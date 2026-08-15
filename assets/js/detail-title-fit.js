const DETAIL_TITLE_SELECTORS = [
  '.work-title',
  '.character-092-name',
  '.song-title',
  '#glossary-name'
];

function fitDetailTitle(el) {
  const box = el.parentElement;
  if (!box) return;

  el.style.transform = 'none';
  el.style.width = 'auto';
  el.style.whiteSpace = 'nowrap';
  el.style.transformOrigin = 'left center';

  const probe = el.cloneNode(true);
  probe.dataset.detailTitleProbe = '1';
  probe.style.cssText = 'position:absolute;left:-100000px;top:0;visibility:hidden;display:block;margin:0;width:max-content;max-width:none;white-space:nowrap;transform:none';
  document.body.appendChild(probe);
  const natural = probe.getBoundingClientRect().width;
  probe.remove();

  const available = box.clientWidth;
  if (!available || !natural) return;
  if (natural <= available) return;

  const scale = available / natural;
  if (scale >= 0.5) {
    el.style.width = `${available / scale}px`;
    el.style.whiteSpace = 'nowrap';
    el.style.transform = `scaleX(${scale})`;
  } else {
    el.style.width = '100%';
    el.style.whiteSpace = 'normal';
    el.style.transform = 'none';
  }
}

function fitDetailTitles(root = document) {
  DETAIL_TITLE_SELECTORS.forEach(selector =>
    root.querySelectorAll(selector).forEach(fitDetailTitle)
  );
}

function initDetailTitleFit() {
  if (window.__detailTitleFitInitialized) return;
  window.__detailTitleFitInitialized = true;

  fitDetailTitles();

  const observer = new MutationObserver(records => {
    const relevant = records.some(record =>
      [...record.addedNodes, ...record.removedNodes].some(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        if (node.dataset?.detailTitleProbe === '1') return false;
        return DETAIL_TITLE_SELECTORS.some(selector =>
          node.matches?.(selector) || node.querySelector?.(selector)
        );
      })
    );
    if (relevant) fitDetailTitles();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const parents = [
    ...new Set(
      DETAIL_TITLE_SELECTORS.flatMap(selector =>
        [...document.querySelectorAll(selector)]
          .map(el => el.parentElement)
          .filter(Boolean)
      )
    )
  ];

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => fitDetailTitles());
    parents.forEach(parent => resizeObserver.observe(parent));
  }
}

document.addEventListener('DOMContentLoaded', initDetailTitleFit, { once: true });
window.addEventListener('orientationchange', () => setTimeout(fitDetailTitles, 150));
