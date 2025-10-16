import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function SettingsHeader() {
  return (
    <header className="border-b bg-background p-4">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
    </header>
  );
}
