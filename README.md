# Kernel + Vercel Template

A Next.js template demonstrating how to use the Kernel SDK with Playwright for browser automation in Vercel functions.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=REPOSITORY_URL&project-name=nextjs-kernel-template&repository-name=nextjs-kernel-template&demo-title=Kernel+%26+Vercel+Template&demo-description=Example+Next.js+app+showing+how+to+use+Kernel+SDK+with+Playwright+in+Vercel+functions&demo-url=DEMO_URL&demo-image=DEMO_IMAGE_URL&integration-ids=KERNEL_INTEGRATION_ID)

## Overview

This template shows how to:

- Create cloud browsers using the Kernel SDK
- Connect Playwright to Kernel browsers via CDP
- Run browser automation scripts in Vercel serverless functions
- Display results in a modern Next.js UI

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Browser Automation**: Kernel SDK + Playwright
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
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
   pnpm install
   ```

3. **Set up Kernel**:

   Get your Kernel API key from one of these sources:

   - **Option 1 (Recommended)**: Install the [Kernel integration](https://vercel.com/integrations/kernel) from the Vercel Marketplace
   - **Option 2**: Get your API key from [https://dashboard.onkernel.com](https://dashboard.onkernel.com)

4. **Configure environment variables**:

   Create a `.env.local` file:

   ```bash
   cp .env.example .env.local
   ```

   Add your Kernel API key:

   ```
   KERNEL_API_KEY=your_api_key_here
   ```

5. **Run the development server**:

   ```bash
   pnpm dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. **Browser Creation**: When you click "Run Browser Automation", the API route creates a headless browser using the Kernel SDK
2. **Playwright Connection**: The code connects Playwright to the Kernel browser via CDP (Chrome DevTools Protocol)
3. **Script Execution**: A simple Playwright script navigates to onkernel.com and retrieves the page title
4. **Cleanup**: The browser is automatically deleted after the script completes

## Code Structure

```
app/
├── api/
│   └── run-browser/
│       └── route.ts          # API endpoint that runs the automation
├── page.tsx                  # Main UI with button and results
└── layout.tsx                # Root layout

components/
└── ui/                       # shadcn/ui components
```

### Key Code Example

```typescript
import { Kernel } from "@onkernel/sdk";
import { chromium } from "playwright-core";

// Initialize Kernel client
const kernel = new Kernel({ apiKey: process.env.KERNEL_API_KEY });

// Create a browser
const browser = await kernel.browsers.create({ stealth: true });

// Connect Playwright via CDP
const pwBrowser = await chromium.connectOverCDP(browser.cdp_ws_url);

// Run your automation
const page = await pwBrowser.newPage();
await page.goto("https://onkernel.com");
const title = await page.title();

// Clean up
await pwBrowser.close();
await kernel.browsers.delete(browser.id);
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
- [Playwright Documentation](https://playwright.dev)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT

---

Built with [Kernel](https://dashboard.onkernel.com) and [Vercel](https://vercel.com)
