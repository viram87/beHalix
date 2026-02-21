/** Default avatar count (1-based). Backend uses avatarId 1-8. */
export const DEFAULT_AVATAR_COUNT = 8;

/**
 * Returns URL for a default avatar by id (1-8).
 * Uses DiceBear for consistent, friendly placeholder avatars.
 */
export function getDefaultAvatarUrl(avatarId: number): string {
  const id = Math.max(1, Math.min(DEFAULT_AVATAR_COUNT, Math.floor(avatarId)));
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=behalix-${id}`;
}
