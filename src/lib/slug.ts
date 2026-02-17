import { customAlphabet } from "nanoid";

const shortId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

export function slugifyWorkspaceName(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${base || "workspace"}-${shortId()}`;
}
