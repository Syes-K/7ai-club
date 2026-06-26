import { describe, expect, it } from "vitest";
import {
  CHAT_SCROLL_BOTTOM_THRESHOLD_PX,
  isNearScrollBottom,
} from "@/lib/chat/stick-to-bottom";

describe("isNearScrollBottom", () => {
  it("returns true when scrolled to the bottom", () => {
    expect(isNearScrollBottom(900, 1000, 100)).toBe(true);
  });

  it("returns true within the threshold above the bottom", () => {
    expect(
      isNearScrollBottom(
        900 - CHAT_SCROLL_BOTTOM_THRESHOLD_PX,
        1000,
        100,
      ),
    ).toBe(true);
  });

  it("returns false when scrolled away from the bottom", () => {
    expect(
      isNearScrollBottom(
        900 - CHAT_SCROLL_BOTTOM_THRESHOLD_PX - 1,
        1000,
        100,
      ),
    ).toBe(false);
  });
});
