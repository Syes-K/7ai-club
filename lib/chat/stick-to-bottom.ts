/** Distance from the bottom (px) still treated as "at bottom". */
export const CHAT_SCROLL_BOTTOM_THRESHOLD_PX = 80;

export function isNearScrollBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  threshold = CHAT_SCROLL_BOTTOM_THRESHOLD_PX,
): boolean {
  return scrollHeight - scrollTop - clientHeight <= threshold;
}
