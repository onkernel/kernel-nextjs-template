# Kernel + Vercel Template

Next.js + Kernel template for running AI-powered browser automations with natural language on Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fonkernel%2Fkernel-nextjs-template&env=OPENAI_API_KEY&project-name=kernel-nextjs-template&repository-name=kernel-nextjs-template&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22kernel%22%2C%22productSlug%22%3A%22kernel%22%2C%22protocol%22%3A%22other%22%7D%5D)


## Overview

This template shows how to:

- Create serverless browsers with live view using the Kernel SDK
- Describe browser tasks in natural language
- Use an AI agent to execute browser automation code via AI SDK tools in Next.js API routes
- Display live browser view and automation results in a modern Next.js UI

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **AI**: Vercel AI SDK with OpenAI GPT-5.1
- **Browser Automation**: Kernel SDK + Kernel AI SDK (`@onkernel/ai-sdk`)
- **Package Manager**: Bun
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh) (package manager)
- A Kernel account and API key
- An OpenAI API key
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

   Add your API keys:

   ```
   KERNEL_API_KEY=your_kernel_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. **Run the development server**:

   ```bash
   bun dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. **Create Browser**: Click "Create Browser" to provision a serverless Kernel browser with live view capabilities
2. **Describe Your Task**: Enter what you want the browser to do in natural language (e.g., "Go to Hacker News and get the top article title")
3. **Watch AI Execute**: The AI agent interprets your task and uses Kernel's AI SDK-compatible browser automation tool to execute it in real-time
4. **View Results**: See the agent's response, step count, and click "View Steps" to inspect the generated code and execution details

## Code Structure

```
app/
├── api/
│   ├── agent/
│   │   └── route.ts          # AI agent endpoint with browser automation tool
│   ├── create-browser/
│   │   └── route.ts          # Creates a serverless Kernel browser
│   └── delete-browser/
│       └── route.ts          # Closes browser session
├── page.tsx                  # Main UI with live view and controls
├── layout.tsx                # Root layout
└── globals.css               # Global styles

components/
├── Header.tsx                # App header with branding
├── StepsOverlay.tsx          # Modal showing agent execution steps
└── ui/                       # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── textarea.tsx
    └── ...

lib/
└── utils.ts                  # Utility functions
```

### Key Code Example

**Step 1: Create Browser** (`app/api/create-browser/route.ts`)

```typescript
import { Kernel } from "@onkernel/sdk";

// Initialize Kernel client
const kernel = new Kernel({ apiKey: process.env.KERNEL_API_KEY });

// Create a serverless browser with live view
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

**Step 2: Run AI Agent** (`app/api/agent/route.ts`)

```typescript
import { openai } from "@ai-sdk/openai";
import { playwrightExecuteTool } from "@onkernel/ai-sdk";
import { Kernel } from "@onkernel/sdk";
import { Experimental_Agent as Agent, stepCountIs } from "ai";

// Initialize Kernel instance
const kernel = new Kernel({ apiKey: process.env.KERNEL_API_KEY });

// Initialize the AI agent with GPT-5.1 and Kernel's AI SDK-compatible browser automation tool
const agent = new Agent({
  model: openai("gpt-5.1"),
  tools: {
    playwright_execute: playwrightExecuteTool({
      client: kernel,
      sessionId: sessionId,
    }),
  },
  stopWhen: stepCountIs(20),
  system: `You are a browser automation expert with access to a Playwright execution tool...`,
});

// Execute the agent with the user's task
const { text, steps } = await agent.generate({
  prompt: task, // e.g., "Go to news.ycombinator.com and get the first article title"
});
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**

2. **Connect to Vercel**:

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add your environment variables (`KERNEL_API_KEY` and `OPENAI_API_KEY`)
   - Deploy!

3. **Using Vercel Marketplace Integration**:
   - Install [Kernel from Vercel Marketplace](https://vercel.com/integrations/kernel)
   - The integration will automatically add the Kernel API key to your project
   - Add your `OPENAI_API_KEY` manually
   - Deploy your project

### Environment Variables

Make sure to add these environment variables in your Vercel project settings:

- `KERNEL_API_KEY` - Your Kernel API key
- `OPENAI_API_KEY` - Your OpenAI API key

## Learn More

- [Kernel Documentation](https://docs.onkernel.com)
- [Kernel AI SDK](https://www.onkernel.com/docs/integrations/vercel/ai-sdk)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

Built with [Kernel](https://dashboard.onkernel.com), [Vercel AI SDK](https://sdk.vercel.ai), and [Vercel](https://vercel.com)
