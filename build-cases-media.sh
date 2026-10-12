#!/bin/bash
# Converteert alle case-media uit ../Website-1 naar web-formaat in assets/cases/<slug>/
# Afbeeldingen -> webp (max 1600px, q80), video's -> mp4 (H.264, max 1280px, geen audio)
SRC="/Users/ricky/Downloads/Website-1"
DST="/Users/ricky/Downloads/ARMIN WEBDESIGN/assets/cases"
mkdir -p "$DST"

slug_for() {
  case "$1" in
    "AFCON + embed video") echo "afcon" ;;
    "Complex Puma") echo "complex-puma" ;;
    "FIFA + embedd") echo "fifa" ;;
    "G Shock Sneaker Shopping") echo "g-shock" ;;
    "Hot Ones KFC en Sprite") echo "hot-ones" ;;
    "Puma creative camp") echo "puma-creative-camp" ;;
    "Red Bul rapc hamps") echo "red-bull-rap-champs" ;;
    "Reebok back to classics") echo "reebok" ;;
    "Telfaz11") echo "telfaz11" ;;
    "Vodafone_Ziggo KICK t MET") echo "kick-t-met" ;;
    "ZAlando") echo "zalando" ;;
    "adidas") echo "adidas" ;;
    *) echo "" ;;
  esac
}

cd "$SRC"
for dir in */; do
  name="${dir%/}"
  slug=$(slug_for "$name")
  [ -z "$slug" ] && { echo "SKIP (geen slug): $name"; continue; }
  out="$DST/$slug"
  mkdir -p "$out"
  echo "=== $name -> $slug ==="

  # Afbeeldingen (gesorteerd) -> media-01.webp ...
  i=0
  find "$SRC/$name" -maxdepth 1 -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) | sort | while read -r img; do
    i=$((i+1))
    n=$(printf "%02d" "$i")
    cwebp -quiet -q 80 -resize 1600 0 "$img" -o "$out/media-$n.webp"
    echo "  img media-$n.webp"
  done

  # Video's -> clip-01.mp4 ... Prefereer .mp4 (bewerkt door Ricky); val terug op .mov.
  vids=$(find "$SRC/$name" -maxdepth 1 -type f -iname '*.mp4' | sort)
  [ -z "$vids" ] && vids=$(find "$SRC/$name" -maxdepth 1 -type f -iname '*.mov' | sort)
  j=0
  echo "$vids" | grep -v '^$' | while read -r vid; do
    j=$((j+1))
    n=$(printf "%02d" "$j")
    ffmpeg -y -nostdin -loglevel error -i "$vid" \
      -vf "scale='min(1280,iw)':-2" -an \
      -c:v libx264 -crf 26 -preset veryfast -pix_fmt yuv420p -movflags +faststart \
      "$out/clip-$n.mp4" </dev/null || echo "  FOUT bij $vid"
    echo "  vid clip-$n.mp4"
  done
done
echo "KLAAR"
