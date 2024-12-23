"use client";

import {
  Navbar,
} from "@nextui-org/react";
import { ThemeSwitch } from "./ThemeSwitch";
import { IgentifyLogo } from "./Icons"; // P3ee8

export default function NavBar() {
  return (
    <Navbar className="w-full">
      <div className="flex items-center">
        <IgentifyLogo /> {/* P0025 */}
        <span className="ml-2 text-lg font-bold">Igentify Interactive Avatar Demo</span> {/* P8c18 */}
      </div>
      <ThemeSwitch />
    </Navbar>
  );
}
