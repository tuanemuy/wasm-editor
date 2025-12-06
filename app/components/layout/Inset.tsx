import { cn } from "@/lib/utils";

export type Props = React.ComponentProps<"div"> & {
  children: React.ReactNode;
};

export function Inset({ children, className, ...props }: Props) {
  return (
    <div {...props} className={cn("w-full max-w-3xl mx-auto px-4", className)}>
      {children}
    </div>
  );
}
