import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import { SiDocker, SiPrometheus, SiYoutube } from 'react-icons/si';
import { TbSparkles, TbServer, TbDashboard } from "react-icons/tb";
import { createElement, ElementType } from 'react';

const customIcons: Record<string, ElementType> = {
  Docker: SiDocker,
  Sparkles: TbSparkles,
  Youtube: SiYoutube,
  Server: TbServer,
  Dashboard: TbDashboard,
  Prometheus: SiPrometheus,
};

export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) return;

    if (icon in customIcons) {
      return createElement(customIcons[icon]);
    }

    if (icon in icons) {
      return createElement(icons[icon as keyof typeof icons]);
    }
  },
});