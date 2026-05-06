# Bolt Length Expert

A rewritten bolt-length calculator based on the original project rules.

## Calculation rules included

- Bolt data by diameter `M12` to `M30`
- Type-specific added length:
  - `S10T (Torsia)`: uses `addLengthTC` (except `M12`, unavailable)
  - `F10T (Hex)`: uses `addLengthHex`
- Theoretical length = `P1 + P2 + P3 + addLength`
- Selected length rounding:
  - `M12-M24` (5 mm step): last digit `0-2 => down`, `3-7 => +5`, `8-9 => +10`
  - `M27-M30` (10 mm step): nearest `10 mm`
- Surplus length = `selected - grip - washerHeight - nutHeight`
- Thread crests = `surplus / pitch`

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

This repo includes `.github/workflows/deploy-pages.yml`.

1. Push this project to your GitHub repository.
2. In GitHub, go to `Settings -> Pages`.
3. Set `Build and deployment` source to `GitHub Actions`.
4. Push to `main` branch again (or re-run the workflow).
5. Your site will be published to GitHub Pages automatically.