import { HeartFilledIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import React from "react";

export default function Footer() {
  return (
    <footer className="fixed bottom-0 w-full border-t py-3 text-sm backdrop-blur-md bg-black/50">
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
            Amanda
          </Link>
          ,
          <Link
            className="underline hover:text-black transition-colors font-medium"
            href="https://www.linkedin.com/in/armelia-agustin/"
          >
            Armelia
          </Link>
          , and
          <Link
            className="underline hover:text-black transition-colors font-medium"
            href="https://www.linkedin.com/in/danang-hapis-fadillah-682878202/"
          >
            Danang
          </Link>
        </span>

        <span className="opacity-70">at BTS Squad Batch 3</span>
      </div>
    </footer>
  );
}
