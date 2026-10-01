/** Blocage du défilement de la page, compté : plusieurs panneaux peuvent se superposer. */
let locks = 0;

export function lockScroll() {
  locks += 1;
  if (locks === 1) document.documentElement.style.overflow = "hidden";
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) document.documentElement.style.overflow = "";
  };
}
