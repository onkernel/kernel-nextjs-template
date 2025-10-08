"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface BrowserSession {
  sessionId: string;
  liveViewUrl: string;
  cdpWsUrl: string;
  spinUpTime: number;
}

interface AutomationResult {
  success: boolean;
  title?: string;
  url?: string;
  executionTime?: number;
  timestamp: number;
  error?: string;
  details?: string;
}

export default function HomePage() {
  const [creatingBrowser, setCreatingBrowser] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [browserSession, setBrowserSession] = useState<BrowserSession | null>(
    null
  );
  const [automationResults, setAutomationResults] = useState<
    AutomationResult[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState("https://onkernel.com");

  const createBrowser = async () => {
    setCreatingBrowser(true);
    setError(null);

    try {
      const response = await fetch("/api/create-browser", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setBrowserSession({
          sessionId: data.sessionId,
          liveViewUrl: data.liveViewUrl,
          cdpWsUrl: data.cdpWsUrl,
          spinUpTime: data.spinUpTime,
        });
      } else {
        setError(data.error || "Failed to create browser");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to API"
      );
    } finally {
      setCreatingBrowser(false);
    }
  };

  const runAutomation = async () => {
    if (!browserSession) return;

    setRunningAutomation(true);

    try {
      const response = await fetch("/api/run-automation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cdpWsUrl: browserSession.cdpWsUrl,
          url: targetUrl,
        }),
      });

      const data = await response.json();

      const result: AutomationResult = {
        ...data,
        timestamp: Date.now(),
      };

      setAutomationResults((prev) => [result, ...prev]);
    } catch (err) {
      const result: AutomationResult = {
        success: false,
        error: "Failed to run automation",
        details: err instanceof Error ? err.message : String(err),
        timestamp: Date.now(),
      };
      setAutomationResults((prev) => [result, ...prev]);
    } finally {
      setRunningAutomation(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            <Image
              src="/kernel-logo.svg"
              alt="Kernel"
              width={120}
              height={23}
              priority
            />
            <span className="text-xl text-muted-foreground">X</span>
            <Image
              src="/vercel-logo.svg"
              alt="Vercel"
              width={120}
              height={23}
              priority
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 lg:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8 text-center">
            {/* Hero Section */}
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-balance">
                Browser Automation with Kernel
              </h2>
              <p className="text-lg text-muted-foreground text-balance">
                See how fast Kernel browsers spin up, then watch live as
                Playwright navigates to any URL in the cloud.
              </p>
            </div>

            {/* Step 1: Create Browser */}
            {!browserSession && (
              <div>
                <Button
                  size="lg"
                  onClick={createBrowser}
                  disabled={creatingBrowser}
                  className="text-lg px-8 py-6"
                >
                  {creatingBrowser ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Browser...
                    </>
                  ) : (
                    "Create Browser"
                  )}
                </Button>
              </div>
            )}

            {/* Error Display */}
            {error && !browserSession && (
              <Card className="text-left">
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold">Error</span>
                    </div>
                    <p className="font-mono text-sm text-red-600">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live View and Automation Controls */}
            {browserSession && (
              <div className="space-y-6">
                {/* Live View */}
                <Card>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">Browser Live View</span>
                      </div>
                      <div className="rounded-lg overflow-hidden border bg-black aspect-video">
                        <iframe
                          src={browserSession.liveViewUrl}
                          className="w-full h-full"
                          allow="camera; microphone; display-capture"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-left text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Browser Spin-Up Time
                          </p>
                          <p className="font-mono font-semibold">
                            {browserSession.spinUpTime}ms
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Session ID</p>
                          <p className="font-mono font-semibold">
                            {browserSession.sessionId}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2: Run Automation */}
                <Card>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2 text-left">
                        <label
                          htmlFor="target-url"
                          className="text-sm font-medium"
                        >
                          Target URL
                        </label>
                        <Input
                          id="target-url"
                          type="url"
                          value={targetUrl}
                          onChange={(e) => setTargetUrl(e.target.value)}
                          placeholder="https://onkernel.com"
                          disabled={runningAutomation}
                        />
                      </div>
                      <Button
                        size="lg"
                        onClick={runAutomation}
                        disabled={runningAutomation}
                        className="w-full text-lg py-6"
                      >
                        {runningAutomation ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Running Automation...
                          </>
                        ) : (
                          "Run Automation"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Automation Results */}
                {automationResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-left">
                      Automation Results
                    </h3>
                    {automationResults.map((result, index) => (
                      <Card key={result.timestamp} className="text-left">
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {result.success ? (
                                  <>
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="font-semibold">
                                      Run #{automationResults.length - index}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="font-semibold">
                                      Run #{automationResults.length - index}{" "}
                                      Failed
                                    </span>
                                  </>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(result.timestamp).toLocaleTimeString()}
                              </span>
                            </div>

                            {result.success ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <span className="text-sm text-muted-foreground">
                                      Execution Time:
                                    </span>
                                    <p className="font-mono text-lg font-bold">
                                      {result.executionTime}ms
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    URL:
                                  </span>
                                  <p className="font-mono text-sm">
                                    {result.url}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    Page Title:
                                  </span>
                                  <p className="font-mono text-sm">
                                    {result.title}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm text-muted-foreground">
                                    Error:
                                  </span>
                                  <p className="font-mono text-sm text-red-600">
                                    {result.error}
                                  </p>
                                </div>
                                {result.details && (
                                  <div>
                                    <span className="text-sm text-muted-foreground">
                                      Details:
                                    </span>
                                    <p className="font-mono text-sm text-muted-foreground">
                                      {result.details}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">1.</div>
                    <h3 className="font-semibold">Create Browser</h3>
                    <p className="text-sm text-muted-foreground">
                      Kernel provisions a cloud browser instance
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">2.</div>
                    <h3 className="font-semibold">Connect Playwright</h3>
                    <p className="text-sm text-muted-foreground">
                      Use CDP to connect Playwright to the browser
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">3.</div>
                    <h3 className="font-semibold">Run Script</h3>
                    <p className="text-sm text-muted-foreground">
                      Execute your automation and get results
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>
            Powered by{" "}
            <a
              href="https://onkernel.com"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Kernel
            </a>{" "}
            and{" "}
            <a
              href="https://vercel.com"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
