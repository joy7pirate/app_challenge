#!/bin/bash
# Quick Start Guide - MediConnect Stitch Export

PROJECT_DIR="./stitch_mediconnect_export"
SCREENS=("1_home_screen" "2_health_centers" "3_doctors_list" "4_doctor_detail")

echo "📱 MediConnect Healthcare App UI - Stitch Export"
echo "================================================"
echo ""

for screen in "${SCREENS[@]}"; do
    echo "📂 $screen/"
    if [ -f "$PROJECT_DIR/$screen/screenshot.png" ]; then
        echo "  ✓ screenshot.png (Design mockup)"
    fi
    if [ -f "$PROJECT_DIR/$screen/index.html" ]; then
        echo "  ✓ index.html (Generated code)"
    fi
    echo ""
done

echo "📄 Documentation: README.md"
echo ""
echo "Quick Access URLs (from Google Stitch):"
echo "  Project: https://stitch.withgoogle.com/projects/8935899416950262731"
echo ""
echo "Screen IDs:"
echo "  1. Home Screen:      7fcae6d5c1204174984174638cfff4a6"
echo "  2. Health Centers:   6445dc35748944fe8283461b94cdf59f"
echo "  3. Doctors List:     0fcd9509aaa04c38b25773ae9f611096"
echo "  4. Doctor Detail:    04aa8b83ff074c95be79d232224c1ac5"
