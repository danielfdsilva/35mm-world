# 35mm World

35mm film photography, shot on my father's Yashica FX-3 Super 2000 after being forgotten in a closet for years. Every frame is real film.

## Installation and Usage

The steps below will walk you through setting up your own instance of the project.

### Install Project Dependencies

To set up the development environment for this website, you'll need to install the following on your system:

- [Node](http://nodejs.org/) (see version in [.nvmrc](.nvmrc)) (To manage multiple node versions we recommend [nvm](https://github.com/creationix/nvm))

### Install Application Dependencies

If you use [`nvm`](https://github.com/creationix/nvm), activate the desired Node version:

```sh
nvm install
```

Install Node modules:

```sh
npm install
```

## Usage

### Environment Configuration

The application uses [dot.env](https://vite.dev/guide/env-and-mode#env-files) files with environment variables for configuration. A template file `.env.example` is provided as a template.

To configure the application:
1. Copy `.env.example` to `.env`
2. Modify the `.env` file with your specific configuration values
3. Never modify `.env.example` directly as it serves as documentation

### Starting the app

```sh
npm run dev
```

Compiles the site, and launches the server making the site available at `http://localhost:9000/`

### Images

Source images are large, so they are not tracked. `scripts/optimize-images.sh` turns them into web-ready WebP files:

- `<name>-750.webp` for normal screens and `<name>-1500.webp` for retina (2x) screens.
- `<name>-lqip.webp`, a 96px wide placeholder. It is small enough for Vite to inline in the bundle, so it shows instantly while the full image loads on slow networks.

Regenerate the camera frames after changing `.resources/alpha`:

```sh
npm run images:camera
```

This crops every frame to the shared bounding box of their visible pixels (`--trim`), so the frames lose their empty margins but stay aligned. The page picks the smallest size that covers the camera at the current screen size and pixel density, loads the first frame first, then the rest in order.

Process the photos after adding a roll to `.resources/photos/`:

```sh
npm run images:photos
```

Each folder in `.resources/photos/` is one roll, named `<YYYY.MM> - <film> <ISO>` (for example `2026.06 - Kodak Gold 200`). The site reads the date, film and ISO from that name. Every photo gets a `<name>-800.webp` for the photo wall and a `<name>-2048.webp` for the lightbox, in `app/media/photos/<roll>/`. Folders with any other name are skipped.

Run the script directly for other images or settings:

```sh
scripts/optimize-images.sh [--trim] <input-dir> <output-dir>
WIDTHS="640 1280 1920" QUALITY=80 scripts/optimize-images.sh in/ out/
```

See the header of the script for every option. It requires ImageMagick 7 with WebP support (`brew install imagemagick`).

## Deployment

To prepare the app for deployment run:

```sh
npm run build
```

or

```sh
npm run stage
```

This will package the app and place all the contents in the `dist` directory.
The app can then be run by any web server.

**When building the site for deployment provide the base url trough the `VITE_BASE_URL` environment variable. Omit the leading slash. (E.g. <https://example.com>)**
