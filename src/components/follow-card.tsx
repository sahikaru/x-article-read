"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/category-badge";
import { PlatformAvatar } from "./platform-avatar";
import { PlatformIcon } from "./platform-icon";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface FollowCardProps {
  id: number;
  username: string;
  displayName: string;
  platform: string;
  bio: string | null;
  categories?: Category[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function FollowCard({
  id,
  username,
  displayName,
  platform,
  bio,
  categories = [],
  onEdit,
  onDelete,
}: FollowCardProps) {
  return (
    <div className="rounded-md border border-gh-border bg-gh-bg-secondary p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="relative">
            <PlatformAvatar platform={platform} username={username} displayName={displayName} size={40} />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gh-bg-secondary">
              <PlatformIcon platform={platform} className="h-3 w-3 text-[#1d9bf0]" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gh-text">{displayName}</span>
              <span className="text-sm text-gh-text-secondary">@{username}</span>
              <span className="rounded bg-gh-border px-1.5 py-0.5 text-[10px] uppercase text-gh-text-secondary">
                {platform}
              </span>
            </div>
            {bio && (
              <p className="mt-1 text-sm text-gh-text-secondary line-clamp-2">
                {bio}
              </p>
            )}
            {categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <CategoryBadge key={cat.id} name={cat.name} color={cat.color} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(id)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(id)}>
            <Trash2 className="h-4 w-4 text-gh-accent-red" />
          </Button>
        </div>
      </div>
    </div>
  );
}
