"use client";

import Image from "next/image";
import { useState } from "react";

function getAvatarUrl(platform: string, username: string): string {
  if (platform === "twitter") {
    return `https://unavatar.io/twitter/${username}`;
  }
  // Future: wechat or other platforms
  return "";
}

interface PlatformAvatarProps {
  platform: string;
  username: string;
  displayName: string;
  size?: number;
  className?: string;
}

export function PlatformAvatar({
  platform,
  username,
  displayName,
  size = 24,
  className = "",
}: PlatformAvatarProps) {
  const [error, setError] = useState(false);
  const avatarUrl = getAvatarUrl(platform, username);

  if (!avatarUrl || error) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-gh-border font-medium ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {displayName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={avatarUrl}
      alt={displayName}
      width={size}
      height={size}
      className={`shrink-0 rounded-full ${className}`}
      onError={() => setError(true)}
      unoptimized
    />
  );
}
