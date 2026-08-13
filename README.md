# Gruvbox Glass Trading Journal & Prop Firm Tracker

A retro-modern, high-performance personal trading journal built for futures, crypto, forex, and stock traders. Features a **Gruvbox Glassmorphism UI**, interactive **PnL Calendar**, multi-account **Prop Firm Evaluation & Funded Account Manager** ($50,000 initial balance defaults), position sizing calculator, chart screenshot lightbox, and **100% private local IndexedDB storage**.

Designed for zero-cost static deployment to **GitHub Pages**, **Vercel**, or **Netlify**.

---

## 🚀 Key Features

### 🎨 Gruvbox Glassmorphism UI
- Handcrafted Gruvbox palette with **Dark Hard/Medium** (`#1d2021`, `#282828`, `#3c3836`) and **Soft Light** (`#fbf1c7`, `#f2e5bc`) themes.
- Frosted glass containers (`backdrop-blur-md bg-opacity-75 border-gruv-border/40`), glowing retro accent badges (`#b8bb26` profit green, `#fb4934` loss red, `#fabd2f` gold, `#fe8019` orange, `#83a598` aqua).
- Full dark / light theme switcher with instant transition.

### 📅 PnL Calendar Grid
- Interactive month-by-month calendar view with month/year navigation and a "Today" quick jump button.
- Daily cards displaying exact daily profit/loss ($), trade count, and net R-multiple.
- Color-coded green/red day tiles with hover effects.
- **Day Inspector Drawer**: Click any calendar day to inspect and edit all trades executed on that specific date.
- Monthly performance summary (Total PnL, Win Rate %, Active Trading Days, Best & Worst Day).

### 🎯 Prop Firm Eval & Funded Account Manager
- Create and switch between multiple trading accounts / prop firm evaluations:
  - **Evaluation Accounts (`eval`)**: Real-time **Progress to Passing** profit target bar (e.g. $3,000 target for $50k eval), remaining profit needed, and drawdown cushion buffer.
  - **Funded Accounts (`funded`)**: Real-time **Progress to Next Payout** threshold bar (e.g. $1,500 payout buffer), trading days active, and safety margin above initial capital.
  - **Personal Accounts (`personal`)**: All-time return on capital % and peak equity tracking.
- Real-time Max Drawdown cushion progress bar protecting against account breaches.

### 💵 Dual PnL Input Modes
- **Balance Delta Mode (Recommended)**: Input `Account Balance Before Trade` and `Account Balance After Trade`. Auto-computes exact **Net PnL = After - Before**, seamlessly accounting for broker commissions, NQ/ES point multipliers, spread costs, and slippage.
- **Price & Contract Execution Mode**: Input entry price, exit price, contracts/quantity, stop loss, take profit, and fees for granular trade analysis.

### 📈 Equity Curve & Deep Analytics
- **Equity & Drawdown Trajectory Chart**: Interactive area chart rendered with `recharts`, showing cumulative account growth and drawdown dips.
- **KPI Summary Cards**: Total Net PnL, Win Rate %, Profit Factor, Avg Win / Avg Loss ratio, Avg R-Multiple, Expectancy ($), and Max Drawdown ($ and %).
- **Strategy & Tag Profitability**: Track setup performance (`#Breakout`, `#ICT_FVG`, `#TrendFollow`, `#Scalp`, `#News`).
- **Psychological & Emotional Cost Analysis**: Quantify how much money disciplined execution makes vs. FOMO, revenge trading, or greedy holds.

### 📸 Screenshot Lightbox & Tools
- Attach chart screenshots to any trade entry (stored locally in IndexedDB as compressed Base64 data).
- Click any screenshot to open a full-screen lightbox zoom overlay.
- **Position Size & Risk Calculator**: Calculate exact contract / lot sizing based on account equity, risk %, and stop loss distance for NQ, ES, Forex, and Crypto.
- **1-Click Backup & Restore**: Export full JSON database backups, import JSON backups, and export CSV files for Excel / Google Sheets.
- **1-Click Demo Data Loader**: Populate realistic $50k prop firm evaluation trades instantly for testing.

---

## 🔒 100% Private & Serverless Architecture

All trades, notes, account configurations, and chart screenshots are stored **entirely in your browser's persistent IndexedDB storage** using `idb`. 

- **Zero Backend Cost**: No database servers, API keys, or monthly subscriptions required.
- **100% Private**: Your trading data never leaves your device or browser.
- **Offline Capable**: Works completely offline after initial load.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Custom Gruvbox Color Palette & Glassmorphism Utilities
- **Icons**: `lucide-react`
- **Charts**: `recharts`
- **Storage**: IndexedDB via `idb`

---

## 📦 Local Installation & Development

1. **Clone repository**:
   ```bash
   git clone https://github.com/your-username/gruvbox-trading-journal.git
   cd gruvbox-trading-journal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```

4. **Build production bundle**:
   ```bash
   npm run build
   ```

---

## 🌐 GitHub Pages Deployment Guide

### Option 1: Automatic GitHub Action (Recommended)
1. Push your repository to GitHub.
2. In your repository settings on GitHub, navigate to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. GitHub will automatically detect Vite and deploy your site on every push!

### Option 2: `gh-pages` Branch
1. Install `gh-pages`:
   ```bash
   npm install -D gh-pages
   ```
2. Add deploy script to `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Run `npm run deploy`.

---

## 🌐 Vercel Deployment Guide

1. Import repository on [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Click **Deploy**!

---

## 📜 License

MIT License. Designed for personal trading execution and performance tracking.
