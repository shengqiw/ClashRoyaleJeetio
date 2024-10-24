import Image from "next/image";
import navLogo from "../assets/jeetio-logo.png";
import { ReactNode } from "react";
import { NavText } from "./small/nav-text";

export const PageLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="hero">
      {/* <video
        className="object-cover background-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={"/black-cat.mp4"} type="video/mp4" />
      </video> */}
      <iframe
        src="https://www.youtube.com/embed/y9yCNrBhtgk?si=o7mvZJxBGdA3gmbn&amp;controls=0&amp;start=4&autoplay=1&loop=1&mute=1&showinfo=0$frameborder=0"
        title="YouTube video player"
        className="object-cover background-video"
        allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
      <nav className="nav">
        <Image src={navLogo} alt="Jeetio Logo" height="90" />
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
      <div className="content">
        <h1>Jeetio Clash Royale</h1>
      </div>
      <div className="">{children}</div>
    </div>
  );
};
