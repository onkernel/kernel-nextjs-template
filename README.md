# Chrome Extension Performance Testing

A Next.js application for testing and comparing Chrome extension performance using dual browser automation, powered by Kernel, Magnitude, and Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fonkernel%2Fkernel-nextjs-template&project-name=kernel-nextjs-template&repository-name=kernel-nextjs-template&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22kernel%22%2C%22productSlug%22%3A%22kernel%22%2C%22protocol%22%3A%22other%22%7D%5D)

## Overview

This application demonstrates how to:

- Select and load Chrome extensions from your Kernel account
- Create dual cloud browsers (one with extension, one without) with live views
- Run AI-powered automation tasks using Magnitude and Claude
- Analyze the impact of Chrome extensions on browsing and automation tasks

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Browser Infrastructure**: Kernel SDK
- **AI Automation**: Magnitude + Claude Sonnet/Haiku 4.5
- **Package Manager**: Bun
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh) (package manager)
- A Kernel account and API key ([Get one here](https://dashboard.onkernel.com))
- An Anthropic API key ([Get one here](https://console.anthropic.com))
- Chrome extensions uploaded to your Kernel account
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

3. **Set up API keys**:

   - **Kernel API key**: Get from [Kernel Dashboard](https://dashboard.onkernel.com) or install the [Kernel integration](https://vercel.com/integrations/kernel) from Vercel Marketplace
   - **Anthropic API key**: Get from [Anthropic Console](https://console.anthropic.com)

4. **Upload Chrome extensions**:

   Upload your Chrome extension to Kernel following the [extension documentation](https://www.onkernel.com/docs/browsers/extensions)

5. **Configure environment variables**:

   Create a `.env` file:

   ```bash
   touch .env
   ```

   Add your API keys:

   ```
   KERNEL_API_KEY=your_kernel_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

6. **Run the development server**:

   ```bash
   bun dev
   ```

7. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Example Chrome Extensions

This repository includes two sample Chrome extensions in the [`/extension-examples`](extension-examples/) directory that you can use to test the demo:

### 1. Kernel Mode
**Location**: [`/extension-examples/kernel-mode`](extension-examples/kernel-mode/)

Replaces all images and videos on web pages with Kernel logos. Great for testing visual content modification and DOM manipulation performance.

### 2. Remove Webpage Media
**Location**: [`/extension-examples/remove-webpage-media`](extension-examples/remove-webpage-media/)

Blocks and removes all images and videos from loaded web pages. Useful for testing page load performance.

### How to Use These Extensions

1. **Login to Kernel CLI**:
   ```bash
   kernel login
   ```

2. **Upload to Kernel via CLI**:
   ```bash
   kernel extensions upload ./extension-examples/kernel-mode --name kernel-mode
   ```

3. **Test in the demo**:
   - Start the development server
   - Select your uploaded extension from the dropdown
   - Create dual browsers and run automation tasks to see the extension's impact

## How It Works

1. **Select Extension**: Choose a Chrome extension from your Kernel account via the dropdown
2. **Create Dual Browsers**: Click "Create Browsers" to provision two identical Kernel browsers in parallel:
   - **Browser A**: Baseline browser (stealth mode enabled)
   - **Browser B**: Same configuration + your selected Chrome extension
3. **Live Views**: Watch both browsers side-by-side in real-time through embedded iframes
4. **AI Automation**: Enter a target website and describe a task in natural language
5. **Parallel Execution**: Magnitude agents run the same task on both browsers simultaneously using Claude Haiku 4.5
6. **Compare Results**: View execution times and AI-generated summaries side-by-side to see the extension's impact

## Code Structure

```
app/
├── api/
│   ├── create-browser/
│   │   └── route.ts          # Creates dual Kernel browsers (with/without extension)
│   ├── list-extensions/
│   │   └── route.ts          # Fetches user's Chrome extensions from Kernel
│   └── run-automation/
│       └── route.ts          # Runs Magnitude AI agents on both browsers
├── page.tsx                  # Main UI with dual live views and controls
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

### Key Code Examples

**Step 1: List Extensions** (`app/api/list-extensions/route.ts`)

```typescript
import { Kernel } from "@onkernel/sdk";

const kernel = new Kernel({ apiKey: process.env.KERNEL_API_KEY });

// Fetch user's Chrome extensions
const extensions = await kernel.extensions.list();

return extensions.map(ext => ({
  id: ext.id,
  name: ext.name,
}));
```

**Step 2: Create Dual Browsers** (`app/api/create-browser/route.ts`)

```typescript
import { Kernel } from "@onkernel/sdk";

const kernel = new Kernel({ apiKey: process.env.KERNEL_API_KEY });

// Create both browsers in parallel
const [browserA, browserB] = await Promise.all([
  // Browser A: Standard browser
  kernel.browsers.create({
    stealth: true,
    headless: false,
  }),
  // Browser B: With extension
  kernel.browsers.create({
    stealth: true,
    headless: false,
    extensions: [{ name: extensionName }],
  }),
]);
```

**Step 3: Run AI Automation** (`app/api/run-automation/route.ts`)

```typescript
import { startBrowserAgent } from "magnitude-core";
import { z } from "zod";

// Initialize Magnitude agent
const agent = await startBrowserAgent({
  url: startingUrl,
  browser: { cdp: cdpWsUrl },
  llm: {
    provider: "anthropic",
    options: {
      model: "claude-haiku-4-5-20251001",
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
  },
});

// Execute natural language task
await agent.act([userTask]);

// Extract results
const output = await agent.extract(
  "Summarize what you did and what you found",
  z.string()
);
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**

2. **Connect to Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables (see below)
   - Deploy!

3. **Using Vercel Marketplace Integration**:
   - Install [Kernel from Vercel Marketplace](https://vercel.com/integrations/kernel)
   - The integration will automatically add the Kernel API key to your project
   - Manually add your Anthropic API key
   - Deploy your project

### Environment Variables

Make sure to add these environment variables in your Vercel project settings:

- `KERNEL_API_KEY` - Your Kernel API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Magnitude/Claude

## Learn More

- [Kernel Documentation](https://docs.onkernel.com)
- [Kernel Extensions API](https://www.onkernel.com/docs/browsers/extensions)
- [Magnitude Documentation](https://docs.magnitude.run)
- [Magnitude + Kernel Integration](https://docs.magnitude.run/integrations/kernel)
- [Next.js Documentation](https://nextjs.org/docs)

---

Built with [Kernel](https://dashboard.onkernel.com), [Magnitude](https://docs.magnitude.run), and [Vercel](https://vercel.com)
