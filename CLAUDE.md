# Toiduäpp – nädala toiduplaan

Ühelehe veebiäpp (eesti keeles), mis koostab tervisliku nädalamenüü ja ostunimekirja.
Kasutaja valib samm-sammult: pood → inimesed ja söögikorrad → hinnaklass → maitsed → menüü → ostunimekiri.

## Failid
- `toiduplaan.html` – kogu äpp: HTML, CSS ja JavaScript ühes failis, ilma raamistiketa.
- `img/d0.jpg … img/d68.jpg` – toidufotod (Unsplash, tasuta litsents), 360×360.
  Fotode järjekord vastab massiivi `R` järjekorrale (`r.img = "img/d"+i+".jpg"`).

- `manifest.json`, `sw.js`, `icons/`, `index.html` – iPhone'i avakuva-äpp (PWA). `sw.js` hoiab faile offline;
  kui äppi muudad, suurenda `sw.js` failis `VERSION` numbrit. Ikoonid joonistab `node tools/make-icons.js`.
- `.claude/launch.json` – kohalik eelvaade aadressil http://localhost:5173.
- Värvid: `--primary` tomatipunane, `--accent` lehtroheline (CSS-i `:root` plokis, hele ja tume teema).
- Menüü, ostetud tooted ja avatud samm salvestatakse `localStorage`-isse (`savePlan`/`restorePlan`).
  `S.have` = tooted, mis on kodus olemas (jäävad ostunimekirja summast välja); `S.quick` = tööpäevadel ainult ≤30 min toidud.
- Menüü koostamine (`pick`) eelistab toite, mis kasutavad sama nädala juba ostetud koostisosi (vähem raiskamist);
  `PANTRY` (õli, maitseained) seda boonust ei saa. Retseptiaknast saab toidu ise valida (`openChooser`).
- Retseptid `R[54…68]` on igapäevased kodutoidud (silt `kodu`, maitsevalik „Igapäevane kodutoit”).

## Andmed skriptis
- `ING` – koostisosad: ühik, toiteväärtus (100 g/ml või 1 tk kohta: kcal, valk, süsivesikud, rasv, kiudained),
  kategooria, müügiviis (`p` pakend, `pc` tükk, `kg` kaalukaup), pakendi suurus, hinnad `[soodne, keskmine, premium]`,
  nimi ja hinnangulise hinna lipp.
- Hinnad: plokk `PRICES` (failis `/*HINNAD*/ … /*HINNAD-LÕPP*/`) = iga poe pakendihinnad `[soodne, keskmine, premium]`.
  Päris hinnad on Rimist, Selverist ja Maximast (Barbora). Lidl ja Coop = Rimi hind × `STORES[].idx` (e-poodi pole).
  Prismat Eestis enam pole. Kui poel tootest hind puudub, kasutatakse Rimi hinda × poe hinnatase ja märgitakse `*`.
  `ING` hinnad on vaid viimane tagavara.

## Hindade uuendamine
1. `tools/price-specs.js` – iga koostisosa otsingusõna ja reeglid (peab sisaldama / ei tohi sisaldada).
2. `tools/collect-prices.js` – käivita brauseris poe lehel (rimi.ee, selver.ee, barbora.ee); poe lehed ei luba
   välist skripti laadida, seega kleebi kood otse. Rimi: lehe HTML-i lugemine; Selver: Vue ruuteriga otsing
   (`#app.__vue__.$router.push`); Barbora: otsingulahtrisse kirjutamine. Kontrolli tulemuste nimed üle – vale
   vaste (nt koeratoit) paranda reeglites.
3. Salvesta tulemus `tools/prices/<pood>.json` ja käivita `node tools/apply-prices.js`.
- `R` – retseptid: nimi, söögikord (`hommik`/`pea`), maitsesildid, aeg, koostisosad portsjoni kohta, valmistamise sammud.
  Retsepti nimi ja koostisosad peavad vastama täpselt fotole.
- Makrod ja maitsesildid (kana, kala jne) arvutatakse koostisosadest automaatselt.
- `S.persons` – iga inimese nimi ja päevane kalorieesmärk (0 = tavaline portsjon). Portsjoni kordaja
  `fac(r,k,p)` = eesmärk × `SHARE[söögikord]` / retsepti kcal, piiratud vahemikku 0,5–2,2.
  Hinnad, ostunimekiri ja retseptiakna kogused arvestavad kõigi inimeste portsjonite summat `pm(r,k)`.

## Reeglid
- Kõik kasutajale nähtav tekst on eesti keeles; kontrolli käänded (nt „kahele inimesele”).
- Ostunimekirja kogused ümardatakse poe pakendite järgi.
- Avalik äpp (GitHub Pages, iPhone'i avakuvale lisatav): https://riko-mihkelson.github.io/Toiduplaan/
  Uuendamiseks: suurenda `sw.js` failis `VERSION`, tee commit ja `git push` (hoidla github.com/Riko-Mihkelson/Toiduplaan,
  haru `main`). Giti autor on GitHubi noreply-aadress – ära kasuta isiklikku e-posti.
- Claude'i artefakt: https://claude.ai/artifact/KxzFdSBLNMh2dNABBt8Ra5
  (uuendamiseks avalda `toiduplaan.html` koos `img/` failidega sama URL-i peale).
