<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Tori | Visual Travel Planner

Transform your travel planning from spreadsheets to a beautiful, infinite canvas. Plan visually, collaborate easily, and let AI handle the logistics.

[![UI/UX Score](https://img.shields.io/badge/UI%2FUX%20Score-8.4%2F10-brightgreen)](./UI-UX-AUDIT.md)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-blue)](./index.css)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## ✨ Features

- **🗺️ Infinite Canvas** - Drag, drop, zoom. See your whole trip or focus on details
- **🤖 Non-Intrusive AI Copilot** - Smart suggestions that respect your preferences
- **⏰ Time-Aware Logic** - Auto-adjusts schedule when you move activities
- **👥 Collaborative** - Share visual timelines with travel companions
- **📱 Responsive** - Works beautifully on mobile, tablet, and desktop

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recommend 20+)
- **Python** 3.10+ (for UI/UX design system tools)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/florian-spikes/Tori-lab.git
cd Tori-lab

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## 🎨 UI/UX Audit

This project has been audited and improved using **[UI/UX Pro Max](/.agent/skills/ui-ux-pro-max)** design intelligence.

### Current Score: **8.4/10** ✅

**Key improvements implemented:**
- ✅ Full `prefers-reduced-motion` support (WCAG 2.1 compliant)
- ✅ Proper `cursor-pointer` on all interactive elements
- ✅ Functional mobile menu with smooth animations
- ✅ Text contrast minimum 4.5:1 (WCAG AA)
- ✅ Focus states visible for keyboard navigation

📄 **Read the full audit:** [UI-UX-AUDIT.md](./UI-UX-AUDIT.md)  
📊 **Implementation report:** [UI-UX-IMPROVEMENTS.md](./UI-UX-IMPROVEMENTS.md)

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS (via CDN)
- **Icons:** Lucide React
- **Module Loading:** ESM via import maps

---

## 📂 Project Structure

```
Tori-lab/
├── .agent/                  # Antigravity AI skills
│   ├── skills/
│   │   └── ui-ux-pro-max/  # Design system intelligence
│   └── README.md
├── components/              # React components
│   ├── Navbar.tsx          # Navigation with mobile menu
│   ├── Hero.tsx            # Landing hero section
│   ├── Features.tsx        # Feature showcase
│   ├── Workflow.tsx        # How it works
│   ├── Testimonials.tsx    # Social proof
│   ├── StickyCTA.tsx       # Sticky email capture
│   ├── Footer.tsx          # Footer section
│   └── InteractiveCanvas.tsx # Demo canvas
├── index.html              # HTML entry point
├── index.css               # Global styles + accessibility
├── App.tsx                 # Main React app
├── types.ts                # TypeScript types
├── UI-UX-AUDIT.md          # Complete UI/UX audit
└── UI-UX-IMPROVEMENTS.md   # Implementation report
```

---

## 🎯 Design Principles

Following **UI/UX Pro Max** guidelines:

### Style
- **Primary:** Glassmorphism + Soft UI Evolution
- **Dark Mode:** OLED-optimized (#0a0a0a background)
- **Animations:** 150-300ms for micro-interactions
- **Accessibility:** WCAG 2.1 AA compliant

### Colors
- **Brand:** Orange (#f97316) - Warm, inviting, action-oriented
- **Dark Palette:** Neutral grays (#171717, #262626)
- **Text:** Minimum 4.5:1 contrast ratio

### Typography
- **Font:** Inter (300-800 weights)
- **Hierarchy:** Clear heading structure (h1-h3)
- **Line Height:** 1.5-1.7 for readability

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] **Accessibility**
  - [ ] Keyboard navigation works (Tab, Enter, Esc)
  - [ ] Focus states visible on all interactive elements
  - [ ] Screen reader compatible
  - [ ] Animations respect `prefers-reduced-motion`

- [ ] **Responsive**
  - [ ] Mobile (375px): Menu works, layout adjusts
  - [ ] Tablet (768px): Grid columns adapt
  - [ ] Desktop (1024px+): Full layout

- [ ] **Interactions**
  - [ ] All buttons have `cursor: pointer`
  - [ ] Hover states provide feedback
  - [ ] Transitions smooth (not jarring)

---

## 📦 Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

---

## 🤖 AI-Powered Development

This project uses **Antigravity** with the **UI/UX Pro Max** skill for intelligent design decisions.

### Generate Design System
```bash
python .agent/skills/ui-ux-pro-max/scripts/search.py \
  "travel planning SaaS collaborative" \
  --design-system -p "Tori"
```

### Get Style Recommendations
```bash
python .agent/skills/ui-ux-pro-max/scripts/search.py \
  "glassmorphism dark mode" --domain style
```

---

## 🐛 Known Issues

### TypeScript Errors (Expected)
You may see TypeScript errors in the IDE:
- "Cannot find module 'react'"
- "Cannot find module 'lucide-react'"

**This is normal.** The project uses ESM imports at runtime via import maps. No local compilation is needed.

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

- **UI/UX Pro Max** - Design system intelligence
- **Antigravity** - AI-powered development assistant
- **Tailwind CSS** - Utility-first styling
- **Lucide** - Beautiful open-source icons

---

## 🔗 Links

- [View App in AI Studio](https://ai.studio/apps/drive/1VIaiyyocscpHTbiYq-pOGWhE_W5vyAcS)
- [UI/UX Audit Report](./UI-UX-AUDIT.md)
- [Implementation Report](./UI-UX-IMPROVEMENTS.md)

---

<div align="center">
  <strong>Made with ❤️ for travelers who think visually</strong>
</div>
