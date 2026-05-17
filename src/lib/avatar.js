export function cartoonAvatar(seed) {
  const normalized = String(seed || "student").trim().toLowerCase();
  const safeSeed = encodeURIComponent(normalized || "student");
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${safeSeed}`;
}

/**
 * Returns the user's real Google profile picture if available,
 * otherwise falls back to a generated cartoon avatar.
 */
export function userAvatar(imageUrl, seed) {
  if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("http")) {
    return imageUrl;
  }
  return cartoonAvatar(seed);
}
