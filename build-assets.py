#!/usr/bin/env python3
"""Converteert de ruwe PNG-assets naar geoptimaliseerde, hernoemde WebP in /assets.
Alles is vrijstaand/transparant -> WebP met alpha. Doel: elk bestand < 400KB."""
import os, subprocess, glob

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "assets")
for sub in ("sequence", "head", "services"):
    os.makedirs(os.path.join(OUT, sub), exist_ok=True)


def webp(src, dst, width, q):
    subprocess.run(
        ["cwebp", "-quiet", "-q", str(q), "-resize", str(width), "0", src, "-o", dst],
        check=True,
    )


print(">> HEAD POSITIONS")
for src, dst in (("DEFAULT.png", "default.webp"), ("TOP.png", "top.webp"), ("BOTTOM.png", "bottom.webp")):
    webp(os.path.join(ROOT, "HEAD POSITIONS", src), os.path.join(OUT, "head", dst), 1600, 82)

print(">> SERVICES")
services = {
    "Creative Strategy.png": "creative-strategy.webp",
    "Format & IP Development.png": "format-ip-development.webp",
    "Football & Culture Consultancy.png": "football-culture-consultancy.webp",
    "Creative Direction & Production.png": "creative-direction-production.webp",
    "Partnerships & Cultural Connections.png": "partnerships-cultural-connections.webp",
}
for src, dst in services.items():
    webp(os.path.join(ROOT, "SERVICES", src), os.path.join(OUT, "services", dst), 900, 82)

print(">> IMAGE SEQUENCE")
frames = sorted(glob.glob(os.path.join(ROOT, "IMAGE SEQUENCE", "*.png")))
for i, src in enumerate(frames, start=1):
    webp(src, os.path.join(OUT, "sequence", "frame_%04d.webp" % i), 1280, 78)
print("   frames:", len(frames))

print(">> Grootste bestanden (KB):")
sizes = []
for f in glob.glob(os.path.join(OUT, "**", "*.webp"), recursive=True):
    sizes.append((os.path.getsize(f) // 1024, os.path.relpath(f, ROOT)))
sizes.sort(reverse=True)
for kb, name in sizes[:6]:
    print("  %5d KB  %s" % (kb, name))
over = [s for s in sizes if s[0] > 400]
print(">> Bestanden > 400KB:", len(over))
