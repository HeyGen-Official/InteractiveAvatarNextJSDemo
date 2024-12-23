"use client";

import {
  Navbar,
} from "@nextui-org/react";
import { ThemeSwitch } from "./ThemeSwitch";
import { HeyGenLogo } from "./Icons"; // P3ee8

export default function NavBar() {
  return (
    <Navbar className="w-full">
      <div className="flex items-center">
        <HeyGenLogo /> {/* P0025 */}
        <span className="ml-2 text-lg font-bold">HeyGen</span> {/* P8c18 */}
      </div>
      <ThemeSwitch />
    </Navbar>
  );
}
