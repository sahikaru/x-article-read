import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-gh-accent-blue bg-gh-accent-blue/10",
    warning: "border-gh-accent-orange bg-gh-accent-orange/10",
    error: "border-gh-accent-red bg-gh-accent-red/10",
  };

  return (
    <div className={cn("my-4 rounded-md border-l-4 p-4 text-sm", styles[type])}>
      {children}
    </div>
  );
}

function Step({
  number,
  children,
}: {
  number?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="my-3 flex gap-3">
      {number !== undefined && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gh-accent-blue/20 text-xs font-bold text-gh-accent-blue">
          {number}
        </span>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}

const mdxComponents = {
  Callout,
  Step,
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-4 mt-6 text-2xl font-bold text-gh-text" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-3 mt-5 text-xl font-semibold text-gh-text" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-2 mt-4 text-lg font-semibold text-gh-text" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-2 leading-relaxed text-gh-text-secondary" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-2 list-disc pl-6 text-gh-text-secondary" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="my-2 list-decimal pl-6 text-gh-text-secondary" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="my-1" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="my-4 border-l-4 border-gh-border pl-4 italic text-gh-text-secondary"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded bg-gh-bg px-1.5 py-0.5 text-sm text-gh-accent-blue" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-gh-accent-blue hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm text-gh-text-secondary" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="border-b border-gh-border" {...props} />
  ),
  tbody: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className="divide-y divide-gh-border" {...props} />
  ),
  tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className="hover:bg-gh-bg/50" {...props} />
  ),
  th: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th className="px-4 py-2 text-left font-semibold text-gh-text" {...props} />
  ),
  td: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td className="px-4 py-2" {...props} />
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-6 border-gh-border" {...props} />
  ),
};

export async function MdxRenderer({ source }: { source: string }) {
  return (
    <div className="prose-gh">
      <MDXRemote source={source} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
    </div>
  );
}
