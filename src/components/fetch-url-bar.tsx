"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

export function FetchUrlBar() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const fetchMutation = trpc.articles.fetchUrl.useMutation({
    onSuccess(data) {
      if (data.duplicate) {
        setMessage({ type: "error", text: "Article already exists." });
      } else {
        setMessage({ type: "success", text: "Article fetched!" });
        setUrl("");
        utils.articles.list.invalidate();
        utils.articles.listTags.invalidate();
      }
      setTimeout(() => setMessage(null), 3000);
    },
    onError(err) {
      setMessage({ type: "error", text: err.message });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    fetchMutation.mutate({ url: trimmed });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a Twitter or WeChat article URL..."
          className="w-full rounded-md border border-gh-border bg-gh-bg px-3 py-2 text-sm text-gh-text placeholder:text-gh-text-secondary focus:border-gh-accent-blue focus:outline-none"
          disabled={fetchMutation.isPending}
        />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={fetchMutation.isPending || !url.trim()}
      >
        {fetchMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Fetch
      </Button>
      {message && (
        <span
          className={`text-xs ${
            message.type === "success"
              ? "text-gh-accent-green"
              : "text-gh-accent-red"
          }`}
        >
          {message.text}
        </span>
      )}
    </form>
  );
}
