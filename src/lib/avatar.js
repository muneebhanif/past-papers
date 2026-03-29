export function cartoonAvatar(seed) {
  const normalized = String(seed || "student").trim().toLowerCase();
  const safeSeed = encodeURIComponent(normalized || "student");
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${safeSeed}`;
}
