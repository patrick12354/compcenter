"use client";

import { useEffect } from "react";

export default function CursorEffects() {
  useEffect(() => {
    const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!supportsFinePointer || prefersReducedMotion) {
      return undefined;
    }

    const root = document.documentElement;
    const cursorCore = document.querySelector("[data-cursor-core]");
    const cursorRing = document.querySelector("[data-cursor-ring]");
    const liquidBlob = document.querySelector("[data-liquid-blob]");
    const liquidHalo = document.querySelector("[data-liquid-halo]");

    if (!cursorCore || !cursorRing || !liquidBlob || !liquidHalo) {
      return undefined;
    }

    root.classList.add("has-fancy-cursor");

    const pointer = {
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      currentX: window.innerWidth / 2,
      currentY: window.innerHeight / 2,
      ringX: window.innerWidth / 2,
      ringY: window.innerHeight / 2,
      blobX: window.innerWidth / 2,
      blobY: window.innerHeight / 2
    };

    let rafId = 0;

    function setInteractiveState(isActive) {
      root.classList.toggle("cursor-hover", isActive);
    }

    function handlePointerMove(event) {
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      root.classList.add("cursor-visible");
    }

    function handlePointerLeave() {
      root.classList.remove("cursor-visible");
      setInteractiveState(false);
    }

    function handlePointerOver(event) {
      const interactiveElement = event.target.closest(
        "a, button, input, select, textarea, [role='button'], summary"
      );
      setInteractiveState(Boolean(interactiveElement));
    }

    function animate() {
      pointer.currentX += (pointer.targetX - pointer.currentX) * 0.38;
      pointer.currentY += (pointer.targetY - pointer.currentY) * 0.38;
      pointer.ringX += (pointer.targetX - pointer.ringX) * 0.18;
      pointer.ringY += (pointer.targetY - pointer.ringY) * 0.18;
      pointer.blobX += (pointer.targetX - pointer.blobX) * 0.08;
      pointer.blobY += (pointer.targetY - pointer.blobY) * 0.08;

      cursorCore.style.transform = `translate3d(${pointer.currentX}px, ${pointer.currentY}px, 0)`;
      cursorRing.style.transform = `translate3d(${pointer.ringX}px, ${pointer.ringY}px, 0)`;
      liquidBlob.style.transform = `translate3d(${pointer.blobX}px, ${pointer.blobY}px, 0)`;
      liquidHalo.style.transform = `translate3d(${pointer.blobX}px, ${pointer.blobY}px, 0)`;

      rafId = window.requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mouseover", handlePointerOver, { passive: true });
    window.addEventListener("mouseout", handlePointerOver, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);

    animate();

    return () => {
      root.classList.remove("has-fancy-cursor", "cursor-visible", "cursor-hover");
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseover", handlePointerOver);
      window.removeEventListener("mouseout", handlePointerOver);
      document.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, []);

  return (
    <>
      <div className="liquid-layer" aria-hidden="true">
        <div className="liquid-halo" data-liquid-halo />
        <div className="liquid-blob" data-liquid-blob />
      </div>
      <div className="cursor-ring" data-cursor-ring aria-hidden="true" />
      <div className="cursor-core" data-cursor-core aria-hidden="true" />
    </>
  );
}
