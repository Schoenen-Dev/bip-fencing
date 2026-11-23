// Phone / browser Back closes the screen opened inside a page
// (customer detail, bill view, employee view…) instead of leaving the page.
import { useEffect, useRef } from "react";

const stack = [];
let ignore = 0;
let bound = false;

function onPop() {
  if (ignore > 0) { ignore--; return; }
  const top = stack.pop();
  if (top) top.close();
}

export function useBackClose(open, close) {
  const ref = useRef(close);
  ref.current = close;
  useEffect(() => {
    if (!open) return undefined;
    if (!bound) { window.addEventListener("popstate", onPop); bound = true; }
    const entry = { close: () => ref.current() };
    stack.push(entry);
    window.history.pushState({ bipInner: true }, "");
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) {
        // closed with the on-screen button → drop the extra history step
        stack.splice(i, 1);
        ignore++;
        window.history.back();
      }
    };
  }, [open]);
}
