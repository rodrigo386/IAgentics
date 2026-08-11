"use client";

import { useEffect, useRef, useState } from "react";

/**
 * IMAGE MAGNIFIER
 *
 * Source: Originkit "image-magnifier" (registry), adapted. No dependencies.
 *
 * Why it earns a place: a procurement UI screenshot is dense - tables, fields,
 * categories - and at plate width none of it is readable. A lens makes the print
 * inspectable evidence instead of decoration.
 *
 * Three changes from the original, each fixing a real defect:
 *
 * 1. The original ran requestAnimationFrame forever, redrawing every frame even when
 *    idle and offscreen. Here the loop runs ONLY while the pointer is over the image;
 *    otherwise the canvas is painted once. An IntersectionObserver also stops work
 *    entirely when the plate is scrolled out of view.
 * 2. The original had no touch fallback. With no cursor the lens never appears, and a
 *    canvas is strictly worse than an image (no pinch-zoom, no long-press). Here the
 *    canvas is used only where a fine pointer with hover exists; everything else -
 *    touch, no-JS, SSR - gets a plain <img>.
 * 3. Default zoom dropped from 6x to 2.2x. Six magnifies past the point where UI text
 *    resolves; it just shows big soft pixels.
 */

export interface ImageMagnifierProps {
  src: string;
  alt: string;
  /** Magnification. 2 to 2.6 is the readable band for UI screenshots. */
  zoom?: number;
  /** Lens radius in CSS pixels. */
  lensSize?: number;
  /** Ring drawn around the lens. Ink reads well over light product UI. */
  rimColor?: string;
  rimWidth?: number;
  className?: string;
}

export function ImageMagnifier({
  src,
  alt,
  zoom = 2.2,
  lensSize = 92,
  rimColor = "#131723",
  rimWidth = 2,
  className = "",
}: ImageMagnifierProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canMagnify, setCanMagnify] = useState(false);

  // Only upgrade to the canvas where a real pointer exists. Touch, keyboard-only and
  // the server render all keep the plain image, which is the better artefact there.
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setCanMagnify(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!canMagnify) return;
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const context = canvasEl.getContext("2d");
    if (!context) return;
    // Explicit aliases: TypeScript drops the null-narrowing once these are captured by
    // the closures below, so the types are pinned here instead.
    const canvas: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = context;

    let raf = 0;
    let running = false;
    let visible = true;
    let hovering = false;
    let dpr = 1;
    let img: HTMLImageElement | null = null;
    let placed = { dx: 0, dy: 0, dw: 0, dh: 0 };
    const lens = { x: 0, y: 0 };

    function layout() {
      const cssW = canvas.clientWidth || 1;
      const cssH = canvas.clientHeight || 1;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);

      if (!img) {
        placed = { dx: 0, dy: 0, dw: canvas.width, dh: canvas.height };
        return;
      }
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      // Product screenshots are framed from the top-left, so cover from that corner.
      const scale = Math.max(canvas.width / iw, canvas.height / ih);
      placed = { dx: 0, dy: 0, dw: iw * scale, dh: ih * scale };
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!img) return;
      ctx.drawImage(img, placed.dx, placed.dy, placed.dw, placed.dh);
      if (!hovering) return;

      const lx = lens.x * dpr;
      const ly = lens.y * dpr;
      const r = lensSize * dpr;
      const z = Math.max(1, zoom);

      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        img,
        lx - (lx - placed.dx) * z,
        ly - (ly - placed.dy) * z,
        placed.dw * z,
        placed.dh * z,
      );
      ctx.restore();

      if (rimWidth <= 0) return;
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.lineWidth = rimWidth * dpr;
      ctx.strokeStyle = rimColor;
      ctx.stroke();
    }

    // The loop exists only while the lens is actually being moved.
    function loop() {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || !visible) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      draw();
    }

    function onMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      lens.x = ((e.clientX - rect.left) * canvas.clientWidth) / rect.width;
      lens.y = ((e.clientY - rect.top) * canvas.clientHeight) / rect.height;
      hovering = true;
      canvas.style.cursor = "none";
      start();
    }
    function onLeave() {
      hovering = false;
      canvas.style.cursor = "default";
      stop();
    }

    const loading = new Image();
    loading.decoding = "async";
    loading.onload = () => {
      img = loading;
      layout();
    };
    loading.src = src;

    const ro = new ResizeObserver(layout);
    ro.observe(canvas);

    // No painting at all while the plate is off screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) stop();
      },
      { rootMargin: "200px" },
    );
    io.observe(canvas);

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    layout();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [canMagnify, src, zoom, lensSize, rimColor, rimWidth]);

  if (!canMagnify) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover object-left-top ${className}`}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`${alt}. Passe o cursor para ampliar.`}
      className={`absolute inset-0 block h-full w-full ${className}`}
    />
  );
}
