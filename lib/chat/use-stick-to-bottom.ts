"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  CHAT_SCROLL_BOTTOM_THRESHOLD_PX,
  isNearScrollBottom,
} from "@/lib/chat/stick-to-bottom";

type ScrollBehaviorOption = ScrollBehavior;

export function useStickToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehaviorOption = "auto") => {
    const container = containerRef.current;
    const bottom = bottomRef.current;

    if (!container || !bottom) {
      return;
    }

    bottom.scrollIntoView({ behavior, block: "end" });

    if (behavior === "auto") {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    stickRef.current = isNearScrollBottom(
      container.scrollTop,
      container.scrollHeight,
      container.clientHeight,
      CHAT_SCROLL_BOTTOM_THRESHOLD_PX,
    );
  }, []);

  const stickToBottom = useCallback(
    (behavior: ScrollBehaviorOption = "smooth") => {
      stickRef.current = true;
      scrollToBottom(behavior);
    },
    [scrollToBottom],
  );

  const followContent = useCallback(
    (behavior: ScrollBehaviorOption = "auto") => {
      if (stickRef.current) {
        scrollToBottom(behavior);
      }
    },
    [scrollToBottom],
  );

  useEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    let rafId = 0;

    const observer = new ResizeObserver(() => {
      if (!stickRef.current) {
        return;
      }

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
    });

    observer.observe(content);
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [scrollToBottom]);

  return {
    containerRef,
    contentRef,
    bottomRef,
    handleScroll,
    stickToBottom,
    followContent,
  };
}
