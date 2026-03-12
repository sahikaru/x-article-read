"use client";

import { useState } from "react";
import { Search, Download, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { PlatformIcon, platformColor } from "./platform-icon";

interface AccountResult {
  fakeid: string;
  nickname: string;
  alias: string;
  roundHeadImg: string;
}

export function WeChatFetchPanel() {
  const [query, setQuery] = useState("");
  const [accounts, setAccounts] = useState<AccountResult[]>([]);
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [result, setResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const utils = trpc.useUtils();

  const searchMutation = trpc.wechat.searchAccount.useMutation({
    onSuccess(data) {
      setAccounts(data);
      if (data.length === 0) {
        setResult({ type: "error", text: "No accounts found." });
      } else {
        setResult(null);
      }
    },
    onError(err) {
      setResult({ type: "error", text: err.message });
    },
  });

  const fetchMutation = trpc.wechat.fetchAccount.useMutation({
    onSuccess(data) {
      setFetchingId(null);
      setResult({
        type: "success",
        text: `Done! ${data.saved} articles saved, ${data.skipped} skipped (already exist), ${data.total} total found.`,
      });
      utils.articles.list.invalidate();
      utils.articles.listTags.invalidate();
    },
    onError(err) {
      setFetchingId(null);
      setResult({ type: "error", text: err.message });
    },
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setAccounts([]);
    setResult(null);
    searchMutation.mutate({ query: query.trim() });
  }

  function handleFetch(account: AccountResult) {
    setFetchingId(account.fakeid);
    setResult(null);
    fetchMutation.mutate({
      fakeid: account.fakeid,
      accountName: account.nickname,
      maxArticles: 100,
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-gh-border bg-gh-bg-secondary p-5">
      <div className="flex items-center gap-2">
        <PlatformIcon
          platform="wechat"
          className={`h-5 w-5 ${platformColor("wechat")}`}
        />
        <h3 className="font-semibold text-gh-text">
          Fetch WeChat Account Articles
        </h3>
      </div>

      <p className="text-xs text-gh-text-secondary">
        Search a public account by name, then fetch all its articles.
        Requires WeChat credentials in Settings.
      </p>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gh-text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search public account name..."
            className="w-full rounded-md border border-gh-border bg-gh-bg pl-8 pr-3 py-2 text-sm text-gh-text placeholder:text-gh-text-secondary focus:border-gh-accent-blue focus:outline-none"
            disabled={searchMutation.isPending || fetchMutation.isPending}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={
            !query.trim() ||
            searchMutation.isPending ||
            fetchMutation.isPending
          }
        >
          {searchMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </form>

      {/* Account results */}
      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div
              key={account.fakeid}
              className="flex items-center gap-3 rounded-md border border-gh-border bg-gh-bg p-3"
            >
              {account.roundHeadImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={account.roundHeadImg}
                  alt={account.nickname}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gh-border text-sm font-medium">
                  {account.nickname.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gh-text">
                  {account.nickname}
                </div>
                {account.alias && (
                  <div className="text-xs text-gh-text-secondary">
                    WeChat ID: {account.alias}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFetch(account)}
                disabled={fetchMutation.isPending}
              >
                {fetchingId === account.fakeid ? (
                  <>
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download className="mr-1 h-3.5 w-3.5" />
                    Fetch Articles
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Status message */}
      {result && (
        <div
          className={`flex items-start gap-2 rounded-md p-3 text-sm ${
            result.type === "success"
              ? "bg-gh-accent-green/10 text-gh-accent-green"
              : "bg-gh-accent-red/10 text-gh-accent-red"
          }`}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{result.text}</span>
        </div>
      )}

      {/* Rate limit warning */}
      {fetchMutation.isPending && (
        <div className="flex items-center gap-2 text-xs text-gh-accent-orange">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Fetching articles with 5s delay between requests to avoid rate
          limits. This may take a while...
        </div>
      )}
    </div>
  );
}
