import Link from "next/link";
import Image from "next/image";

export default function Footer() {
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
          Built with ❤️ by <Link href="https://git.p0ntus.com/ABOCN" className="underline hover:text-primary transition-all duration-300">ABOCN</Link> and contributors under open source licenses.
        </p>
      </div>
    </footer>
  );
}
