/**
 * Flying-element animation layer.
 *
 * We clone a source DOM node, pin the clone to a fixed-position overlay at the
 * source's screen rect, then animate it to the target's rect with the Web
 * Animations API. State updates can proceed immediately — the clone is
 * independent of React's tree.
 */

let overlay: HTMLDivElement | null = null;

function getOverlay(): HTMLDivElement {
  if (!overlay || !document.body.contains(overlay)) {
    overlay = document.createElement('div');
    overlay.className = 'fly-overlay';
    document.body.appendChild(overlay);
  }
  return overlay;
}

export interface FlyOptions {
  duration?: number;
  delay?: number;
  scale?: number; // final scale relative to source
  arc?: number; // vertical arc lift in px
  fadeOut?: boolean;
}

/** Rect for an element carrying the given data-fly-target id. */
export function targetRect(targetId: string): DOMRect | null {
  const el = document.querySelector(`[data-fly-target="${targetId}"]`);
  return el ? el.getBoundingClientRect() : null;
}

/** Fly a visual clone of `source` to the element marked with `targetId`. */
export function flyClone(source: Element | null, targetId: string, opts: FlyOptions = {}): void {
  if (!source) return;
  const to = targetRect(targetId);
  if (!to) return;
  const from = source.getBoundingClientRect();
  if (from.width === 0) return;

  const { duration = 620, delay = 0, scale = 0.9, arc = 40, fadeOut = false } = opts;

  const clone = source.cloneNode(true) as HTMLElement;
  clone.classList.add('fly-clone');
  clone.style.width = `${from.width}px`;
  clone.style.height = `${from.height}px`;
  clone.style.left = `${from.left}px`;
  clone.style.top = `${from.top}px`;
  getOverlay().appendChild(clone);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  const anim = clone.animate(
    [
      { transform: 'translate(0px, 0px) scale(1)', opacity: 1, offset: 0 },
      {
        transform: `translate(${dx * 0.5}px, ${dy * 0.5 - arc}px) scale(${(1 + scale) / 2})`,
        opacity: 1,
        offset: 0.55,
      },
      {
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        opacity: fadeOut ? 0 : 0.95,
        offset: 1,
      },
    ],
    { duration, delay, easing: 'cubic-bezier(0.22, 0.9, 0.32, 1)', fill: 'forwards' },
  );
  anim.onfinish = () => clone.remove();
  // Safety net in case onfinish never fires (tab hidden etc.).
  window.setTimeout(() => clone.remove(), delay + duration + 500);
}

/** Fly several clones of the same source with a stagger. */
export function flyCloneMany(
  source: Element | null,
  targetId: string,
  n: number,
  opts: FlyOptions = {},
): void {
  for (let i = 0; i < n; i++) {
    flyClone(source, targetId, { ...opts, delay: (opts.delay ?? 0) + i * 110 });
  }
}

/** Briefly pulse an element (e.g. a panel receiving something). */
export function pulse(targetId: string): void {
  const el = document.querySelector(`[data-fly-target="${targetId}"]`);
  if (!el) return;
  el.animate(
    [
      { transform: 'scale(1)', filter: 'brightness(1)' },
      { transform: 'scale(1.04)', filter: 'brightness(1.35)' },
      { transform: 'scale(1)', filter: 'brightness(1)' },
    ],
    { duration: 500, easing: 'ease-out' },
  );
}
