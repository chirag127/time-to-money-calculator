# Time to Money Calculator

[![Deploy to GitHub Pages](https://github.com/chirag127/time-to-money-calculator/actions/workflows/deploy.yml/badge.svg)](https://github.com/chirag127/time-to-money-calculator/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/Live_Site-GitHub_Pages-10b981?style=flat&logo=github)](https://chirag127.github.io/time-to-money-calculator/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Astro](https://img.shields.io/badge/Astro-5.x-ff5d01.svg?logo=astro)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?logo=typescript)](https://www.typescriptlang.org/)

> **Live Website:** [https://chirag127.github.io/time-to-money-calculator/](https://chirag127.github.io/time-to-money-calculator/)

**Time to Money Calculator** is a production-grade, privacy-first financial engineering platform built to answer human questions rather than simply output raw formulas.

Instead of asking *"What is the compounding function of P?"*, this platform answers:
- **"How long will it take for my money to reach my target goal?"**
- **"How much money will I have after 10 or 20 years?"**
- **"What annualized rate of return do I need to reach my goal by age 40?"**
- **"How much should I invest every month to reach ₹1 Crore?"**
- **"How long will my retirement corpus last under monthly SWP withdrawals?"**
- **"What is the inflation-adjusted purchasing power of my future money?"**

---

## 🌟 Major Features

1. **Flagship Time to Target Solver:**
   - Calculates exact **Years, Months, and Days** to reach any target amount.
   - Computes estimated calendar target date (e.g., *14 June 2034*).
   - Simulates periodic compounding (daily, weekly, monthly, quarterly, annual).
   - Supports **Annuity Due** (beginning-of-period) and **Ordinary Annuity** (end-of-period).
   - Models **Annual Step-Up SIP** (e.g., 10% annual increment with salary hikes).
   - Accounts for inflation discounting, tax on returns, and expense ratio deductions.

2. **Full Multi-Mode Financial Suite (17+ Dedicated Calculators):**
   - **Mode A:** Time to Target Calculator
   - **Mode B:** Future Value Calculator (FV)
   - **Mode C:** Required Return Calculator (with high-risk alerts)
   - **Mode D:** Required Initial Lump Sum Investment
   - **Mode E:** Required Periodic Contribution (SIP)
   - **Mode F:** Target Date Calculator
   - **Mode G:** Investment Growth Progression
   - **Mode H:** Inflation & Real Purchasing Power (Fisher Equation)
   - **Mode I:** CAGR (Compound Annual Growth Rate) Calculator
   - **Mode J:** XIRR Calculator (Irregular cash flows and exact transaction dates)
   - **Mode K & L:** Simple & Compound Interest Calculators
   - **Mode M:** Mutual Fund SIP Calculator
   - **Mode N:** Lump Sum Investment Calculator
   - **Mode O:** SIP + Lump Sum Hybrid Calculator
   - **Mode P:** SWP / Systematic Withdrawal Plan Longevity & Depletion
   - **Mode Q:** Landmark Goal Planners (₹10 Lakh, ₹25 Lakh, ₹50 Lakh, ₹1 Crore, ₹2 Crore, ₹5 Crore)

3. **Interactive Scenario Comparison:**
   - Compare up to **4 scenarios** side-by-side with varying savings rates, return assumptions, and targets.

4. **Dynamic Sensitivity Matrix ("What-If Table"):**
   - Live matrix illustrating how returns (6% to 18%) and SIP variations (50% to 150%) accelerate or delay reaching target goals.

5. **Interactive SVG Visualizations:**
   - Lightweight, responsive vector timeline charting total portfolio value, cumulative out-of-pocket investments, and inflation-discounted real value with hover tooltips.

6. **Indian & Global Number Formats:**
   - Instant toggle between Indian numbering (`1,00,000`, `10,00,000`, `1 Crore`, `Lakhs`) and International numbering (`100,000`, `1,000,000`, `Millions`).
   - Currency switcher supporting INR (₹), USD ($), EUR (€), GBP (£), AED, CAD, AUD, and SGD.

7. **100% Client-Side Privacy:**
   - No backend, no login, no database, no trackers. Calculations never leave your browser.

8. **Shareable State & Data Export:**
   - Safely encode calculator inputs into URL query parameters to bookmark or share calculations.
   - One-click CSV export and print-optimized PDF view.

---

## 📐 Mathematical Formulas

### 1. Future Value of Lump Sum & Recurring Stream
$$FV = PV \cdot (1 + \frac{r}{n})^{n \cdot t} + PMT \cdot \left[ \frac{(1 + \frac{r}{n})^{n \cdot t} - 1}{r / n} \right] \cdot (1 + \frac{r}{n} \cdot \text{timing})$$

### 2. Inflation-Adjusted Real Value (Fisher Equation)
$$1 + r_{\text{real}} = \frac{1 + r_{\text{nominal}}}{1 + i}$$
$$\text{Real Purchasing Power} = \frac{\text{Nominal Amount}}{(1 + i)^t}$$

### 3. Compound Annual Growth Rate (CAGR)
$$\text{CAGR} = \left( \frac{\text{Ending Value}}{\text{Beginning Value}} \right)^{\frac{1}{t}} - 1$$

### 4. Extended Internal Rate of Return (XIRR)
$$\sum_{i=1}^{N} \frac{C_i}{(1 + r)^{\frac{d_i - d_0}{365}}} = 0$$

### 5. Systematic Withdrawal Plan (SWP) Balance Recursion
$$\text{Balance}_m = \text{Balance}_{m-1} \cdot (1 + \frac{r}{12}) - \text{Withdrawal}_m$$

---

## 🛠️ Tech Stack & Architecture

- **Framework:** [Astro 5](https://astro.build/) (Static Site Generation for sub-second page loads and zero unnecessary JS)
- **UI Components:** React 19 + TypeScript
- **Styling:** Custom Vanilla CSS Design System with CSS Custom Properties (Dark / Light mode support)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Testing:** [Vitest](https://vitest.dev/) (Deterministic unit test suite covering 18+ mathematical edge cases)
- **Deployment:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)

---

## 📁 Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated CI/CD deployment to GitHub Pages
├── public/
│   ├── favicon.svg             # Vector brand icon
│   └── robots.txt              # Search engine crawler instructions
├── src/
│   ├── components/
│   │   ├── Header.astro        # Navigation, theme toggle, currency selector
│   │   ├── Footer.astro        # Creator links, disclaimer, and social links
│   │   ├── CalculatorPageShell.astro # Reusable SEO shell for dedicated landing pages
│   │   └── InteractiveCalculator.tsx # Flagship React calculator component
│   ├── layouts/
│   │   └── BaseLayout.astro    # HTML head, OpenGraph, JSON-LD Schema.org metadata
│   ├── lib/
│   │   ├── calculator-engine.ts      # Pure math engine functions
│   │   ├── calculator-engine.test.ts # Vitest suite with 18 unit tests
│   │   ├── formatters.ts             # Currency, Lakhs/Crores, CSV export, URL share
│   │   └── types.ts                  # TypeScript interface definitions
│   ├── pages/
│   │   ├── index.astro         # Homepage with flagship hero calculator
│   │   ├── about.astro         # Creator bio & social links
│   │   ├── privacy.astro       # Client-side privacy guarantee
│   │   ├── terms.astro         # Mathematical terms and disclaimers
│   │   ├── contact.astro       # Contact methods
│   │   ├── calculators/        # 17+ Dedicated SEO calculator pages
│   │   │   ├── index.astro
│   │   │   ├── time-to-money-calculator.astro
│   │   │   ├── 1-crore-calculator.astro
│   │   │   ├── 10-lakh-to-1-crore-calculator.astro
│   │   │   ├── future-value-calculator.astro
│   │   │   ├── compound-interest-calculator.astro
│   │   │   ├── cagr-calculator.astro
│   │   │   ├── xirr-calculator.astro
│   │   │   ├── sip-calculator.astro
│   │   │   ├── lump-sum-calculator.astro
│   │   │   ├── inflation-calculator.astro
│   │   │   ├── investment-goal-calculator.astro
│   │   │   ├── required-return-calculator.astro
│   │   │   ├── monthly-investment-calculator.astro
│   │   │   ├── swp-calculator.astro
│   │   │   ├── retirement-calculator.astro
│   │   │   └── crore-calculator.astro
│   │   ├── learn/              # Educational hub
│   │   └── guides/             # Financial strategy articles
│   └── styles/
│       ├── global.css          # Design tokens & base styles
│       └── calculator.css      # Calculator widget styling
├── astro.config.mjs            # Astro configuration with site & base path
├── package.json
└── tsconfig.json
```

---

## 🚀 Local Development & Testing

### Prerequisites
- Node.js >= 22.12.0
- npm >= 10.x

### Installation
```bash
git clone https://github.com/chirag127/time-to-money-calculator.git
cd time-to-money-calculator
npm install
```

### Run Unit Tests
```bash
npm test
```

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:4321/time-to-money-calculator/](http://localhost:4321/time-to-money-calculator/) in your browser.

### Build Production Bundle
```bash
npm run build
```

---

## 🔍 SEO & Accessibility Strategy

- **Schema.org Structured Data:** Includes `SoftwareApplication`, `WebSite`, `BreadcrumbList`, and `FAQPage` JSON-LD schemas.
- **Canonical URLs:** Configured for `https://chirag127.github.io/time-to-money-calculator/`.
- **WCAG Accessibility:** High-contrast color palette, visible focus states, ARIA labels, semantic markup, and `prefers-reduced-motion` compliance.
- **Performance:** Astro generates static HTML with zero hydration on informational pages; only interactive calculator widgets are hydrated (`client:load`).

---

## 👨‍💻 About the Creator

Built with care by **Chirag Singhal**, Software Engineer from India.

- **GitHub:** [@chirag127](https://github.com/chirag127/)
- **LinkedIn:** [linkedin.com/in/chirag127](https://www.linkedin.com/in/chirag127/)
- **X (Twitter):** [@singhal127](https://x.com/singhal127)
- **YouTube:** [@ChiragSinghal127](https://www.youtube.com/@ChiragSinghal127)
- **Instagram:** [@chiragsinghal127](https://www.instagram.com/chiragsinghal127/)
- **Reddit:** [u/Far_Macaron_9910](https://www.reddit.com/user/Far_Macaron_9910/)
- **Support:** [Buy Me a Coffee](https://buymeacoffee.com/chirag127)
- **Email:** chirag@oriz.in

---

## ⚖️ Disclaimer

*This calculator provides mathematical estimates based on the assumptions you enter. It is not investment, tax, legal, or financial advice. Actual returns, taxes, fees, inflation, and investment outcomes may differ.*

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
