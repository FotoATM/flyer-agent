# Imagit Penetration Testing Flyer

Premium corporate print-ready 2-page flyer (front and back) for Imagit Penetration Testing services.

## Project Structure

```
├── src/
│   ├── front.html          # Front page HTML
│   ├── back.html           # Back page HTML
│   ├── styles.css          # Print-ready styles
│   └── assets/             # Logo and images
├── scripts/
│   └── export_pdf.ts       # PDF export script using Playwright
├── dist/
│   └── imagit-pen-testing-flyer.pdf  # Final exported PDF
├── package.json
└── README.md
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Export PDF

Run the export script to generate the final PDF:

```bash
npm run export
```

This will:
- Load both front.html and back.html
- Combine them into a single 2-page PDF
- Export to `dist/imagit-pen-testing-flyer.pdf`

## Page Specifications

- **Size**: US Letter (8.5" × 11")
- **Margins**: 0.25" internal safe margins (handled by CSS)
- **Format**: Print-ready PDF with background colors and gradients

## Design System

- **Premium corporate print aesthetic** - Not web-like, designed for print
- **Strong diagonal brand bands** - Hero header region with angled gradients
- **Deep navy + cyan/blue palette** - #003366 to #0066cc to #00aaff
- **Subtle watermark** - 5-8% opacity electrical/data-flow pattern
- **Tight typography** - Intentional line heights, clear hierarchy
- **12-column grid system** - Consistent alignment and spacing
- **Header ribbon badge** - Top-right positioned with slight rotation

## Logo

Logo image should be placed in `src/assets/` and referenced in the HTML files. Currently using: `Logo for header.pdf.png`
