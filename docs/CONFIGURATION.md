# Configuration

ProxGuard has no runtime configuration. Nothing in `src/` or `vite.config.ts` reads environment variables, so a `.env` file has no effect.

## Running the application

### Development

```bash
npm install
npm run dev
```

`vite.config.ts` does not set a port, so the dev server listens on Vite's default, `http://localhost:5173`. If that port is busy Vite picks the next free one and prints it. To choose a port yourself, pass it through: `npm run dev -- --port 8080`.

### Production build

```bash
npm run build
npm run preview
```

`npm run build` type-checks and writes a static site to `dist/`. `vercel.json` rewrites every path to `index.html` so client-side routes such as `/audit` and `/history` load directly.

## Data storage

ProxGuard keeps its state in browser localStorage under one key, written by the Zustand `persist` middleware in `src/store/auditStore.ts`:

| Key | Contents |
|-----|----------|
| `proxguard-storage` | `{ state: { history, comparisonPair, lastConfigInputs }, version: 2 }` |

- `history`: up to 50 serialized audit reports, newest first. Each holds the timestamp, overall score and grade, category scores, findings with rule metadata, and the list of input files that were supplied.
- `comparisonPair`: timestamps of the two reports open on the Compare page, or `null`.
- `lastConfigInputs`: the config text from the last successful audit, including `tfa.json` and `pveproxy`, used by **Load Last Config** on the Dashboard. Older saved input sets keep their existing values and gain empty fields for missing input types when restored.

The text you paste into the input tabs is not persisted until an audit runs. Clearing history on the History page empties `history` and `comparisonPair` but keeps `lastConfigInputs`. Clearing site data in the browser removes the key entirely.

## Theme

There is one theme, Analyst, defined in `src/variants/themes.ts`. There is no theme setting or theme query parameter.
