import { ChevronLeftIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function BackButton() {
  return (
    <Link to="/">
      <Button variant="ghost" size="icon">
        <ChevronLeftIcon />
      </Button>
    </Link>
  );
}
