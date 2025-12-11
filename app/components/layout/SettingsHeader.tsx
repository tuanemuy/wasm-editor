import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

export type SettingsHeaderProps = React.ComponentProps<"header">;

export function SettingsHeader({ className, ...props }: SettingsHeaderProps) {
  return (
    <Header
      {...props}
      className={className}
      leading={
        <Link to="/" viewTransition>
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </Link>
      }
      trailing={null}
    >
      <h1 className="text-lg font-bold">Settings</h1>
    </Header>
  );
}
