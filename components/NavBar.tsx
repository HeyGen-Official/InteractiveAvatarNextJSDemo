"use client";

import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/react";
import { GithubIcon } from "./Icons";
import { ThemeSwitch } from "./ThemeSwitch";
import Image from "next/image";

export default function NavBar() {
  return (
    <Navbar className="w-full">
      <NavbarBrand>
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/boozytrush-logo.png" 
            alt="Boozy Truth Logo" 
            width={40} 
            height={40}
          />
          <div className="bg-gradient-to-br from-pink-400 to-blue-400 bg-clip-text">
            <p className="text-xl font-semibold text-transparent">
              Boozy Truth
            </p>
          </div>
        </Link>
      </NavbarBrand>
      <NavbarContent justify="end">
        <NavbarItem className="flex flex-row items-center gap-4">
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
