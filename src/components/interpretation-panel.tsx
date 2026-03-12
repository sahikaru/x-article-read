import { MdxRenderer } from "./mdx-renderer";
import { InterpretButton } from "./interpret-button";
import { Sparkles } from "lucide-react";

interface InterpretationPanelProps {
  interpretation: string | null;
  articleId: number;
}

export function InterpretationPanel({
  interpretation,
  articleId,
}: InterpretationPanelProps) {
  if (interpretation) {
    return (
      <section className="rounded-md border border-gh-border bg-gh-bg-secondary p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gh-text">
          <Sparkles className="h-5 w-5 text-gh-accent-blue" />
          AI Interpretation
        </h2>
        <MdxRenderer source={interpretation} />
      </section>
    );
  }

  return (
    <section className="rounded-md border border-dashed border-gh-border bg-gh-bg-secondary p-6 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-gh-text-secondary" />
      <p className="mt-2 text-sm text-gh-text-secondary">
        No interpretation yet
      </p>
      <InterpretButton articleId={articleId} />
    </section>
  );
}
