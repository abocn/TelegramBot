import { SiTypescript, SiBun, SiNextdotjs, SiShadcnui, SiTailwindcss, SiTelegram, SiPostgresql } from "react-icons/si";

const techs = [
  { icon: SiTypescript, href: "https://www.typescriptlang.org/", label: "TypeScript" },
  { icon: SiBun, href: "https://bun.sh", label: "Bun" },
  { icon: SiNextdotjs, href: "https://nextjs.org", label: "Next.js" },
  { icon: SiShadcnui, href: "https://ui.shadcn.com", label: "shadcn/ui" },
  { icon: SiTailwindcss, href: "https://tailwindcss.com", label: "Tailwind CSS" },
  { icon: SiTelegram, href: "https://telegram.org", label: "Telegram" },
  { icon: SiPostgresql, href: "https://www.postgresql.org", label: "PostgreSQL" },
];

export function TechCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 my-8">
      {techs.map((tech) => {
        const Icon = tech.icon;
        return (
          <a
            key={tech.label}
            href={tech.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center p-4 rounded-lg border border-neutral-200 bg-neutral-50 transition-all hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
            aria-label={tech.label}
          >
            <Icon className="text-3xl text-neutral-600 transition-colors group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-neutral-100" />
          </a>
        );
      })}
    </div>
  );
}