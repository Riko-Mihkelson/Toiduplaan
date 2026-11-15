// Kogub hinnad poe e-poe otsingust. Käivitatakse brauseris poe enda lehel (rimi.ee, selver.ee või barbora.ee)
// koos tools/price-specs.js sisuga. Tulemus: window.__OUT = { koostisosa: [{n: nimi, U: ühikuhind, u: "kg"|"l"|"tk"}] }
(function () {
  const host = location.hostname;
  const unitRe = /([\d]+[,.]\d+)\s*€\s*\/\s*(kg|l|tk)\b/i;
  const parseU = t => { const m = (t || "").replace(/\s+/g, " ").match(unitRe); return m ? { U: +m[1].replace(",", "."), u: m[2].toLowerCase() } : null; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Rimi: otsingutulemused tulevad kohe HTML-is
  async function rimi(q) {
    const h = await (await fetch("/epood/ee/otsing?query=" + encodeURIComponent(q))).text();
    const d = new DOMParser().parseFromString(h, "text/html");
    return [...d.querySelectorAll(".js-product-container")].slice(0, 14).map(c => {
      const p = parseU((c.querySelector(".card__price-per") || {}).textContent);
      return p && { n: ((c.querySelector(".card__name") || {}).textContent || "").trim(), ...p };
    }).filter(Boolean);
  }

  // Selver ja Barbora: leht joonistatakse brauseris, seega laeme otsingu peidetud iframe'i
  async function viaFrame(url, extract) {
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;left:-9999px;top:0;width:1200px;height:2000px";
    f.src = url; document.body.appendChild(f);
    let res = [];
    for (let i = 0; i < 24; i++) {
      await sleep(500);
      try { res = extract(f.contentDocument); } catch (e) { }
      if (res.length) { await sleep(700); try { res = extract(f.contentDocument); } catch (e) { } break; }
    }
    f.remove(); return res.slice(0, 14);
  }
  const selver = q => viaFrame("/search?q=" + encodeURIComponent(q), doc =>
    [...doc.querySelectorAll(".ProductCard")].map(c => {
      const us = [...c.querySelectorAll(".ProductPrice__unit-price")].map(e => parseU(e.textContent)).filter(Boolean);
      const n = ((c.querySelector(".ProductCard__link") || {}).textContent || "").trim();
      return us.length && n && { n, ...us[us.length - 1] };
    }).filter(Boolean));
  const barbora = q => viaFrame("/otsing?q=" + encodeURIComponent(q), doc => {
    const seen = new Set(), out = [];
    for (const a of doc.querySelectorAll('a[href^="/p/"]')) {
      const href = a.getAttribute("href"), name = a.textContent.trim();
      if (!name || seen.has(href)) continue;
      let el = a;
      for (let i = 0; i < 8 && el; i++) {
        el = el.parentElement;
        if (!el) break;
        if (new Set([...el.querySelectorAll('a[href^="/p/"]')].map(x => x.getAttribute("href"))).size > 1) break;
        const all = [...el.textContent.matchAll(/([\d]+[,.]\d+)\s*€\s*\/\s*(kg|l|tk)\b/gi)];
        if (all.length) { const m = all[all.length - 1]; seen.add(href); out.push({ n: name, U: +m[1].replace(",", "."), u: m[2].toLowerCase() }); break; }
      }
    }
    return out;
  });

  const search = /rimi/.test(host) ? rimi : /selver/.test(host) ? selver : /barbora/.test(host) ? barbora : null;
  window.__OUT = {}; window.__DONE = 0;
  const names = Object.keys(SPECS), conc = /rimi/.test(host) ? 6 : 3;
  let idx = 0;
  async function worker() {
    while (idx < names.length) {
      const k = names[idx++];
      try { window.__OUT[k] = await search(SPECS[k][0]); } catch (e) { window.__OUT[k] = []; }
      window.__DONE++;
    }
  }
  window.__RUN = Promise.all(Array.from({ length: conc }, worker));
})();

// Kokkuvõte: filtreerib reeglite järgi ja annab soodsa (min), keskmise (mediaan) ja premium (80. protsentiil) ühikuhinna
window.__SUM = function () {
  const r = {};
  for (const [k, [q, inc, exc]] of Object.entries(SPECS)) {
    const I = new RegExp(inc, "i"), E = new RegExp(exc, "i");
    const m = (window.__OUT[k] || []).filter(x => I.test(x.n) && !E.test(x.n));
    if (!m.length) { r[k] = null; continue; }
    const byU = {}; m.forEach(x => (byU[x.u] = byU[x.u] || []).push(x));
    const best = Object.values(byU).sort((a, b) => b.length - a.length)[0].sort((a, b) => a.U - b.U);
    const pick = f => best[Math.min(best.length - 1, Math.floor(f * (best.length - 1) + 0.5))];
    r[k] = { u: best[0].u, s: best[0].U, k: pick(.5).U, p: Math.min(pick(.8).U, best[0].U * 2.5), n: best.length, ns: best[0].n.slice(0, 40), nk: pick(.5).n.slice(0, 40) };
  }
  return r;
};
