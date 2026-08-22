"use client";
import { NavText } from "./nav-text";
import { useStoredKey } from "@/lib/useStoredKey";

/**
 * META LAB nav entry — only rendered for browsers that already hold a Meta Lab
 * passcode. Everyone else never sees the link; /meta-lab stays reachable by URL
 * (and by the 👑 in the footer), so this hides clutter, not the page.
 */
export const MetaLabNav = () => {
  const [key] = useStoredKey("meta-lab:key");

  if (!key) return null;

  return (
    <li>
      <NavText href="/meta-lab">Meta Lab</NavText>
    </li>
  );
};
