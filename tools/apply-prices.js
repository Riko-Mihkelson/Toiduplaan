// Paneb kogutud hinnad (tools/prices/*.json) äppi.
// Käivita: node tools/apply-prices.js
// Iga poe ja koostisosa kohta arvutatakse pakendi hind [soodne, keskmine, premium] äpi pakendisuuruse järgi.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const htmlFile = path.join(root, "toiduplaan.html");
const { SPECS } = require("./price-specs.js");
let html = fs.readFileSync(htmlFile, "utf8");

// loe äpist koostisosade ühik, müügiviis ja pakendi suurus
const a = html.indexOf("const ING={"), b = html.indexOf("\n};", a);
const ING = {};
for (const m of html.slice(a, b).matchAll(/^ "([^"]+)":\["(g|ml|tk)",\[[^\]]*\],"\w","(p|pc|kg)",([\d.]+),/gm))
  ING[m[1]] = { u: m[2], kind: m[3], size: +m[4] };

function packPrice(name, U, u) {
  const ing = ING[name], g = SPECS[name] && SPECS[name][3];
  if (!ing) return null;
  if (ing.u === "g" || ing.u === "ml") {
    if (u === "kg" || u === "l") return U * ing.size / 1000;
    if (u === "tk" && g) return U * ing.size / g;
    return null;
  }
  // tükid (munad, tortillad, juurviljad tükikaupa)
  if (u === "tk") return U * ing.size;
  if ((u === "kg" || u === "l") && g) return U * g / 1000 * ing.size;
  return null;
}
const r2 = x => Math.round(x * 100) / 100;

const stores = {}; let date = "";
for (const f of fs.readdirSync(path.join(__dirname, "prices")).filter(f => f.endsWith(".json"))) {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, "prices", f), "utf8"));
  date = d.date > date ? d.date : date;
  const out = {};
  for (const [name, [u, s, k, p]] of Object.entries(d.prices)) {
    // mõistlikkuse kontroll: soodne ≤ keskmine ≤ premium, äärmused piiratud
    const K = Math.min(k, s * 3), P = Math.max(K, Math.min(p, s * 4));
    const v = [s, K, P].map(U => packPrice(name, U, u));
    if (v.every(x => x != null && isFinite(x) && x > 0)) out[name] = v.map(r2);
  }
  stores[d.store] = out;
  console.log(d.store, Object.keys(out).length, "koostisosa");
}

// poe hinnatase võrreldes Rimiga (keskmise hinnaklassi mediaanne suhe)
const idx = {};
for (const [s, data] of Object.entries(stores)) {
  const ratios = Object.keys(data).filter(n => stores.rimi && stores.rimi[n]).map(n => data[n][1] / stores.rimi[n][1]).sort((x, y) => x - y);
  idx[s] = ratios.length ? r2(ratios[Math.floor(ratios.length / 2)]) : 1;
  console.log(s, "hinnatase", idx[s]);
}

const block = "/*HINNAD*/const PRICES=" + JSON.stringify({ date, idx, stores }) + ";/*HINNAD-LÕPP*/";
const re = /\/\*HINNAD\*\/[\s\S]*?\/\*HINNAD-LÕPP\*\//;
if (re.test(html)) html = html.replace(re, block);
else html = html.replace("// ---------- Koostisosad ----------", block + "\n// ---------- Koostisosad ----------");
fs.writeFileSync(htmlFile, html);
console.log("Hinnad kirjutatud faili toiduplaan.html, kuupäev", date);
