# MediConnect Healthcare App UI - Stitch Project Export

## Project Information
- **Title:** MediConnect Healthcare App UI
- **Project ID:** 8935899416950262731
- **Platform:** Google Stitch (stitch.withgoogle.com)
- **Export Date:** May 6, 2026
- **Device Type:** Mobile
- **Design Theme:** MediConnect Core (Light Mode, Manrope Typography)

## Color Palette
- **Primary Color:** #0059BB (Medical Blue)
- **Primary Variant:** #007BFF
- **Secondary Color:** #006874 (Turquoise)
- **Secondary Accent:** #26C6DA
- **Background:** #F8F9FA (Light Grey)
- **Surface:** #FFFFFF (White)
- **Error:** #BA1A1A (Red)

## Typography
- **Font Family:** Manrope
- **H1:** 32px, 700 weight, -0.02em letter-spacing
- **H2:** 24px, 600 weight
- **Body:** 16px, 400 weight, 24px line-height
- **Labels:** 14px, 600 weight

## Screens Exported

### 1. Home Screen
- **Screen ID:** 7fcae6d5c1204174984174638cfff4a6
- **Directory:** `1_home_screen/`
- **Dimensions:** 780 x 2478 px (Mobile)
- **Files:**
  - `screenshot.png` - Visual mockup
  - `index.html` - Generated frontend code

### 2. Health Centers
- **Screen ID:** 6445dc35748944fe8283461b94cdf59f
- **Directory:** `2_health_centers/`
- **Dimensions:** 780 x 1768 px (Mobile)
- **Files:**
  - `screenshot.png` - Visual mockup
  - `index.html` - Generated frontend code

### 3. Doctors List
- **Screen ID:** 0fcd9509aaa04c38b25773ae9f611096
- **Directory:** `3_doctors_list/`
- **Dimensions:** 780 x 1768 px (Mobile)
- **Files:**
  - `screenshot.png` - Visual mockup
  - `index.html` - Generated frontend code

### 4. Doctor Detail
- **Screen ID:** 04aa8b83ff074c95be79d232224c1ac5
- **Directory:** `4_doctor_detail/`
- **Dimensions:** 780 x 2852 px (Mobile)
- **Files:**
  - `screenshot.png` - Visual mockup
  - `index.html` - Generated frontend code

## Design System Details

### Spacing System
- **Base:** 8px rhythmic system
- **XS:** 4px
- **SM:** 12px
- **MD:** 16px
- **LG:** 24px
- **XL:** 32px
- **Container Padding:** 20px
- **Gutter:** 16px

### Border Radius
- **Small:** 4px (0.25rem)
- **Default:** 8px (0.5rem)
- **Medium:** 12px (0.75rem)
- **Large:** 16px (1rem)
- **XL:** 24px (1.5rem)
- **Full:** 9999px (pill-shaped)

### Component Guidelines

#### Buttons
- Primary buttons: Medical Blue (#0059BB) with white text
- Gradient effect: #0088FF to #007BFF (top to bottom)
- Secondary buttons: Ghost style with turquoise outline

#### Cards
- White surface
- 24px corner radius (rounded-xl)
- Soft ambient shadow with blue tint (4-6% opacity)
- Used for: patient records, appointments, health metrics

#### Input Fields
- 16px corner radius
- Light grey background (#F1F3F5)
- 2px Primary Blue border on focus
- Persistent labels above field

#### Progress Bars
- Thick height (8px+) with fully rounded caps
- Track: light neutral grey
- Fill: turquoise-to-blue gradient

#### Lists
- Clean, borderless items
- 8px whitespace between items
- Muted grey chevron-right icons for drill-down

## Design Principles

### Brand Personality
**Empathetic Efficiency** - Targeting patients and healthcare providers requiring clarity and calm during potentially stressful interactions.

### Visual Style
- **Style:** Corporate / Modern with strong Minimalism
- **Aesthetic:** Clinical yet inviting
- **Focus:** High legibility and breathing room to reduce cognitive load
- **Whitespace:** Heavy use to maintain "clean room" aesthetic
- **Decorative Elements:** Avoided - every visual serves a functional purpose

### Accessibility
- High contrast for readability
- Generous line heights (24px+) for body text
- All labels use increased weight for legibility at small scales
- Color choices meet accessibility standards

## File Structure

```
stitch_mediconnect_export/
├── 1_home_screen/
│   ├── screenshot.png
│   └── index.html
├── 2_health_centers/
│   ├── screenshot.png
│   └── index.html
├── 3_doctors_list/
│   ├── screenshot.png
│   └── index.html
├── 4_doctor_detail/
│   ├── screenshot.png
│   └── index.html
└── README.md
```

## HTML Code

Each screen's `index.html` file contains the generated frontend code with:
- Complete HTML structure
- Embedded CSS styling
- Component layouts matching the design system
- Responsive design considerations for mobile devices

### Opening HTML Files
Each HTML file is standalone and can be opened directly in a web browser:
```bash
# On Windows
start 1_home_screen/index.html

# Or with your preferred browser
firefox 1_home_screen/index.html
```

## Design System Documentation

The complete design system markdown is embedded in the project, detailing:
- Brand and style guidelines
- Color semantics for light and dark modes
- Typography hierarchy
- Layout and spacing conventions
- Elevation and depth treatment
- Component specifications
- Accessibility standards

## Usage Instructions

### Viewing Mockups
- Open any `screenshot.png` file in an image viewer to see the visual design
- Screenshots are high-resolution mockups suitable for presentation and reference

### Integrating HTML Code
1. Open the corresponding `index.html` file in a browser to preview
2. Export or adapt the HTML/CSS to your development framework (React, Vue, Angular, etc.)
3. Replace placeholder content with real data and integration

### Customizing the Design
- All colors are defined in the design system and can be easily updated
- Typography is consistently applied across all screens
- Spacing and layout follow the 8px rhythmic system for consistency

## Framework Recommendations

For implementation, consider:
- **React/Vue:** Extract component structure and adapt to framework patterns
- **React Native:** Use dimensions as reference for native component sizing
- **Flutter:** Adapt color tokens and typography to Flutter themes
- **Web:** Use CSS/Tailwind to recreate the design system tokens

## Design System Source

**Design Framework:** Google Stitch
**Theme Name:** MediConnect Core
**Base Font:** Manrope (Google Fonts)
**Color Mode:** Light
**Color Variant:** FIDELITY

---

*Generated from Google Stitch on May 6, 2026*
*Project: MediConnect Healthcare App UI (ID: 8935899416950262731)*
