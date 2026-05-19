import Image from "next/image";
import navLogo from "@/assets/logo.png";
import { ReactNode } from "react";
import { NavText } from "../dumb/nav-text";

export const PageLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="simp">
      <nav className="nav">
        <Image
          src={navLogo}
          className="nav-logo"
          alt="Jeetio Logo"
          height={80}
          width={244}
          priority
          sizes="(max-width: 400px) 90px, (max-width: 640px) 130px, 140px"
          style={{ width: "auto", height: "46px" }}
        />
        <ul>
          <li>
            <NavText href="/">Home</NavText>
          </li>
          <li>
            <NavText href="/clan-info">Clan Info</NavText>
          </li>
          <li>
            <NavText href="/stats">Stats</NavText>
          </li>
          <li>
            <NavText href="/deckai">Deck AI</NavText>
          </li>
        </ul>
      </nav>
      {children}
      <footer className="site-footer">
        <span className="site-footer-name">Jeetio</span>
        <span className="site-footer-sep">·</span>
        <span className="site-footer-copy">© {new Date().getFullYear()} Jeetio. All rights reserved.</span>
      </footer>
    </div>
  );
};
