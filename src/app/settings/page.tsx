"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("claude-haiku-4-5-20251001");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testError, setTestError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const allSettings = trpc.settings.getAll.useQuery();
  const setSetting = trpc.settings.set.useMutation();
  const testKey = trpc.settings.testApiKey.useMutation();

  // Load saved settings on mount
  useEffect(() => {
    if (allSettings.data && !loaded) {
      if (allSettings.data.anthropic_api_key) {
        setApiKey(allSettings.data.anthropic_api_key);
      }
      if (allSettings.data.model) {
        setModel(allSettings.data.model);
      }
      setLoaded(true);
    }
  }, [allSettings.data, loaded]);

  function handleSaveApiKey() {
    setSetting.mutate({ key: "anthropic_api_key", value: apiKey });
  }

  function handleModelChange(value: string) {
    setModel(value);
    setSetting.mutate({ key: "model", value });
  }

  function handleTestApiKey() {
    setTestStatus("testing");
    setTestError("");
    testKey.mutate(
      { apiKey },
      {
        onSuccess: () => setTestStatus("success"),
        onError: (err) => {
          setTestStatus("error");
          setTestError(err.message);
        },
      }
    );
  }

  const mode = apiKey ? "Direct API" : "MCP Server";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gh-text">Settings</h1>
        <p className="mt-2 text-gh-text-secondary">
          Configure interpretation mode and preferences
        </p>
      </div>

      <section className="space-y-4 rounded-lg border border-gh-border bg-gh-bg-secondary p-6">
        <h2 className="text-lg font-semibold text-gh-text">
          Interpretation Mode
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-gh-text-secondary">Current mode:</span>
          <span
            className={
              apiKey ? "text-gh-accent-green" : "text-gh-accent-blue"
            }
          >
            {mode}
          </span>
        </div>
        <p className="text-sm text-gh-text-secondary">
          {apiKey
            ? "Using Claude API directly for interpretations."
            : "Using MCP Server mode. Configure an API key to use direct mode."}
        </p>
      </section>

      <section className="space-y-4 rounded-lg border border-gh-border bg-gh-bg-secondary p-6">
        <h2 className="text-lg font-semibold text-gh-text">API Key</h2>
        <div className="flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setTestStatus("idle");
            }}
            placeholder="sk-ant-..."
            className="flex-1 rounded-md border border-gh-border bg-gh-bg px-3 py-2 text-sm text-gh-text placeholder:text-gh-text-secondary focus:border-gh-accent-blue focus:outline-none"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? "Hide" : "Show"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveApiKey}
            disabled={setSetting.isPending}
          >
            {setSetting.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestApiKey}
            disabled={!apiKey || testStatus === "testing"}
          >
            {testStatus === "testing" ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Testing...
              </>
            ) : testStatus === "success" ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5 text-gh-accent-green" />
                Valid
              </>
            ) : testStatus === "error" ? (
              <>
                <X className="mr-1.5 h-3.5 w-3.5 text-gh-accent-red" />
                Invalid
              </>
            ) : (
              "Test"
            )}
          </Button>
        </div>
        {testStatus === "error" && testError && (
          <p className="text-xs text-gh-accent-red">{testError}</p>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-gh-border bg-gh-bg-secondary p-6">
        <h2 className="text-lg font-semibold text-gh-text">Model</h2>
        <select
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          className="rounded-md border border-gh-border bg-gh-bg px-3 py-2 text-sm text-gh-text focus:border-gh-accent-blue focus:outline-none"
        >
          <option value="claude-haiku-4-5-20251001">
            Claude Haiku 4.5 (faster, cheaper)
          </option>
          <option value="claude-sonnet-4-6-20250514">
            Claude Sonnet 4.6 (more capable)
          </option>
        </select>
      </section>
    </div>
  );
}
