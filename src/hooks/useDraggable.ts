import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const positionRef = useRef<Point | null>(null);
  const dragStateRef = useRef<null | {
    startX: number;
    startY: number;
    baseLeft: number;
    baseTop: number;
  }>(null);

  // 同步 position 到 ref
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // 记忆 position 是否已设置
  const hasPosition = useMemo(() => position !== null, [position]);

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
    if (!el || !positionRef.current) return;

    const onMouseDown = (e: MouseEvent) => {
      const currentPosition = positionRef.current;
      if (!currentPosition) return;
      dragStateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        baseLeft: currentPosition.left,
        baseTop: currentPosition.top,
      };
      e.preventDefault();
    };
    const onTouchStart = (e: TouchEvent) => {
      const currentPosition = positionRef.current;
      if (!currentPosition) return;
      const t = e.touches[0];
      if (!t) return;
      dragStateRef.current = {
        startX: t.clientX,
        startY: t.clientY,
        baseLeft: currentPosition.left,
        baseTop: currentPosition.top,
      };
      e.preventDefault();
    };
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("touchstart", onTouchStart);
    };
  }, [hasPosition]); // 依赖 position 是否存在，而非具体值

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
    const onMouseUp = () => {
      dragStateRef.current = null;
    };
    const onTouchEnd = () => {
      dragStateRef.current = null;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [clamp]);

  return { dragRef, position, setPosition };
}
