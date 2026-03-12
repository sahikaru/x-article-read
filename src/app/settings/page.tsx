"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("claude-haiku-4-5-20251001");
  const [wechatToken, setWechatToken] = useState("");
  const [wechatCookie, setWechatCookie] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testError, setTestError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [wcSaved, setWcSaved] = useState(false);

  const allSettings = trpc.settings.getAll.useQuery();
  const setSetting = trpc.settings.set.useMutation();
  const testKey = trpc.settings.testApiKey.useMutation();

  useEffect(() => {
    if (allSettings.data && !loaded) {
      if (allSettings.data.anthropic_api_key) {
        setApiKey(allSettings.data.anthropic_api_key);
      }
      if (allSettings.data.model) {
        setModel(allSettings.data.model);
      }
      if (allSettings.data.wechat_token) {
        setWechatToken(allSettings.data.wechat_token);
      }
      if (allSettings.data.wechat_cookie) {
        setWechatCookie(allSettings.data.wechat_cookie);
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

  function handleSaveWeChatCredentials() {
    setWcSaved(false);
    Promise.all([
      setSetting.mutateAsync({ key: "wechat_token", value: wechatToken }),
      setSetting.mutateAsync({ key: "wechat_cookie", value: wechatCookie }),
    ]).then(() => {
      setWcSaved(true);
      setTimeout(() => setWcSaved(false), 3000);
    });
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

      {/* WeChat credentials */}
      <section className="space-y-4 rounded-lg border border-gh-border bg-gh-bg-secondary p-6">
        <div>
          <h2 className="text-lg font-semibold text-gh-text">
            WeChat Credentials
          </h2>
          <p className="mt-1 text-sm text-gh-text-secondary">
            Required for fetching all articles from a public account. Get these
            from{" "}
            <a
              href="https://mp.weixin.qq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gh-accent-blue hover:underline"
            >
              mp.weixin.qq.com
            </a>{" "}
            admin panel.
          </p>
        </div>

        <details className="text-sm text-gh-text-secondary">
          <summary className="cursor-pointer text-gh-accent-blue hover:underline">
            How to get token and cookie
          </summary>
          <ol className="mt-2 list-inside list-decimal space-y-1 pl-2">
            <li>
              Log in to{" "}
              <span className="text-gh-text">mp.weixin.qq.com</span> with
              your WeChat public account
            </li>
            <li>
              Copy the <span className="text-gh-text">token</span> from the
              URL bar: <code className="text-gh-accent-orange">...&token=<strong>123456789</strong>&...</code>
            </li>
            <li>
              Open DevTools (F12) → Application → Cookies
            </li>
            <li>
              Copy the full <span className="text-gh-text">Cookie</span>{" "}
              string from the request headers
            </li>
          </ol>
        </details>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gh-text-secondary">
              Token
            </label>
            <input
              type="text"
              value={wechatToken}
              onChange={(e) => setWechatToken(e.target.value)}
              placeholder="e.g. 123456789"
              className="w-full rounded-md border border-gh-border bg-gh-bg px-3 py-2 text-sm text-gh-text placeholder:text-gh-text-secondary focus:border-gh-accent-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gh-text-secondary">
              Cookie
            </label>
            <textarea
              value={wechatCookie}
              onChange={(e) => setWechatCookie(e.target.value)}
              placeholder="Paste full cookie string here..."
              rows={3}
              className="w-full rounded-md border border-gh-border bg-gh-bg px-3 py-2 text-sm text-gh-text placeholder:text-gh-text-secondary focus:border-gh-accent-blue focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveWeChatCredentials}
              disabled={!wechatToken || !wechatCookie}
            >
              Save WeChat Credentials
            </Button>
            {wcSaved && (
              <span className="flex items-center gap-1 text-xs text-gh-accent-green">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
