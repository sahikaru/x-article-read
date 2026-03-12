"use client";

import { useState } from "react";
import { Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";

const DEFAULT_COLORS = [
  "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316",
];

export function CategoryManager() {
  const utils = trpc.useUtils();
  const { data: categories = [] } = trpc.categories.list.useQuery();
  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => utils.categories.list.invalidate(),
  });
  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => utils.categories.list.invalidate(),
  });

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    createMutation.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: () => {
          setNewName("");
          setAdding(false);
        },
      }
    );
  };

  return (
    <div className="rounded-md border border-gh-border bg-gh-bg-secondary p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gh-text">Categories</h3>
        <Button variant="ghost" size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {adding && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="flex-1 rounded-md border border-gh-border bg-gh-bg px-2 py-1 text-sm text-gh-text placeholder:text-gh-text-secondary focus:border-gh-accent-blue focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <select
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="rounded-md border border-gh-border bg-gh-bg px-2 py-1 text-sm text-gh-text"
          >
            {DEFAULT_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button variant="ghost" size="icon" onClick={handleAdd}>
            <Check className="h-4 w-4 text-gh-accent-green" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setAdding(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="mt-3 space-y-1">
        {categories.length === 0 && (
          <p className="text-sm text-gh-text-secondary">No categories yet.</p>
        )}
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gh-bg"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm text-gh-text">{cat.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => deleteMutation.mutate({ id: cat.id })}
            >
              <Trash2 className="h-3.5 w-3.5 text-gh-accent-red" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
