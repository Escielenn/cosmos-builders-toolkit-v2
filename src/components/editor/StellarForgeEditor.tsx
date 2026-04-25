// ---------------------------------------------------------------------------
// StellarForgeEditor — Unified editor wrapper with three presets.
//
// Presets:
//   compact — Basic toolbar (bold, italic, link), no headings, smaller min-height
//   rich    — Full toolbar, resizable, entity mentions + wiki links
//   full    — Like rich but with word count footer, focus mode toggle, max width
//
// All presets include entity mentions when worldId is provided.
// Includes WikiLink extension for [[ links.
// Auto-save support via onBlur and debounced onChange.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
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
  LinkIcon,
  Undo,
  Redo,
  Minus,
  Maximize2,
  Minimize2,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BracketPanel } from "@/components/ui/bracket-panel";
import { WikiLink } from "@/components/editor/WikiLinkExtension";
import { WikiLinkAutocomplete } from "@/components/editor/WikiLinkAutocomplete";
import { useWikiLinkTrigger } from "@/components/editor/useWikiLinkTrigger";
import { EntityMention, useEntityMentionTrigger } from "@/components/editor/EntityMention";
import { EntityMentionList } from "@/components/editor/EntityMentionList";
import { useEntities } from "@/hooks/use-entity-graph";
import { useWritingPreferences } from "@/hooks/use-writing-preferences";
import { WRITING_THEMES } from "@/lib/writing/themes";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EditorPreset = "compact" | "rich" | "full";

export interface StellarForgeEditorProps {
  content: string;
  onChange: (html: string) => void;
  worldId?: string;
  preset?: EditorPreset;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  minHeight?: string;
}

// ---------------------------------------------------------------------------
// Preset configurations
// ---------------------------------------------------------------------------

const PRESET_CONFIG = {
  compact: {
    headingLevels: [] as number[],
    showHeadings: false,
    showLists: false,
    showQuote: false,
    showCode: false,
    showStrikethrough: false,
    showUnderline: false,
    showHr: false,
    showUndoRedo: false,
    showLink: true,
    showFocusMode: false,
    showWordCount: false,
    showThemePicker: false,
    defaultMinHeight: "120px",
    maxWidth: undefined as string | undefined,
  },
  rich: {
    headingLevels: [1, 2, 3] as number[],
    showHeadings: true,
    showLists: true,
    showQuote: true,
    showCode: true,
    showStrikethrough: true,
    showUnderline: true,
    showHr: true,
    showUndoRedo: true,
    showLink: true,
    showFocusMode: false,
    showWordCount: false,
    showThemePicker: true,
    defaultMinHeight: "200px",
    maxWidth: undefined as string | undefined,
  },
  full: {
    headingLevels: [1, 2, 3] as number[],
    showHeadings: true,
    showLists: true,
    showQuote: true,
    showCode: true,
    showStrikethrough: true,
    showUnderline: true,
    showHr: true,
    showUndoRedo: true,
    showLink: true,
    showFocusMode: true,
    showWordCount: true,
    showThemePicker: true,
    defaultMinHeight: "360px",
    maxWidth: "72ch",
  },
} as const;

// ---------------------------------------------------------------------------
// Debounce delay
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 1500;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StellarForgeEditor({
  content,
  onChange,
  worldId,
  preset = "rich",
  placeholder = "Start writing...",
  readOnly = false,
  className,
  minHeight,
}: StellarForgeEditorProps) {
  const config = PRESET_CONFIG[preset];
  const resolvedMinHeight = minHeight || config.defaultMinHeight;

  const [focusMode, setFocusMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { preferences, updatePreferences } = useWritingPreferences();

  // Entities for @mentions (only fetched when worldId present)
  const { data: entities } = useEntities(worldId);

  // Build extensions based on preset
  const extensions = useMemo(() => {
    const exts = [
      StarterKit.configure({
        heading:
          config.headingLevels.length > 0
            ? { levels: config.headingLevels as any }
            : false,
      }),
      Placeholder.configure({ placeholder }),
      WikiLink,
      EntityMention,
    ];

    if (config.showUnderline) {
      exts.push(Underline);
    }

    if (config.showLink) {
      exts.push(
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "sf-external-link" },
        })
      );
    }

    return exts;
  }, [config.headingLevels, config.showUnderline, config.showLink, placeholder]);

  const editor = useEditor({
    extensions,
    content,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();

      // Update word count
      if (config.showWordCount) {
        const text = ed.state.doc.textContent;
        setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      }

      // Debounced onChange
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChangeRef.current(html);
      }, DEBOUNCE_MS);
    },
    onBlur: ({ editor: ed }) => {
      // Flush on blur for auto-save
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      onChangeRef.current(ed.getHTML());
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
          "prose-pre:bg-sf-void prose-pre:p-3 prose-pre:rounded-none",
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
    if (editor) editor.setEditable(!readOnly);
  }, [readOnly, editor]);

  // Flush on unmount
  const editorRef = useRef(editor);
  editorRef.current = editor;
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

  // Initial word count
  useEffect(() => {
    if (editor && config.showWordCount) {
      const text = editor.state.doc.textContent;
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    }
  }, [editor, config.showWordCount]);

  // Wiki-link trigger
  const wikiLink = useWikiLinkTrigger(worldId ? editor : null);

  // Entity mention trigger
  const entityMention = useEntityMentionTrigger(worldId ? editor : null);

  // Insert @ trigger text
  const handleInsertAtTrigger = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertContent("@").run();
  }, [editor]);

  // Insert link
  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  // Insert [[ trigger
  const handleInsertWikiLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertContent("[[").run();
  }, [editor]);

  if (!editor) return null;

  return (
    <BracketPanel color="stellar">
      <div
        className={cn(
          "rounded-none border border-[#5B8DEF]/15 bg-background overflow-hidden relative",
          focusMode && "sf-focus-mode",
          className
        )}
      >
        {/* Toolbar */}
        {!readOnly && (
          <div className="sf-writing-toolbar flex items-center gap-0.5 p-1.5 border-b border-sf-border bg-muted/30 flex-wrap">
            {/* Bold + Italic (always shown) */}
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

            {/* Underline */}
            {config.showUnderline && (
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive("underline")}
                title="Underline"
              >
                <UnderlineIcon className="w-4 h-4" />
              </ToolbarBtn>
            )}

            {/* Strikethrough */}
            {config.showStrikethrough && (
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleStrike().run()}
                active={editor.isActive("strike")}
                title="Strikethrough"
              >
                <Strikethrough className="w-4 h-4" />
              </ToolbarBtn>
            )}

            {/* Headings */}
            {config.showHeadings && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  active={editor.isActive("heading", { level: 1 })}
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  active={editor.isActive("heading", { level: 2 })}
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  active={editor.isActive("heading", { level: 3 })}
                  title="Heading 3"
                >
                  <Heading3 className="w-4 h-4" />
                </ToolbarBtn>
              </>
            )}

            {/* Lists, Quote, Code, HR */}
            {config.showLists && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  active={editor.isActive("bulletList")}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  active={editor.isActive("orderedList")}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </ToolbarBtn>
              </>
            )}

            {config.showQuote && (
              <ToolbarBtn
                onClick={() =>
                  editor.chain().focus().toggleBlockquote().run()
                }
                active={editor.isActive("blockquote")}
                title="Quote"
              >
                <Quote className="w-4 h-4" />
              </ToolbarBtn>
            )}

            {config.showCode && (
              <ToolbarBtn
                onClick={() =>
                  editor.chain().focus().toggleCodeBlock().run()
                }
                active={editor.isActive("codeBlock")}
                title="Code Block"
              >
                <Code className="w-4 h-4" />
              </ToolbarBtn>
            )}

            {config.showHr && (
              <ToolbarBtn
                onClick={() =>
                  editor.chain().focus().setHorizontalRule().run()
                }
                title="Horizontal Rule"
              >
                <Minus className="w-4 h-4" />
              </ToolbarBtn>
            )}

            {/* Link */}
            {config.showLink && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn onClick={handleInsertLink} title="Insert Link">
                  <LinkIcon className="w-4 h-4" />
                </ToolbarBtn>
              </>
            )}

            {/* Wiki Link + Entity Mention triggers */}
            {worldId && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn
                  onClick={handleInsertWikiLink}
                  title="Insert Wiki Link [["
                >
                  <span className="text-[#5B8DEF] font-mono text-xs font-medium">
                    [[
                  </span>
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={handleInsertAtTrigger}
                  title="Mention Entity @"
                >
                  <AtSign className="w-4 h-4 text-[#00FF88]" />
                </ToolbarBtn>
              </>
            )}

            {/* Undo / Redo */}
            {config.showUndoRedo && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn
                  onClick={() => editor.chain().focus().undo().run()}
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </ToolbarBtn>
                <ToolbarBtn
                  onClick={() => editor.chain().focus().redo().run()}
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </ToolbarBtn>
              </>
            )}

            {/* Focus Mode Toggle (full preset only) */}
            {config.showFocusMode && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <ToolbarBtn
                  onClick={() => setFocusMode((f) => !f)}
                  active={focusMode}
                  title={focusMode ? "Exit Focus Mode" : "Focus Mode"}
                >
                  {focusMode ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </ToolbarBtn>
              </>
            )}

            {/* Theme Picker */}
            {config.showThemePicker && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <div className="flex items-center gap-1 ml-0.5">
                  {WRITING_THEMES.map((theme) => (
                    <Tooltip key={theme.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() =>
                            updatePreferences({ themeId: theme.id })
                          }
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
              </>
            )}
          </div>
        )}

        {/* Editor Content */}
        <EditorContent
          editor={editor}
          className={cn(
            "px-3 py-2 [&_.tiptap]:outline-none [&_.tiptap]:min-h-[var(--editor-min-h)]",
            !readOnly && "sf-writing-surface",
            readOnly && "bg-muted/30",
            config.maxWidth && "mx-auto"
          )}
          style={
            {
              "--editor-min-h": resolvedMinHeight,
              ...(config.maxWidth ? { maxWidth: config.maxWidth } : {}),
            } as React.CSSProperties
          }
          data-writing-theme={!readOnly ? preferences.themeId : undefined}
        />

        {/* Word Count Footer (full preset only) */}
        {config.showWordCount && !readOnly && (
          <div className="flex items-center justify-end px-3 py-1.5 border-t border-sf-border bg-muted/20">
            <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-t4">
              {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
            </span>
          </div>
        )}

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

        {/* Entity mention autocomplete popover */}
        {worldId && entityMention.isActive && entities && (
          <EntityMentionList
            entities={entities}
            query={entityMention.query}
            position={entityMention.position}
            onSelect={entityMention.insertMention}
            onClose={entityMention.closeAutocomplete}
          />
        )}
      </div>
    </BracketPanel>
  );
}

// ---------------------------------------------------------------------------
// ToolbarBtn — small toolbar button matching existing pattern
// ---------------------------------------------------------------------------

function ToolbarBtn({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded hover:bg-accent/80 transition-colors",
        active && "bg-accent text-accent-foreground"
      )}
    >
      {children}
    </button>
  );
}

export default StellarForgeEditor;
