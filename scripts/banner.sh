#!/usr/bin/env bash
# Megazord banner with Power Rangers colors
# Usage: scripts/banner.sh [version]

VERSION="${1:-1.1.2}"

# Power Rangers palette (truecolor)
R='\033[38;2;230;57;70m'    # Red Ranger   (M, O)
B='\033[38;2;69;123;157m'   # Blue Ranger  (E, R)
Y='\033[38;2;244;163;0m'    # Yellow Ranger (G, D)
P='\033[38;2;232;145;178m'  # Pink Ranger  (A)
G='\033[38;2;45;198;83m'    # Green Ranger (Z)
W='\033[38;2;161;161;170m'  # Gray
D='\033[2m'                 # Dim
N='\033[0m'                 # Reset

printf "\n"
printf "  ${R}███╗   ███╗${B}███████╗${Y} ██████╗ ${P} █████╗ ${G}███████╗${R} ██████╗ ${B}██████╗ ${Y}██████╗${N}\n"
printf "  ${R}████╗ ████║${B}██╔════╝${Y}██╔════╝ ${P}██╔══██╗${G}╚════██║${R}██╔═══██╗${B}██╔══██╗${Y}██╔══██╗${N}\n"
printf "  ${R}██╔████╔██║${B}█████╗  ${Y}██║  ███╗${P}███████║${G}  ███╔╝ ${R}██║   ██║${B}██████╔╝${Y}██║  ██║${N}   ${W}v${VERSION}${N}\n"
printf "  ${R}██║╚██╔╝██║${B}██╔══╝  ${Y}██║   ██║${P}██╔══██║${G} ███╔╝  ${R}██║   ██║${B}██╔══██╗${Y}██║  ██║${N}   ${D}Project Management${N}\n"
printf "  ${R}██║ ╚═╝ ██║${B}███████╗${Y}╚██████╔╝${P}██║  ██║${G}███████╗${R}╚██████╔╝${B}██║  ██║${Y}██████╔╝${N}   ${D}× Code Quality${N}\n"
printf "  ${R}╚═╝     ╚═╝${B}╚══════╝${Y} ╚═════╝ ${P}╚═╝  ╚═╝${G}╚══════╝${R} ╚═════╝ ${B}╚═╝  ╚═╝${Y}╚═════╝${N}    ${D}× Agent Teams${N}\n"
printf "\n"
