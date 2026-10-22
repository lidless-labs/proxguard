# Architecture

## System overview

ProxGuard is a client-side Proxmox VE configuration auditor. You paste or drop config files into the browser, ProxGuard parses them, runs a fixed set of security rules, scores the results and keeps a history of past audits in localStorage. There is no backend and no network call in the audit path.

## Tech stack

- **React 19** with TypeScript, routed with **React Router 7**
- **Vite 7** for the dev server and build
- **Tailwind CSS 4** through `@tailwindcss/vite`, with a single theme (Analyst)
- **Zustand 5** with the `persist` middleware for audit history
- **Recharts** for the score trend and category radar charts
- **jsPDF** and **html2canvas** for PDF export, loaded on demand

## Audit flow

```
Config text (pasted, or dropped and detected by name or content)
    |
    v
useAuditStore.configInputs            src/store/auditStore.ts
    |
    v  runAudit()
parseAllConfigs(configInputs)         src/parsers/index.ts
    |   one parser per supplied file; unsupplied files stay undefined
    v
ParsedConfig
    |
    v
generateAuditReport(parsed, allRules) src/utils/scoring.ts
    |   returns null when every input is empty
    |   runs only the rules whose category has a supplied source
    v
AuditReport  ->  shown on the Audit page
    |
    v
serialized into history (newest first, last 50 kept) -> localStorage
```

### Inputs and parsers

`parseAllConfigs` in `src/parsers/index.ts` takes a record keyed by the six config file types and calls one parser per non-empty input:

| Input | Parser | Feeds |
|-------|--------|-------|
| `sshd_config` | `src/parsers/sshd.ts` | `ssh` |
| `user.cfg` | `src/parsers/userCfg.ts` | `auth`, and `api` (tokens and their ACLs are derived from `user.cfg`) |
| `cluster.fw` | `src/parsers/clusterFw.ts` | `firewall` |
| `iptables` | `src/parsers/iptables.ts` (`iptables-save` or `iptables -L -n` output) | `iptables` |
| `lxc.conf` | `src/parsers/lxc.ts` (one or more container configs) | `containers` |
| `storage.cfg` | `src/parsers/storage.ts` | `storage` |

The raw text of every input is kept on `ParsedConfig.raw` so scoring can tell which files were supplied.

### Rules

`allRules` in `src/rules/index.ts` concatenates the per-category rule lists. There are 16 rules in 6 categories:

| Category | File | Rules |
|----------|------|-------|
| `ssh` | `src/rules/ssh.ts` | 4 |
| `auth` | `src/rules/auth.ts` | 3 |
| `firewall` | `src/rules/firewall.ts` | 3 |
| `container` | `src/rules/container.ts` | 2 |
| `storage` | `src/rules/storage.ts` | 2 |
| `api` | `src/rules/api.ts` | 2 |

Each rule is a `SecurityRule` (`src/types/index.ts`) with an id, category, severity, title, description, remediation text, a remediation script, a benchmark reference and a `test(parsed)` function that returns `{ passed, evidence }`.

### Scoring

`src/utils/scoring.ts` maps supplied files to categories (`sshd_config` to ssh, `user.cfg` to auth and api, `cluster.fw` or `iptables` to firewall, `lxc.conf` to container, `storage.cfg` to storage). Only those categories are evaluated and scored.

- Each scored category starts at 100 and loses 40, 25, 10 or 5 points per failed critical, high, medium or info rule, with a floor of 0.
- The overall score is the average of the scored categories weighted by `CATEGORY_WEIGHTS`: ssh 25, firewall 25, auth 20, container 15, storage 10, api 5.
- Grades: A at 90 or more, B at 80, C at 70, D at 60, F below 60.

## State management

`useAuditStore` (`src/store/auditStore.ts`) holds:

| Field | Purpose | Persisted |
|-------|---------|-----------|
| `configInputs` | Text currently in each input tab | No |
| `lastConfigInputs` | Inputs from the last successful audit | Yes |
| `parsedConfig` | Output of `parseAllConfigs` | No |
| `auditReport` | Current `AuditReport` | No |
| `history` | Serialized past reports, newest first, capped at 50 | Yes |
| `isAuditing` | Loading flag while the audit runs | No |
| `comparisonPair` | Timestamps of the two reports being compared | Yes |

Actions: `setConfigInput`, `runAudit`, `loadSample`, `loadLastConfig`, `clearResults`, `clearHistory`, `deleteHistoryEntry`, `setComparisonPair`, `clearComparison`.

History entries store each rule's metadata without its `test` function. `hydrateStoredReport` reattaches the current rule by id, or a placeholder rule when the id no longer exists. Older summary-only entries are still accepted but cannot be compared.

## Pages and routes

Routes are declared in `src/App.tsx`:

| Path | Component | What it shows |
|------|-----------|---------------|
| `/` | `DashboardPage` | Last audit, score trend, demo config shortcuts |
| `/audit` | `AuditPage` | Config input with file drop, results, remediation script, PDF export |
| `/history` | `HistoryPage` | Past audits; delete entries or select two to compare |
| `/compare` | `ComparisonPage` | Category score deltas and findings that changed between two audits |
| `/compliance` | `CompliancePage` | Pass/fail for each benchmark-mapped check in the current audit |

`src/App.tsx` also holds the header, navigation and a transparency modal that lists the checked files and rule counts by category and severity, computed from `allRules`.

## Demo data

`src/data/` holds three sample input sets (`insecure`, `partial`, `hardened`) loaded through `getSample` and `loadSample`. With the current rules they score 38 (F), 74 (C) and 100 (A).

## Theme

`src/variants/themes.ts` defines one theme, Analyst (light background, blue accents). `src/variants/ThemeProvider.tsx` applies its CSS custom properties to the document root and exposes it through `useTheme`. There is no theme switcher.
