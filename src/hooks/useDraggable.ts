import { useCallback, useEffect, useRef, useState } from "react";

type Point = { left: number; top: number };

type UseDraggableOptions = {
  elementWidth?: number;
  elementHeight?: number;
  margin?: number;
};

type UseDraggableResult = {
  dragRef: React.RefObject<HTMLElement | null>;
  position: Point | null;
  setPosition: (pt: Point) => void;
};

export default function useDraggable(
  options?: UseDraggableOptions
): UseDraggableResult {
  const { elementWidth = 200, elementHeight = 200, margin = 8 } = options || {};

  const dragRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState<Point | null>(null);
  const dragStateRef = useRef<null | {
    startX: number;
    startY: number;
    baseLeft: number;
    baseTop: number;
  }>(null);

  const clamp = useCallback(
    (pt: Point): Point => {
      const maxLeft = window.innerWidth - (elementWidth - margin);
      const maxTop = window.innerHeight - (elementHeight - margin);
      const left = Math.min(
        Math.max(margin, pt.left),
        Math.max(margin, maxLeft)
      );
      const top = Math.min(Math.max(margin, pt.top), Math.max(margin, maxTop));
      return { left, top };
    },
    [elementWidth, elementHeight, margin]
  );

  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      if (!position) return;
      dragStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        baseLeft: position.left,
        baseTop: position.top,
      };
      e.preventDefault();
    };
    const onTouchStart = (e: TouchEvent) => {
      if (!position) return;
      const t = e.touches[0];
      if (!t) return;
      dragStateRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        baseLeft: position.left,
        baseTop: position.top,
      };
      e.preventDefault();
    };
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("touchstart", onTouchStart);
    };
  }, [position]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;
      setPosition(clamp({ left: ds.baseLeft + dx, top: ds.baseTop + dy }));
    };
    const onTouchMove = (e: TouchEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - ds.startX;
      const dy = t.clientY - ds.startY;
      setPosition(clamp({ left: ds.baseLeft + dx, top: ds.baseTop + dy }));
      e.preventDefault();
    };
    const end = () => {
      dragStateRef.current = null;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", end, { once: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", end, { once: false });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", end);
    };
  }, [clamp]);

  return { dragRef, position, setPosition };
}
