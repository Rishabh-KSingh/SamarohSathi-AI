# SamarohSathi AI (समारोह साथी) 🎊

> **An intelligent, culturally aware AI event planning and coordination platform designed for Indian weddings and celebrations.**

SamarohSathi AI helps families and planners orchestrate celebrations with precision. It features deterministic INR budget allocation, timeline task scheduling, AI-powered natural language plan revisions with human-in-the-loop approval, and multi-vendor quotation comparison.

---

## ✨ Key Features

- **Personalized 4-Step Event Onboarding**: Capture core celebration details (basics, guest scale, budget flexibility, ranked priorities) in minutes.
- **Deterministic Budget & Timeline Engine**: Generates mathematically sound INR budget allocations across traditional categories (Venue, Catering, Photography, Decoration, Entertainment, Makeup, Lighting, Attire, Contingency) and auto-schedules sequential tasks with dependency tracking.
- **Adaptive Plan Revision Engine**: Submit natural language changes via the AI Assistant (e.g. *"Increase guest count from 250 to 300 without increasing total budget"*, *"Reduce budget by ₹2,00,000 while protecting food and photography"*). The engine analyzes cascading impacts, provides cost breakdowns, and generates a structured revision proposal.
- **Human-in-the-Loop Confirmation**: AI proposals are never applied automatically. Users must review and explicitly accept or reject every proposed change.
- **Vendor Management & Quotation Comparison**: Track vendors across 8 service categories, prepare vendor interview questionnaires powered by AI, and run side-by-side quotation comparisons with hidden cost detection.
- **Offline & Resilient Architecture**: Real Gemini API (`gemini-2.5-flash`) integration with graceful deterministic fallback algorithms ensuring 100% operational continuity even when offline or rate-limited.
- **Royal Heritage & Sandalwood Design System**: Built with an elegant Indian aesthetic using Tailwind CSS, Playfair Display, and Plus Jakarta Sans.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: [@google/genai SDK](https://www.npmjs.com/package/@google/genai) (`gemini-2.5-flash`)
- **Schema Validation**: [Zod 4](https://zod.dev/)
- **State & Persistence**: Reactive `useSyncExternalStore` with referential caching and LocalStorage persistence
- **Testing**: Node.js Native Test Runner (`tsx --test`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- npm or pnpm / yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rishabh-KSingh/SamarohSathi-AI.git
   cd SamarohSathi-AI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```
   *(Note: The application functions fully using deterministic fallback algorithms even if no API key is supplied).*

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view SamarohSathi AI.

5. **Build for production**:
   ```bash
   npm run build
   npm run start
   ```

6. **Run tests**:
   ```bash
   npm test
   ```

---

## 🔒 Security & Privacy

- All Gemini API calls are strictly handled server-side through Next.js API routes (`/api/generate-plan`, `/api/propose-revision`, etc.).
- No API keys are exposed to the browser or prefixed with `NEXT_PUBLIC_`.
- All event data is persisted locally within the user's browser session.

---

## 📄 License

This project is licensed under the MIT License.
