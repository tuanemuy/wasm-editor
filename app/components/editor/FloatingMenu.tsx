import { FloatingMenu as TiptapFloatingMenu } from "@tiptap/react/menus";
import { BlockquoteButton } from "./BlockquoteButton";
import { BulletListButton } from "./BulletListButton";
import { CodeBlockButton } from "./CodeBlockButton";
import { HeadingButtons } from "./HeadingButtons";
import { OrderedListButton } from "./OrderedListButton";

export function FloatingMenu(
  props: React.ComponentProps<typeof TiptapFloatingMenu>,
) {
  if (!props.editor) {
    return null;
  }
  const editor = props.editor;

  return (
    <TiptapFloatingMenu {...props} className="gap-2">
      <HeadingButtons editor={editor} />
      <BulletListButton editor={editor} />
      <OrderedListButton editor={editor} />
      <CodeBlockButton editor={editor} />
      <BlockquoteButton editor={editor} />
    </TiptapFloatingMenu>
  );
}
