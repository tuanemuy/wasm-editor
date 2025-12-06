import { cn } from "@/lib/utils";

export type HeaderProps = React.ComponentProps<"header"> & {
  leading: React.ReactNode;
  trailing: React.ReactNode;
  children?: React.ReactNode;
};

export function Header({
  leading,
  trailing,
  children,
  className,
  ...props
}: HeaderProps) {
  return (
    <header {...props} className={cn("pt-2", className)}>
      <div className="flex justify-between items-center h-14 px-3 glass">
        {leading}
        <div className="relative flex-1 p-2 overflow-hidden">{children}</div>
        {trailing}
      </div>
    </header>
  );
}
