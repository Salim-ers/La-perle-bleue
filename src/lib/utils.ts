export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Vrai si la valeur est une donnée réelle (ni vide, ni TODO_CONTENT). */
export function isFilled(value: string | null | undefined): value is string {
  return !!value && value.trim() !== "" && !value.startsWith("TODO");
}
