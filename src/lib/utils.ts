export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Vrai si la valeur est une donnée réelle (ni vide, ni TODO_CONTENT). */
export function isFilled(value: string | null | undefined): value is string {
  return !!value && value.trim() !== "" && !value.startsWith("TODO");
}

/** "Œuf à la crème" -> "oeuf-a-la-creme" */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
