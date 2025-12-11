import { SettingsIcon } from "lucide-react";
import { Link } from "react-router";
import { Header } from "@/components/layout/Header";
import { FilterBadges } from "@/components/note/FilterBadges";
import { SortPopover } from "@/components/note/SortPopover";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useContainer } from "@/context/di";
import { useTags } from "@/hooks/useTags";
import { SearchBar } from "./SearchBar";

export type HomeHeaderProps = React.ComponentProps<"header">;

export function HomeHeader({ className, ...props }: HomeHeaderProps) {
  const container = useContainer();
  const { tags } = useTags(container);
  return (
    <>
      <Header
        {...props}
        className={className}
        leading={<SidebarTrigger />}
        trailing={
          <Link to="/settings" viewTransition>
            <Button variant="ghost" size="icon">
              <SettingsIcon className="h-5 w-5" />
            </Button>
          </Link>
        }
      >
        <div className="flex items-center gap-2">
          <SearchBar className="flex-1" />
          <SortPopover />
        </div>
      </Header>
      <FilterBadges tags={tags} />
    </>
  );
}
