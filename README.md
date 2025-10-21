# Kernel + Vercel Template

A Next.js template demonstrating how to run browser automations in Vercel serverless functions, powered by Kernel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fonkernel%2Fkernel-nextjs-template&project-name=kernel-nextjs-template&repository-name=kernel-nextjs-template&integration-ids=oac_NEj8KPenfKQGUrRTVRrZL3vV&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22kernel%22%2C%22productSlug%22%3A%22kernel%22%2C%22protocol%22%3A%22other%22%7D%5D)

## Overview

This template shows how to:

- Create cloud browsers with live view using the Kernel SDK
- Connect automation frameworks to Kernel browsers via CDP
- Run browser automations in Next.js API routes
- Display live browser view and automation results in a modern Next.js UI

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Browser Automation**: Kernel SDK + Playwright
- **Package Manager**: Bun
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh) (package manager)
- [Bun](https://bun.sh) (package manager)
- A Kernel account and API key
- Vercel account (optional, for deployment)

### Installation

1. **Clone the repository**:

   ```bash
   git clone <your-repo-url>
   cd nextjs-kernel-template
   ```

2. **Install dependencies**:

   ```bash
   bun install
   ```

3. **Set up Kernel**:

   Get your Kernel API key from one of these sources:

   - **Option 1 (Recommended)**: Install the [Kernel integration](https://vercel.com/integrations/kernel) from the Vercel Marketplace
   - **Option 2**: Get your API key from [https://dashboard.onkernel.com](https://dashboard.onkernel.com)

4. **Configure environment variables**:

   Create a `.env` file:

   ```bash
   touch .env.local
   ```

   Add your Kernel API key:

   ```
   KERNEL_API_KEY=your_api_key_here
   ```

5. **Run the development server**:

   ```bash
   bun dev
   bun dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. **Browser Creation**: Click "Create Browser" to provision a headful Kernel browser with live view capabilities
2. **Live View**: See your browser running in real-time through the embedded live view iframe
3. **Automation**: Enter any URL and click "Run Automation" to navigate to it using Playwright over CDP
4. **Results**: View execution metrics and page information returned from your automation

## Code Structure

```
app/
├── api/
│   ├── create-browser/
│   │   └── route.ts          # Creates a headful Kernel browser
│   └── run-automation/
│       └── route.ts          # Connects via CDP and runs automation
├── page.tsx                  # Main UI with live view and controls
├── layout.tsx                # Root layout
└── globals.css               # Global styles

components/
└── ui/                       # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    └── input.tsx

lib/
└── utils.ts                  # Utility functions
```

### Key Code Example

**Step 1: Create Browser** (`app/api/create-browser/route.ts`)

```typescript
import { Kernel } from "@onkernel/sdk";

// Initialize Kernel client
const kernel = new Kernel({ apiKey: process.env.KERNEL_API_KEY });

// Create a headful browser with live view
const browser = await kernel.browsers.create({
  stealth: true,
  headless: false,
});

// Return browser details to client
return {
  sessionId: browser.session_id,
  liveViewUrl: browser.browser_live_view_url,
  cdpWsUrl: browser.cdp_ws_url,
};
```

**Step 2: Run Automation** (`app/api/run-automation/route.ts`)

```typescript
import { chromium } from "playwright-core";

// Connect Playwright to the Kernel browser via CDP
const browser = await chromium.connectOverCDP(cdpWsUrl);

// Get the default context and page
const context = browser.contexts()[0];
const page = context.pages()[0] || (await context.newPage());

// Navigate and extract data
await page.goto(url, { waitUntil: "domcontentloaded" });
const title = await page.title();

// Close Playwright connection (browser continues running)
await browser.close();

return { title, url };
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**

2. **Connect to Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add your `KERNEL_API_KEY` environment variable
   - Deploy!

3. **Using Vercel Marketplace Integration**:
   - Install [Kernel from Vercel Marketplace](https://vercel.com/integrations/kernel)
   - The integration will automatically add the API key to your project
   - Deploy your project

### Environment Variables

Make sure to add this environment variable in your Vercel project settings:

- `KERNEL_API_KEY` - Your Kernel API key

## Learn More

- [Kernel Documentation](https://docs.onkernel.com)
- [Kernel API Reference](https://docs.onkernel.com/api-reference)
- [Next.js Documentation](https://nextjs.org/docs)

---

Built with [Kernel](https://dashboard.onkernel.com) and [Vercel](https://vercel.com)
