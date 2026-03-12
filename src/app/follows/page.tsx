"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { FollowCard } from "@/components/follow-card";
import { FollowDialog } from "@/components/follow-dialog";
import { CategoryManager } from "@/components/category-manager";
import { WeChatFetchPanel } from "@/components/wechat-fetch-panel";

export default function FollowsPage() {
  const utils = trpc.useUtils();
  const { data: follows = [], isLoading } = trpc.follows.list.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();

  const createMutation = trpc.follows.create.useMutation({
    onSuccess: () => {
      utils.follows.list.invalidate();
      setDialogOpen(false);
    },
  });
  const updateMutation = trpc.follows.update.useMutation({
    onSuccess: () => {
      utils.follows.list.invalidate();
      setDialogOpen(false);
    },
  });
  const deleteMutation = trpc.follows.delete.useMutation({
    onSuccess: () => utils.follows.list.invalidate(),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const editingFollow = editingId
    ? follows.find((f) => f.id === editingId)
    : null;

  const handleEdit = (id: number) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const handleSubmit = (data: {
    username: string;
    displayName: string;
    platform: "twitter" | "wechat";
    bio?: string;
    categoryIds: number[];
  }) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gh-text">Follows</h1>
          <p className="mt-1 text-sm text-gh-text-secondary">
            Manage followed accounts
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Follow
        </Button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
        {/* Follows list */}
        <div className="space-y-3">
          {isLoading && (
            <div className="py-12 text-center text-gh-text-secondary">
              Loading follows...
            </div>
          )}
          {!isLoading && follows.length === 0 && (
            <div className="py-12 text-center text-gh-text-secondary">
              No follows yet. Add someone to get started.
            </div>
          )}
          {follows.map((follow) => (
            <FollowCard
              key={follow.id}
              id={follow.id}
              username={follow.username}
              displayName={follow.displayName}
              platform={follow.platform}
              bio={follow.bio}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Sidebar: categories + WeChat fetch */}
        <div className="space-y-6">
          <WeChatFetchPanel />
          <CategoryManager />
        </div>
      </div>

      <FollowDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingId(null);
        }}
        onSubmit={handleSubmit}
        categories={categories}
        title={editingId ? "Edit Follow" : "Add Follow"}
        initial={
          editingFollow
            ? {
                username: editingFollow.username,
                displayName: editingFollow.displayName,
                platform: editingFollow.platform as "twitter" | "wechat",
                bio: editingFollow.bio,
              }
            : undefined
        }
      />
    </div>
  );
}
