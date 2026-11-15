#!/usr/bin/env bash
#
# Turns the film rolls in .resources/photos/ into web-ready images for the site.
# The originals are only read, never modified.
#
# Usage:
#   scripts/process-photos.sh [input-dir] [output-dir]
#   (defaults: .resources/photos app/media/photos)
#
# Every folder in <input-dir> is one roll, named "<YYYY.MM> - <film> <ISO>",
# e.g. "2026.06 - Kodak Gold 200". The site reads the date, film and ISO from
# that name. Folders with any other name are skipped with a warning.
#
# For every photo this writes to <output-dir>/<roll folder>/:
#   <name>-800.webp   for the photo wall tiles
#   <name>-2048.webp  for the lightbox
#
# Environment variables (defaults in brackets):
#   WIDTHS   Output sizes, longest side in px ["800 2048"]
#   QUALITY  WebP quality, 0-100 [80]
#
# Uses scripts/optimize-images.sh, so it needs ImageMagick 7 as well.

set -euo pipefail

input_dir=${1:-.resources/photos}
output_dir=${2:-app/media/photos}
optimize="$(dirname "$0")/optimize-images.sh"

[[ -d "$input_dir" ]] || {
  echo "Input directory not found: $input_dir" >&2
  exit 1
}

for roll in "$input_dir"/*/; do
  roll=$(basename "$roll")
  if [[ ! "$roll" =~ ^[0-9]{4}\.[0-9]{2}\ -\ .+\ [0-9]+$ ]]; then
    echo "Skipping \"$roll\": expected \"YYYY.MM - Film name ISO\"" >&2
    continue
  fi
  echo "== $roll"
  WIDTHS=${WIDTHS:-800 2048} QUALITY=${QUALITY:-80} LQIP_WIDTH=0 \
    "$optimize" "$input_dir/$roll" "$output_dir/$roll"
done
