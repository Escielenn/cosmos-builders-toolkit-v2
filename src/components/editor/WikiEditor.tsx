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
        class: "sf-wiki-content focus:outline-none min-h-[200px]",
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

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
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
    // Insert [[ to trigger autocomplete
    editor.chain().focus().insertContent("[[").run();
  }, [editor]);

  const handleManualSave = useCallback(() => {
    if (!editor) return;
    // Flush any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onChange(editor.getHTML());
    onSave?.();
  }, [editor, onChange, onSave]);

  if (!editor) return null;

  return (
    <div>
      {/* Toolbar */}
      {!readOnly && (
        <div className="sf-wiki-toolbar">
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline"
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <div className="separator" />

          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarBtn>

          <div className="separator" />

          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={handleInsertLink} title="Insert Link">
            <LinkIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={handleInsertImage} title="Insert Image">
            <ImageIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <div className="separator" />

          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Ordered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolbarBtn>

          <div className="separator" />

          <ToolbarBtn
            onClick={handleInsertWikiLink}
            title="Insert Wiki Link [["
            className="wiki-link-btn"
          >
            [[
          </ToolbarBtn>

          <div className="separator" />

          <ToolbarBtn onClick={handleManualSave} title="Save">
            <Save className="w-3.5 h-3.5" />
          </ToolbarBtn>

          {saveStatus !== "idle" && (
            <span className="sf-wiki-save-indicator ml-2">
              {saveStatus === "saving" ? "SAVING..." : "SAVED"}
            </span>
          )}
        </div>
      )}

      {/* Editor content */}
      <div className="border border-border/10 p-4">
        <EditorContent editor={editor} />
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
    </div>
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
      className={`${active ? "active" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
