import { SignInButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/src/components/ui/button";

export default function Header() {
  return (
    <header className="bg-blue-brand sticky top-0 z-50 text-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link
          href="https://ortoclub.com"
          replace
          className="flex items-end space-x-2"
        >
          <Image
            src="/logo-transparente.png"
            alt="OrtoQBank Logo"
            width={40}
            height={40}
            className="rounded-sm"
          />
          <span className="font-sifonn translate-y-1 text-2xl font-bold">
            OrtoQBank
          </span>
        </Link>
        <div className="flex items-center gap-8">
          <SignInButton forceRedirectUrl="/categories">
            <Button className="hover:text-brand-blue translate-y-1 rounded-full border border-white px-4 py-1.5 text-sm font-medium transition-colors hover:bg-white">
              Entrar
            </Button>
          </SignInButton>
        </div>
      </div>
    </header>
  );
}
