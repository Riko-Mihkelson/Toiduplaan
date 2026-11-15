# Toiduäpp – nädala toiduplaan

Ühelehe veebiäpp (eesti keeles), mis koostab tervisliku nädalamenüü ja ostunimekirja.
Kasutaja valib samm-sammult: pood → inimesed ja söögikorrad → hinnaklass → maitsed → menüü → ostunimekiri.

## Failid
- `toiduplaan.html` – kogu äpp: HTML, CSS ja JavaScript ühes failis, ilma raamistiketa.
- `img/d0.jpg … img/d53.jpg` – toidufotod (Unsplash, tasuta litsents), 360×360.
  Fotode järjekord vastab massiivi `R` järjekorrale (`r.img = "img/d"+i+".jpg"`).

- `manifest.json`, `sw.js`, `icons/`, `index.html` – iPhone'i avakuva-äpp (PWA). `sw.js` hoiab faile offline;
  kui äppi muudad, suurenda `sw.js` failis `VERSION` numbrit. Ikoonid joonistab `node tools/make-icons.js`.
- `.claude/launch.json` – kohalik eelvaade aadressil http://localhost:5173.
- Värvid: `--primary` tomatipunane, `--accent` lehtroheline (CSS-i `:root` plokis, hele ja tume teema).
- Menüü, ostetud tooted ja avatud samm salvestatakse `localStorage`-isse (`savePlan`/`restorePlan`).

## Andmed skriptis
- `ING` – koostisosad: ühik, toiteväärtus (100 g/ml või 1 tk kohta: kcal, valk, süsivesikud, rasv, kiudained),
  kategooria, müügiviis (`p` pakend, `pc` tükk, `kg` kaalukaup), pakendi suurus, hinnad `[soodne, keskmine, premium]`,
  nimi ja hinnangulise hinna lipp.
- Hinnad on Rimi e-poest (`PRICE_DATE`). Teiste poodide hinnad = Rimi hind × `STORES[].idx` (hinnang).
- `R` – retseptid: nimi, söögikord (`hommik`/`pea`), maitsesildid, aeg, koostisosad portsjoni kohta, valmistamise sammud.
  Retsepti nimi ja koostisosad peavad vastama täpselt fotole.
- Makrod ja maitsesildid (kana, kala jne) arvutatakse koostisosadest automaatselt.
- `S.persons` – iga inimese nimi ja päevane kalorieesmärk (0 = tavaline portsjon). Portsjoni kordaja
  `fac(r,k,p)` = eesmärk × `SHARE[söögikord]` / retsepti kcal, piiratud vahemikku 0,5–2,2.
  Hinnad, ostunimekiri ja retseptiakna kogused arvestavad kõigi inimeste portsjonite summat `pm(r,k)`.

## Reeglid
- Kõik kasutajale nähtav tekst on eesti keeles; kontrolli käänded (nt „kahele inimesele”).
- Ostunimekirja kogused ümardatakse poe pakendite järgi.
- Avaldatud versioon: https://claude.ai/artifact/KxzFdSBLNMh2dNABBt8Ra5
  (uuendamiseks avalda `toiduplaan.html` koos `img/` failidega sama URL-i peale).
