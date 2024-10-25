import Image from "next/image";
import navLogo from "@/assets/jeetio-logo.png";
import { ReactNode } from "react";
import { NavText } from "../dumb/nav-text";

export const PageLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="simp">
      <nav className="nav">
        <Image src={navLogo} className="nav-logo" alt="Jeetio Logo" height="90" />
        <ul>
          <li>
            <NavText href="/">Home</NavText>
          </li>
          <li>
            <NavText href="/deckai">Deck AI</NavText>
          </li>
          <li>
            <NavText href="/contact">Look Up</NavText>
          </li>
        </ul>
      </nav>
      {children}
    </div>
  );
};
