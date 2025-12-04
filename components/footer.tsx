import { HeartFilledIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import React from "react";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 w-full border-t py-3 text-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center px-4 gap-2">
        <span className="flex items-center">
          © 2025 | built with{" "}
          <HeartFilledIcon className="ml-1 text-pink-500 animate-pulse" />
        </span>

        <span className="flex flex-wrap items-center gap-x-1">
          by{" "}
          <Link
            className="underline hover:text-black transition-colors font-medium"
            href="https://www.linkedin.com/in/putri-amanda-khairunnisa/"
          >
            Amanda,
          </Link>
          
          <Link
            className="underline hover:text-black transition-colors font-medium"
            href="https://www.linkedin.com/in/armelia-agustin/"
          >
            Armelia,
          </Link>
          
          <Link
            className="underline hover:text-black transition-colors font-medium"
            href="https://www.linkedin.com/in/danang-hapis-fadillah-682878202/"
          >
            Danang,
          </Link>
          
          <Link
            className="underline hover:text-black transition-colors font-medium"
            href="https://www.linkedin.com/in/melianadela/"
          >
            Eli,
          </Link>
          and
          <Link
            className="underline hover:text-black transition-colors font-medium"
            href="https://www.linkedin.com/in/nadyakartikaa/"
          >
            Nadya
          </Link>
        </span>

        <span className="opacity-70">at BTS Batch 3 & 4</span>
      </div>
    </footer>
  );
}
