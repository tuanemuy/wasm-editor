import { ArrowLeftIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function BackButton() {
  return (
    <Link to="/">
      <Button variant="ghost" size="icon">
        <ArrowLeftIcon className="h-5 w-5" />
      </Button>
    </Link>
  );
}
