import Image from "next/image";
import Link from "next/link";
import navLogo from "@/assets/jeetio-logo.png";
import { ReactNode } from "react";
import { NavText } from "../dumb/nav-text";
import { navFeatures } from "@/lib/features";

/**
 * Nav is generated from the feature registry (src/lib/features.ts), not hand-listed.
 * That is deliberate: the hand-written version pointed at two routes that never
 * existed. Add a page there, it appears here; nothing else to touch.
 */
export const PageLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="simp">
      <nav className="nav">
        <Link href="/">
          <Image src={navLogo} className="nav-logo" alt="Jeetio Logo" height="90" />
        </Link>
        <ul>
          {navFeatures().map((f) => (
            <li key={f.key}>
              <NavText href={f.href}>{f.title}</NavText>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
};
