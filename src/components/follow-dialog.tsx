"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface FollowDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    username: string;
    displayName: string;
    platform: "twitter" | "wechat";
    bio?: string;
    categoryIds: number[];
  }) => void;
  categories: Category[];
  initial?: {
    username: string;
    displayName: string;
    platform: "twitter" | "wechat";
    bio?: string | null;
    categoryIds?: number[];
  };
  title: string;
}

export function FollowDialog({
  open,
  onClose,
  onSubmit,
  categories,
  initial,
  title,
}: FollowDialogProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [platform, setPlatform] = useState<"twitter" | "wechat">("twitter");
  const [bio, setBio] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  useEffect(() => {
    if (initial) {
      setUsername(initial.username);
      setDisplayName(initial.displayName);
      setPlatform(initial.platform);
      setBio(initial.bio ?? "");
      setSelectedCategoryIds(initial.categoryIds ?? []);
    } else {
      setUsername("");
      setDisplayName("");
      setPlatform("twitter");
      setBio("");
      setSelectedCategoryIds([]);
    }
  }, [initial, open]);

  if (!open) return null;

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      username,
      displayName,
      platform,
      bio: bio || undefined,
      categoryIds: selectedCategoryIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg border border-gh-border bg-gh-bg-secondary p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gh-text">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gh-text-secondary">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              required
              className="w-full rounded-md border border-gh-border bg-gh-bg px-3 py-2 text-sm text-gh-text placeholder:text-gh-text-secondary focus:border-gh-accent-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gh-text-secondary">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display Name"
              required
              className="w-full rounded-md border border-gh-border bg-gh-bg px-3 py-2 text-sm text-gh-text placeholder:text-gh-text-secondary focus:border-gh-accent-blue focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gh-text-secondary">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Optional bio"
              rows={2}
              className="w-full rounded-md border border-gh-border bg-gh-bg px-3 py-2 text-sm text-gh-text placeholder:text-gh-text-secondary focus:border-gh-accent-blue focus:outline-none"
            />
          </div>

          {categories.length > 0 && (
            <div>
              <label className="mb-2 block text-sm text-gh-text-secondary">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedCategoryIds.includes(cat.id)
                        ? "ring-2 ring-offset-1 ring-offset-gh-bg-secondary"
                        : "opacity-50 hover:opacity-75"
                    }`}
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                      borderColor: cat.color,
                      outlineColor: cat.color,
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initial ? "Update" : "Add Follow"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
