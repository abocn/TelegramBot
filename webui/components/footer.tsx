"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="py-12 px-6 border-t bg-background">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/kowalski.svg"
            alt="Kowalski"
            width={22}
            height={22}
            className="mr-2 dark:invert -mt-1"
          />
          <span className="text-xl font-semibold">Kowalski</span>
        </div>
        <p className="text-muted-foreground">
          {t('footer.builtWith')} <Link href="https://github.com/abocn" className="underline hover:text-primary transition-all duration-300">ABOCN</Link> {t('footer.andContributors')}
        </p>
      </div>
    </footer>
  );
}
