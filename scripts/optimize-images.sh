#!/usr/bin/env bash
#
# Resize and compress source images into web-ready WebP files.
# The source images are only read, never modified.
#
# Usage:
#   scripts/optimize-images.sh [--trim] <input-dir> <output-dir>
#
# For every image in <input-dir> (png, jpg, jpeg, tif, tiff, webp) this writes
# to <output-dir>:
#   <name>-<width>.webp  one file per width in WIDTHS (never upscaled)
#   <name>-lqip.webp     a tiny low quality placeholder, shown while the
#                        full image loads (skipped when LQIP_WIDTH is 0)
#
# Images are turned upright from their EXIF orientation first.
#
# Options:
#   --trim  Crop every image to the bounding box of the non-transparent
#           pixels of ALL inputs together. Use it for image sequences (like
#           the camera frames) so the empty margins go away but the frames
#           stay aligned with each other.
#
# Environment variables (defaults in brackets):
#   WIDTHS       Output sizes in px ["750 1500"]. 750 for normal screens,
#                1500 for retina (2x) screens. The longest side is fit to
#                it, so this is the width of landscape images and the
#                height of portrait ones.
#   QUALITY      WebP quality, 0-100 [72]
#   LQIP_WIDTH   Placeholder width in px, 0 for none [96]
#   LQIP_QUALITY Placeholder WebP quality, 0-100 [65]
#
# Requires ImageMagick 7 (`magick`) built with WebP support:
#   brew install imagemagick
#
# Example:
#   WIDTHS="750 1500" scripts/optimize-images.sh --trim .resources/alpha app/media/camera

set -euo pipefail

usage() {
  sed -n '3,9p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

trim=false
if [[ "${1:-}" == "--trim" ]]; then
  trim=true
  shift
fi
[[ $# -eq 2 ]] || usage

input_dir=$1
output_dir=$2
read -r -a widths <<< "${WIDTHS:-750 1500}"
quality=${QUALITY:-72}
lqip_width=${LQIP_WIDTH:-96}
lqip_quality=${LQIP_QUALITY:-65}

command -v magick > /dev/null || {
  echo "ImageMagick 7 (magick) is required: brew install imagemagick" >&2
  exit 1
}
[[ -d "$input_dir" ]] || {
  echo "Input directory not found: $input_dir" >&2
  exit 1
}

files=()
while IFS= read -r -d '' file; do
  files+=("$file")
done < <(find "$input_dir" -maxdepth 1 -type f \
  \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \
  -o -iname '*.tif' -o -iname '*.tiff' -o -iname '*.webp' \) -print0 | sort -z)

[[ ${#files[@]} -gt 0 ]] || {
  echo "No images found in $input_dir" >&2
  exit 1
}

mkdir -p "$output_dir"

crop=()
if $trim; then
  # %@ prints the trim box of one image as WxH+X+Y. Join them into one box.
  box=$(for file in "${files[@]}"; do magick "$file" -format '%@\n' info:; done |
    awk -F'[x+]' '
      NR == 1 || $3 < x0 { x0 = $3 }
      NR == 1 || $4 < y0 { y0 = $4 }
      $3 + $1 > x1 { x1 = $3 + $1 }
      $4 + $2 > y1 { y1 = $4 + $2 }
      END { printf "%dx%d+%d+%d", x1 - x0, y1 - y0, x0, y0 }')
  echo "Cropping all images to $box"
  crop=(-crop "$box" +repage)
fi

for file in "${files[@]}"; do
  name=$(basename "${file%.*}")
  outputs=()
  for width in "${widths[@]}"; do
    outputs+=(\( +clone -resize "${width}x${width}>" -quality "$quality"
      -write "$output_dir/$name-$width.webp" +delete \))
  done
  if ((lqip_width > 0)); then
    outputs+=(-resize "${lqip_width}x" -quality "$lqip_quality"
      -write "$output_dir/$name-lqip.webp")
  fi
  magick "$file" -auto-orient ${crop[@]+"${crop[@]}"} -strip \
    -define webp:method=6 -define webp:alpha-quality=50 \
    "${outputs[@]}" null:
  echo "$name"
done

echo "Wrote ${#files[@]} images to $output_dir"
du -ch "$output_dir"/*.webp | tail -1
