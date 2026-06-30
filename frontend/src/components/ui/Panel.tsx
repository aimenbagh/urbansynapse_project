import { clsx } from "clsx";

interface Props {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Panel({ title, children, className }: Props) {
  return (
    <div className={clsx("rounded-xl border border-white/5 bg-navy-light/60 p-4", className)}>
      {title && <h2 className="mb-3 font-semibold">{title}</h2>}
      {children}
    </div>
  );
}
