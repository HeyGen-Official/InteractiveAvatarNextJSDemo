"use client";

import {
  Navbar,
} from "@nextui-org/react";
import { ThemeSwitch } from "./ThemeSwitch";

export default function NavBar() {
  return (
    <Navbar className="w-full">
      <ThemeSwitch />
    </Navbar>
  );
}
