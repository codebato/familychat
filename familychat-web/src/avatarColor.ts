const PALETTE = ["#e8a33d", "#7fa687", "#7c9fe0", "#d98a8a", "#c9a4e0", "#e0b878"];

export function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}