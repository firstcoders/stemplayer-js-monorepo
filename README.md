# @firstcoders/stemplayer-js-monorepo [![Test](https://github.com/firstcoders/webcomponents/actions/workflows/test.yml/badge.svg)](https://github.com/firstcoders/webcomponents/actions/workflows/test.yml)

A [Lerna](https://lerna.js.org/) / Yarn workspaces monorepo containing the web components and supporting packages that make up [stemplayer-js](https://stemplayer-js.com) — a streaming, low-latency stem player built on the Web Audio API.

---

## Repository structure

```
elements/   – LitElement web components (independently versioned and published)
packages/   – Plain JS packages consumed by the elements
```

### Elements

| Package                                                                      | Element tag(s)                                                                                     | Description                                                                                   |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`elements/stemplayer-js`](elements/stemplayer-js/README.md)                 | `<stemplayer-js>`, `<stemplayer-js-controls>`, `<stemplayer-js-stem>`, `<stemplayer-js-workspace>` | Full stem player — orchestrates playback, per-track waveforms, controls, and region selection |
| [`elements/waveform-element`](elements/waveform-element/README.md)           | `<soundws-waveform>` (alias `<fc-waveform>`)                                                       | Renders an audio waveform from BBC-audiowaveform-compatible JSON peak data                    |
| [`elements/loader-element`](elements/loader-element/README.md)               | `<soundws-loader>`                                                                                 | Spinner/loading indicator                                                                     |
| [`elements/mask-element`](elements/mask-element/README.md)                   | `<soundws-mask>`                                                                                   | Overlay mask used to dim or block interactions                                                |
| [`elements/player-button-element`](elements/player-button-element/README.md) | `<soundws-player-button>`                                                                          | Play/pause button with SVG icon                                                               |
| [`elements/range-element`](elements/range-element/README.md)                 | `<soundws-range>`                                                                                  | Styled `<input type="range">` slider                                                          |
| [`elements/slider-element`](elements/slider-element/README.md)               | `<soundws-slider>`                                                                                 | Composite slider (range + value display)                                                      |
| [`elements/element-styles`](elements/element-styles/README.md)               | —                                                                                                  | Shared Lit CSS template literals reused across elements                                       |

### Packages

| Package                                                      | Description                                                                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| [`packages/hls-web-audio`](packages/hls-web-audio/README.md) | Plays multiple streamed audio tracks in sync via the Web Audio API; supports HLS (`.m3u8`) and standard audio formats |

---

## High-level workflow

### Prerequisites

```bash
yarn install   # installs all workspace dependencies and runs postinstall (Playwright + Husky)
```

### Developing

Each element has its own dev server. From the element directory:

```bash
yarn start     # starts web-dev-server with live reload
```

Or run the stemplayer-js demo directly (delegates to `make start-stem-component`).

### Linting and formatting

```bash
# from repo root — runs across all packages
yarn lint

# from an individual package
yarn lint      # eslint + prettier --check
yarn format    # eslint --fix + prettier --write
```

### Testing

```bash
# all packages, sequentially
yarn test

# single package
cd elements/stemplayer-js
yarn test            # run once
yarn test:watch      # watch mode
```

Tests use [`@web/test-runner`](https://modern-web.dev/docs/test-runner/overview/) with Chromium (via Playwright) and [`@open-wc/testing`](https://open-wc.org/docs/testing/testing-package/) for assertions and accessibility checks.

### Versioning and publishing

Versions are managed by Lerna with [Conventional Commits](https://www.conventionalcommits.org/):

```bash
lerna version   # bumps versions, generates CHANGELOGs, creates Git tags
lerna publish   # publishes changed packages to the GitHub npm registry
```

Commit messages must follow the Conventional Commits format — the pre-commit hook enforces this via commitlint. Packages are versioned independently; a change to one element does not force a version bump in others.

### CI

The GitHub Actions workflow (`.github/workflows/test.yml`) runs `yarn test` across all packages on every push and pull request.
