import React, { useEffect, useRef } from 'react';
import useStore from '../../store/useStore';
import './CustomCursor.css';

const INTERACTIVE_SELECTOR = '[data-interactive], a, button, input, textarea';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const { cursorVariant } = useStore();

  // Smooth follower effect + dynamic interactive element detection
  useEffect(() => {
    let mouse = { x: -100, y: -100 };
    let ring = { x: -100, y: -100 };
    let rafId;

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
      }
    };

    const animate = () => {
      // Ring lags behind dot for smooth trail effect
      ring.x += (mouse.x - ring.x) * 0.12;
      ring.y += (mouse.y - ring.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.x}px, ${ring.y}px)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(animate);

    // Cursor variant handlers
    const onEnter = () => useStore.getState().setCursorVariant('hover');
    const onLeave = () => useStore.getState().setCursorVariant('default');

    // Attach listeners to an element
    const attachListeners = (el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    };
    // Detach listeners from an element
    const detachListeners = (el) => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };

    // Initial attachment
    const tracked = new Set();
    document.querySelectorAll(INTERACTIVE_SELECTOR).forEach((el) => {
      attachListeners(el);
      tracked.add(el);
    });

    // Watch for dynamically added elements
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue; // skip text nodes
          // Check the node itself
          if (node.matches?.(INTERACTIVE_SELECTOR) && !tracked.has(node)) {
            attachListeners(node);
            tracked.add(node);
          }
          // Check children
          node.querySelectorAll?.(INTERACTIVE_SELECTOR).forEach((child) => {
            if (!tracked.has(child)) {
              attachListeners(child);
              tracked.add(child);
            }
          });
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
      observer.disconnect();
      tracked.forEach(detachListeners);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className={`cursor-dot cursor-dot--${cursorVariant}`}
        aria-hidden="true"
      />
      <div
        ref={ringRef}
        className={`cursor-ring cursor-ring--${cursorVariant}`}
        aria-hidden="true"
      />
    </>
  );
}

