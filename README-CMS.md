# Content editor (Supabase) — Armin Shah

De website is gekoppeld aan Supabase. Via een beveiligd admin-paneel kun je
**alle teksten** en de **cases** aanpassen zonder de code aan te raken. De site
haalt wijzigingen live op; als Supabase onbereikbaar is, toont de site gewoon de
originele teksten (hij breekt dus nooit).

> Er is **geen** `npm install` of build-stap nodig. De Supabase-client wordt in
> de browser via een CDN geladen. De Next.js-instructies uit het Supabase-
> dashboard zijn hier niet van toepassing (dit is een statische site).

---

## 1. Database klaarzetten (éénmalig)

1. Open je Supabase-project → **SQL Editor** → **New query**.
2. Plak de volledige inhoud van [`supabase/schema.sql`](supabase/schema.sql).
3. Klik **Run**.

Dit maakt twee tabellen aan (`site_texts`, `cases`), zet de beveiliging (RLS)
goed en vult je 16 bestaande cases alvast in. Het script is veilig om opnieuw te
draaien.

## 2. Inlog-account aanmaken (éénmalig)

1. Supabase → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Vul een e-mail + wachtwoord in en zet **Auto Confirm User** aan.
3. Tip: zet onder **Authentication → Providers → Email** de optie
   *"Allow new users to sign up"* **uit**, zodat niemand zich zelf kan registreren.

## 3. De editor openen

De editor moet via de webserver draaien (niet als `file://`).

```
python3 serve.py
```

Open daarna **http://127.0.0.1:8001/admin/** en log in met het account uit stap 2.

Als de site live staat, is de editor bereikbaar op `https://jouw-domein.nl/admin/`.

---

## Wat kun je bewerken?

### Teksten (tabs Home / About / Case-detail / Footer)
- Per sectie zie je elk tekstveld met:
  - **Nu:** de huidige tekst op de site.
  - Een invoerveld met **"wat het moet worden"**.
  - Een **karakterteller** `huidig / max`. Het maximum is de lengte die het
    design nu toelaat — je kunt dus niet méér typen dan nu past.
- Wijzigingen worden **automatisch opgeslagen** (even wachten na het typen).
- **Herstel origineel** zet een veld terug naar de oorspronkelijke tekst.
- De **Footer** staat op elke pagina; pas je hem aan, dan verandert hij overal.
- *Case-detail* bevat de teksten die op élke case-pagina gelijk zijn (de drie
  blokken, het citaat en de labels). De titel/samenvatting/metadata **per** case
  beheer je onder **Cases**.

### Cases (tab Cases)
- Titel, merk, subtitel, tags, client, jaar, rol, services en samenvatting.
- **Op homepage** (highlighted) bepaalt of de case in de carousel op de homepage
  komt. **Live op site** bepaalt of hij überhaupt zichtbaar is.
- Volgorde aanpassen met ▲/▼. Nieuwe case toevoegen met **+ Nieuwe case**.
- **Media** (foto's/video's) blijven bestanden: zet ze in
  `assets/cases/<slug>/` — ze worden via de slug automatisch gekoppeld.

---

## Hoe het technisch werkt

```
cms/config.js     Supabase-URL + publishable key (mag publiek) + instellingen
cms/manifest.js   De tekstkaart: elke tekst -> key + sectie + selector
cms/shared.js     Lezen/toepassen van teksten (gedeeld door site + editor)
cms/loader.js     Haalt data op, past teksten + cases toe, start dan het pagina-script
admin/            De editor (login + tekst-editor + cases-CMS)
supabase/schema.sql  De database-structuur + seed
```

- De **originele** teksten blijven in de HTML staan en dienen als fallback.
  Supabase bevat alléén de wijzigingen (`site_texts.value`); een leeg veld =
  originele tekst.
- Een nieuw tekstveld toevoegen aan de editor? Voeg een regel toe in
  `cms/manifest.js` met een `key` en een CSS-`selector`. Meer niet.

## Beveiliging / sleutels

- `cms/config.js` bevat de **publishable key** — die hoort publiek te zijn, net
  als de oude anon key. Schrijven is afgeschermd via RLS (alleen na inloggen).
- De **secret key** (`sb_secret_…`) staat nergens in deze code en hoort dat ook
  nooit te doen. Bewaar hem privé.
