"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Sparkles } from "lucide-react";

interface InterpretButtonProps {
  articleId: number;
}

export function InterpretButton({ articleId }: InterpretButtonProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const interpret = trpc.interpretation.interpret.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  function handleCopyCommand() {
    const command = `npm run interpret -- --id=${articleId}`;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => interpret.mutate({ articleId })}
        disabled={interpret.isPending}
      >
        {interpret.isPending ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Interpreting...
          </>
        ) : (
          <>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Interpret with AI
          </>
        )}
      </Button>
      <Button variant="ghost" size="sm" onClick={handleCopyCommand}>
        <Copy className="mr-1.5 h-3.5 w-3.5" />
        {copied ? "Copied!" : "Copy command"}
      </Button>
    </div>
  );
}
