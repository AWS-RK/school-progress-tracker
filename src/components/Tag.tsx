import type { ReactNode } from 'react';

type TagVariant = 'accent' | 'accent-2' | 'neutral' | 'outline';

export default function Tag({ children, variant = 'neutral' }: { children: ReactNode; variant?: TagVariant }) {
  return <span className={`tag tag-${variant}`}>{children}</span>;
}
