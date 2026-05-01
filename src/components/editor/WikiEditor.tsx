import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { WikiLink } from "./WikiLinkExtension";
import { WikiLinkAutocomplete } from "./WikiLinkAutocomplete";
import { useWikiLinkTrigger } from "./useWikiLinkTrigger";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Quote,
  LinkIcon,
  ImageIcon,
  Minus,
  List,
  ListOrdered,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BracketPanel } from "@/components/ui/bracket-panel";
import { useWritingPreferences } from "@/hooks/use-writing-preferences";
import { WRITING_THEMES } from "@/lib/writing/themes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WikiEditorProps {
  worldId: string;
  content: string;
  onChange: (html: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  placeholder?: string;
  saveStatus?: "idle" | "saving" | "saved";
}

export function WikiEditor({
  worldId,
  content,
  onChange,
  onSave,
  readOnly = false,
  placeholder = "Start writing...",
  saveStatus = "idle",
}: WikiEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const { preferences, updatePreferences } = useWritingPreferences();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "sf-external-link" },
      }),
      Image.configure({
        HTMLAttributes: { class: "sf-wiki-image" },
      }),
      WikiLink,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();

      // Debounced auto-save (3 seconds)
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(html);
      }, 3000);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[500px]",
          "prose-headings:font-semibold",
          "prose-h2:text-lg prose-h2:mt-3 prose-h2:mb-2",
          "prose-h3:text-base prose-h3:mt-2 prose-h3:mb-1",
          "prose-p:my-1.5 prose-p:leading-relaxed",
          "prose-ul:my-1.5 prose-ol:my-1.5",
          "prose-li:my-0.5",
          "prose-blockquote:border-l-primary prose-blockquote:text-t3",
          "prose-code:text-xs prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
          "prose-pre:bg-sf-void prose-pre:p-3 prose-pre:rounded-none",
          "[&_.is-editor-empty:first-child::before]:text-t3/50 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:h-0"
        ),
      },
    },
  });

  // Sync content from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  // Sync editable state
  useEffect(() => {
    if (editor) editor.setEditable(!readOnly);
  }, [readOnly, editor]);

  // Keep a ref to the editor so we can flush content on unmount
  const editorRef = useRef(editor);
  editorRef.current = editor;

  // Flush pending content on unmount (prevents content loss when toggling to preview)
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        const html = editorRef.current?.getHTML();
        if (html !== undefined) {
          onChangeRef.current(html);
        }
      }
    };
  }, []);

  const wikiTrigger = useWikiLinkTrigger(editor);

  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleInsertImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleInsertWikiLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertContent("[[").run();
  }, [editor]);

  const handleManualSave = useCallback(() => {
    if (!editor) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onChange(editor.getHTML());
    onSave?.();
  }, [editor, onChange, onSave]);

  if (!editor) return null;

  return (
    <BracketPanel color="stellar">
      <div className="rounded-none border border-[#5B8DEF]/15 bg-background overflow-hidden">
        {/* Toolbar, matches sf-writing-toolbar pattern */}
        {!readOnly && (
          <div className="sf-writing-toolbar flex items-center gap-0.5 p-1.5 border-b border-sf-border bg-muted/30 flex-wrap">
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              title="Ordered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
              title="Blockquote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarBtn onClick={handleInsertLink} title="Insert Link">
              <LinkIcon className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn onClick={handleInsertImage} title="Insert Image">
              <ImageIcon className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              <Minus className="w-4 h-4" />
            </ToolbarBtn>

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarBtn
              onClick={handleInsertWikiLink}
              title="Insert Wiki Link [["
              className="wiki-link-btn"
            >
              <span className="text-[#5B8DEF] font-mono text-xs font-semibold">[[</span>
            </ToolbarBtn>

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarBtn onClick={handleManualSave} title="Save">
              <Save className="w-4 h-4" />
            </ToolbarBtn>

            {/* Theme Picker, same as RichTextEditor */}
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

        {/* Editor, writing surface with theme support */}
        <EditorContent
          editor={editor}
          className={cn(
            "px-4 py-3 [&_.tiptap]:outline-none [&_.tiptap]:min-h-[500px]",
            !readOnly && "sf-writing-surface"
          )}
          data-writing-theme={!readOnly ? preferences.themeId : undefined}
        />
      </div>

      {/* Autocomplete popover */}
      {wikiTrigger.isActive && (
        <WikiLinkAutocomplete
          worldId={worldId}
          query={wikiTrigger.query}
          position={wikiTrigger.position}
          onSelect={wikiTrigger.insertWikiLink}
          onClose={wikiTrigger.closeAutocomplete}
        />
      )}
    </BracketPanel>
  );
}

function ToolbarBtn({
  onClick,
  active,
  children,
  title,
  className = "",
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded hover:bg-accent/80 transition-colors",
        active && "bg-accent text-accent-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}
