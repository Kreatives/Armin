/* =========================================================
   Gedeelde CMS-helpers (klassiek script, geen module).
   Gebruikt door de runtime-loader én de editor, zodat lezen en
   toepassen van teksten altijd exact gelijk werken.
   ========================================================= */
window.CMS = window.CMS || {};

(function (CMS) {
  const textNodes = (el) => Array.from(el.childNodes).filter((n) => n.nodeType === 3);

  // Lees de huidige ("originele") tekst van een element volgens de modus.
  CMS.readField = function (el, mode) {
    if (!el) return '';
    switch (mode) {
      case 'placeholder': return el.getAttribute('placeholder') || '';
      case 'html':        return el.innerHTML.replace(/\s+/g, ' ').trim();
      case 'firstText':   { const n = textNodes(el)[0]; return n ? n.nodeValue.trim() : ''; }
      case 'lastText':    { const ns = textNodes(el); const n = ns[ns.length - 1]; return n ? n.nodeValue.trim() : ''; }
      default:            return (el.textContent || '').replace(/\s+/g, ' ').trim();
    }
  };

  // Pas een nieuwe tekst toe op een element volgens de modus.
  CMS.applyField = function (el, value, mode) {
    if (!el) return;
    switch (mode) {
      case 'placeholder': el.setAttribute('placeholder', value); break;
      case 'html':        el.innerHTML = value; break;
      case 'firstText': {
        const n = textNodes(el)[0];
        if (n) n.nodeValue = value;
        else el.insertBefore(document.createTextNode(value), el.firstChild);
        break;
      }
      case 'lastText': {
        const ns = textNodes(el);
        const n = ns[ns.length - 1];
        if (n) { const lead = /^\s/.test(n.nodeValue) ? ' ' : ''; n.nodeValue = lead + value; }
        else el.appendChild(document.createTextNode(' ' + value));
        break;
      }
      default: el.textContent = value;
    }
  };
})(window.CMS);
