import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { BracketPanel } from "@/components/ui/bracket-panel";
import { useWritingPreferences } from "@/hooks/use-writing-preferences";
import { WRITING_THEMES } from "@/lib/writing/themes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WikiLink } from "@/components/editor/WikiLinkExtension";
import { WikiLinkAutocomplete } from "@/components/editor/WikiLinkAutocomplete";
import { useWikiLinkTrigger } from "@/components/editor/useWikiLinkTrigger";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: string;
  /** When provided, enables [[ wiki-link autocomplete for this world */
  worldId?: string;
}

const ToolbarButton = ({
  onClick,
  isActive,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "p-1.5 rounded hover:bg-accent/80 transition-colors",
      isActive && "bg-accent text-accent-foreground"
    )}
  >
    {children}
  </button>
);

const RichTextEditor = ({
  content,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  className,
  minHeight = "200px",
  worldId,
}: RichTextEditorProps) => {
  const { preferences, updatePreferences } = useWritingPreferences();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
      WikiLink,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none",
          "prose-headings:font-semibold",
          "prose-h1:text-xl prose-h1:mt-4 prose-h1:mb-2",
          "prose-h2:text-lg prose-h2:mt-3 prose-h2:mb-2",
          "prose-h3:text-base prose-h3:mt-2 prose-h3:mb-1",
          "prose-p:my-1.5 prose-p:leading-relaxed",
          "prose-ul:my-1.5 prose-ol:my-1.5",
          "prose-li:my-0.5",
          "prose-blockquote:border-l-primary prose-blockquote:text-t3",
          "prose-code:text-xs prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-[#0d1117] prose-pre:p-3 prose-pre:rounded-md",
          "[&_.is-editor-empty:first-child::before]:text-t3/50 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:h-0"
        ),
      },
    },
  });

  // Sync content from outside (e.g., initial load from DB)
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  // Sync editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  // Wiki-link trigger (only active when worldId is provided)
  const wikiLink = useWikiLinkTrigger(worldId ? editor : null);

  if (!editor) return null;

  return (
    <BracketPanel color="stellar">
    <div
      className={cn(
        "rounded-none border border-[#5B8DEF]/15 bg-background overflow-hidden relative",
        className
      )}
    >
      {/* Toolbar */}
      {!readOnly && (
        <div className="sf-writing-toolbar flex items-center gap-0.5 p-1.5 border-b border-border bg-muted/30 flex-wrap">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>

          {/* Theme Picker */}
          <div className="w-px h-5 bg-border mx-1" />
          <div className="flex items-center gap-1 ml-0.5">
            {WRITING_THEMES.map((theme) => (
              <Tooltip key={theme.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => updatePreferences({ themeId: theme.id })}
                    className={cn(
                      "w-3.5 h-3.5 rounded-full border transition-all",
                      preferences.themeId === theme.id
                        ? "ring-2 ring-[#5B8DEF] ring-offset-1 ring-offset-background border-[#5B8DEF]"
                        : "border-sf-border hover:border-foreground/50"
                    )}
                    style={{ backgroundColor: theme.swatch[0] }}
                    aria-label={theme.name}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {theme.name}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <EditorContent
        editor={editor}
        className={cn(
          "px-3 py-2 [&_.tiptap]:outline-none [&_.tiptap]:min-h-[var(--editor-min-h)]",
          !readOnly && "sf-writing-surface",
          readOnly && "bg-muted/30"
        )}
        style={{ "--editor-min-h": minHeight } as React.CSSProperties}
        data-writing-theme={!readOnly ? preferences.themeId : undefined}
      />

      {/* Wiki-link autocomplete popover */}
      {worldId && wikiLink.isActive && (
        <WikiLinkAutocomplete
          worldId={worldId}
          query={wikiLink.query}
          position={wikiLink.position}
          onSelect={wikiLink.insertWikiLink}
          onClose={wikiLink.closeAutocomplete}
        />
      )}
    </div>
    </BracketPanel>
  );
};

export default RichTextEditor;
