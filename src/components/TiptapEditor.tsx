"use client";

import React, { useEffect, forwardRef } from "react";
import {
  useEditor,
  EditorContent,
  JSONContent,
  ReactRenderer,
  ReactNodeViewRenderer,
  NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Mention from "@tiptap/extension-mention";
import tippy, { Instance } from "tippy.js";
import { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./ui/command";
import { debounce } from "lodash";
import { Toggle } from "./ui/toggle";
import { Bold, Italic, ListIcon } from "lucide-react";

// Type for task search results (matching PlannerPage)
export type TaskSearchResult = {
  id: string;
  label: string;
};

// Type for the search function prop (matching PlannerPage)
export type TaskSearchFn = (query: string) => Promise<TaskSearchResult[]>;

// --- Custom Mention Extension with React Node View ---
const MentionWithReactView = Mention.extend({
  name: "mention", // Ensure the name matches the original
  addNodeView() {
    return ReactNodeViewRenderer(CustomMention);
  },
});

const SuggestionList = forwardRef<
  HTMLDivElement,
  SuggestionProps<TaskSearchResult>
>((props, ref) => {
  return (
    <Command ref={ref}>
      <CommandList>
        <CommandEmpty className="p-2 text-sm text-muted-foreground">
          No results found.
        </CommandEmpty>
        {props.items.length > 0 && (
          <CommandGroup>
            {props.items.map((item) => (
              <CommandItem
                key={item.id}
                value={item.id}
                onSelect={() => props.command(item)}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
});
SuggestionList.displayName = "SuggestionList";

type TiptapEditorProps = {
  content: JSONContent | string;
  onSave: (newContent: JSONContent) => void;
  onSearchTasks: (query: string) => Promise<TaskSearchResult[]>;
  debounceDelay?: number;
};

const CustomMention = ({ node }: NodeViewProps) => {
  return (
    <NodeViewWrapper as="span">
      <span className="bg-blue-100 text-blue-700 rounded-md px-1 py-0.5 truncate">
        @{node.attrs.label}
      </span>
    </NodeViewWrapper>
  );
};

export function TiptapEditor({
  content,
  onSave,
  onSearchTasks,
  debounceDelay = 1000,
}: TiptapEditorProps) {
  const debouncedSave = debounce(onSave, debounceDelay);

  const editor = useEditor({
    editorProps: {
      attributes: {
        className: "prose",
        class: "focus:outline-none",
      },
    },
    extensions: [
      StarterKit,
      Highlight,
      Typography,
      // Use the extended Mention extension
      MentionWithReactView.configure({
        suggestion: {
          items: async ({ query }) => onSearchTasks(query),
          render: () => {
            let reactRenderer: ReactRenderer<
              HTMLDivElement,
              SuggestionProps<TaskSearchResult>
            > | null = null;
            let popup: Instance[] | null = null;

            return {
              // Use SuggestionProps type for props
              onStart: (props: SuggestionProps<TaskSearchResult>) => {
                const clientRect = props.clientRect?.(); // Get the client rect

                if (!clientRect) {
                  console.warn("Mention suggestion: No client rect found.");
                  return;
                }

                // Pass SuggestionProps directly to SuggestionList
                reactRenderer = new ReactRenderer(SuggestionList, {
                  props: props, // Pass all suggestion props
                  editor: props.editor,
                });

                popup = tippy("body", {
                  getReferenceClientRect: () => clientRect, // Use the captured rect // Assuming clientRect remains valid
                  appendTo: () => document.body,
                  content: reactRenderer.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });

                // Focus the input inside the command list after it's rendered
                const suggestionElement = reactRenderer.element as HTMLElement;
                const inputElement =
                  suggestionElement?.querySelector("input[cmdk-input]");
                if (inputElement) {
                  requestAnimationFrame(() => {
                    (inputElement as HTMLInputElement).focus();
                  });
                }
              },

              // Use SuggestionProps type for props
              onUpdate: (props: SuggestionProps<TaskSearchResult>) => {
                reactRenderer?.updateProps(props); // Null check

                const clientRect = props.clientRect?.();
                if (!clientRect || !popup?.[0]) {
                  // Null check for popup
                  return;
                }

                popup[0].setProps({
                  getReferenceClientRect: () => clientRect,
                });
              },

              // Use SuggestionKeyDownProps type for props
              onKeyDown: (props: SuggestionKeyDownProps) => {
                if (props.event.key === "Escape") {
                  popup?.[0]?.hide(); // Null check
                  return true;
                }
                // Check if the key is one handled by Command component
                const isNavigationKey = [
                  "ArrowUp",
                  "ArrowDown",
                  "Enter",
                ].includes(props.event.key);
                return isNavigationKey;
              },

              onExit: () => {
                popup?.[0]?.destroy(); // Null check
                reactRenderer?.destroy();
                popup = null;
                reactRenderer = null;
              },
            };
          },
          // Ensure the command replaces the trigger text with the mention node correctly
          command: ({ editor, range, props }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent([
                {
                  type: "mention",
                  attrs: { id: props.id, label: props.label },
                },
                {
                  type: "text",
                  text: " ", // Add a space after the mention
                },
              ])
              .run();

            // Deselect the mention node after insertion (optional, improves UX)
            editor.commands.setTextSelection(range.to + 1);
          },
        },
      }),
    ],
    content: content,
    onUpdate:
      ({ editor }) =>
      () => {
        const newContent = editor.getJSON();
        debouncedSave(newContent);
      },
  });

  useEffect(() => {
    if (
      editor &&
      editor.isEditable &&
      JSON.stringify(content) !== JSON.stringify(editor.getJSON())
    ) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor, editor?.isEditable]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor border border-border rounded-md p-2 min-h-[200px]">
      <div className="toolbar flex flex-wrap gap-1 border-b border-border mb-2 pb-2">
        <Toggle
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
        >
          <Bold className="w-4 h-4" />
        </Toggle>
        <Toggle
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
        >
          <Italic className="w-4 h-4" />
        </Toggle>
        <Toggle
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={!editor.can().chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="w-4 h-4" />
        </Toggle>
      </div>
      <EditorContent
        editor={editor}
        className="focus:outline-none prose dark:prose-invert max-w-none"
      />
    </div>
  );
}
