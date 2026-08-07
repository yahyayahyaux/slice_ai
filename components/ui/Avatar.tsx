import { cn, initials } from "@/lib/utils";

const palette = [
  "bg-zinc-100 text-zinc-700",
  "bg-neutral-100 text-neutral-700",
  "bg-stone-100 text-stone-700",
  "bg-gray-100 text-gray-700"
];

export function Avatar({ name, src, size = "md", className }: { name: string; src?: string; size?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string }) {
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-xl"
  };
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-full ring-1 ring-border", sizes[size], palette[hash % palette.length]!, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-semibold">{initials(name)}</div>
      )}
    </div>
  );
}
