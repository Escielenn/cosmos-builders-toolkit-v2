# StellarForge Writing Space Bug Fixes
# Urgent — Handoff to Claude Code

**Date:** April 4, 2026  
**Priority:** Immediate  
**Context:** These bugs exist in the current deployed state of the writing/notes system.

---

## Pre-Flight

Before fixing these, run:
```bash
npm run build   # must pass clean
```

Then search the codebase for the components involved:
```bash
grep -rn "resize" src/ --include="*.tsx" --include="*.ts" --include="*.css"
grep -rn "notes" src/ --include="*.tsx" --include="*.ts" | grep -i "new\|create\|add"
grep -rn "textarea\|TextArea\|text-area" src/ --include="*.tsx" --include="*.ts"
grep -rn "title" src/ --include="*.tsx" --include="*.ts" | grep -i "note"
```

Document what you find before making changes.

---

## Bug 1: Resize Handle Expands Border Only, Not Content

### Symptom
The drag handle in the bottom-right corner of the notes area works 
mechanically (you can drag it), but only the outer border/container 
expands. The actual text editing area inside does not grow to fill the 
expanded space. The result is a larger box with the same tiny text area 
floating inside it.

### Root Cause (Most Likely)
The resize behavior is applied to an outer wrapper div, but the inner 
textarea or editor component has a fixed height (e.g., `height: 100px` 
or `max-height` constraint) that does not respond to the parent's size 
change. The inner element needs to fill its parent.

### Fix

Find the component that renders the notes area. It likely has a structure 
similar to:

```tsx
// BROKEN pattern:
<div className="notes-container" style={{ resize: 'vertical', overflow: 'auto' }}>
  <textarea style={{ height: '100px' }} />  {/* fixed height — doesn't grow */}
</div>
```

Change to:

```tsx
// FIXED pattern:
<div className="notes-container" style={{ resize: 'vertical', overflow: 'hidden', minHeight: '200px' }}>
  <textarea style={{ width: '100%', height: '100%', minHeight: '100%' }} />
</div>
```

Or if using a Tiptap editor instance:

```tsx
<div 
  className="notes-container" 
  style={{ 
    resize: 'vertical', 
    overflow: 'hidden',
    minHeight: '200px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
  }}
>
  <EditorContent 
    editor={editor} 
    style={{ 
      flex: 1,            /* CRITICAL: fills remaining space in flex parent */
      overflow: 'auto',   /* scrolls when content exceeds container */
    }} 
  />
</div>
```

**Key rules:**
- The outer container gets `resize: vertical` and `overflow: hidden`
- The inner content element gets `height: 100%` or `flex: 1`
- The inner content element gets `overflow: auto` (so it scrolls when full)
- Never put a fixed `height` on the inner element
- `minHeight` goes on the OUTER container to prevent collapsing too small

### CSS approach (if using className instead of inline):

```css
.notes-container {
  resize: vertical;
  overflow: hidden;
  min-height: 200px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.notes-container textarea,
.notes-container .ProseMirror,
.notes-container .tiptap {
  flex: 1;
  width: 100%;
  min-height: 100%;
  overflow-y: auto;
  resize: none;           /* disable inner resize since outer handles it */
}
```

### Verify
After fix: drag the resize handle → the text editing area visibly grows 
with the container. Text you type fills the larger space. No dead space 
between content and border.

---

## Bug 2: New Note Has Single-Line Height, Requires Hard Return to Expand

### Symptom
When creating a new note, the text input area shows only one line of 
height. As you type, the line scrolls horizontally or wraps but the box 
does not grow. You have to press Enter (hard return) to make the box taller 
line by line. The editing area should have a reasonable starting height and 
ideally auto-grow as content is added.

### Root Cause (Most Likely)
The text area is either:
(a) An `<input type="text">` (single-line by definition), or
(b) A `<textarea>` with `rows="1"` or a CSS height of one line, or
(c) A contentEditable div or editor with `min-height: 1em` or similar

### Fix

**Option A: If it's an `<input type="text">`** — change to `<textarea>`:

```tsx
// BROKEN:
<input type="text" value={noteContent} onChange={...} />

// FIXED:
<textarea 
  value={noteContent} 
  onChange={...} 
  rows={8}
  style={{ 
    width: '100%', 
    minHeight: '160px',
    resize: 'vertical',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '15px',
    lineHeight: '1.7',
    color: 'rgba(250, 250, 250, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '12px 16px',
    outline: 'none',
  }}
/>
```

**Option B: If it's a textarea with rows="1"** — increase rows and add min-height:

```tsx
// BROKEN:
<textarea rows={1} />

// FIXED:
<textarea 
  rows={8} 
  style={{ minHeight: '160px', resize: 'vertical' }} 
/>
```

**Option C: If it's a Tiptap/ProseMirror editor** — set min-height on the 
ProseMirror element:

```css
.note-editor .ProseMirror {
  min-height: 160px;    /* at least ~8 lines visible */
  padding: 12px 16px;
  outline: none;
}

/* Auto-grow: ProseMirror naturally grows with content */
/* Just make sure there's no max-height cutting it off */
/* OR if you want a scrollable container: */
.note-editor {
  max-height: 60vh;
  overflow-y: auto;
}
```

**Option D: Auto-growing textarea (no fixed height, grows with content):**

```tsx
function AutoGrowTextarea({ value, onChange, ...props }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);
  
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      style={{ 
        minHeight: '160px',
        overflow: 'hidden',  /* hide scrollbar since we auto-grow */
        resize: 'vertical',
      }}
      {...props}
    />
  );
}
```

### Verify
After fix: open a new note → text area shows at least 6-8 lines of 
visible space immediately, without typing anything. As you type past the 
visible area, the box either scrolls (if max-height is set) or grows 
(if auto-growing). You should never see a single-line input for note 
content.

---

## Bug 3: Notes Have No Title Field

### Symptom
When creating a new note (in note view or as standalone), there is no 
input field for a note title. Notes are created without any way to name 
them. Existing notes also cannot have titles assigned or edited.

### Root Cause
The note creation form/modal and the note display component do not include 
a title field. Either:
(a) The database table has a title column but the UI doesn't expose it, or
(b) The database table has no title column at all

### Fix

**Step 1: Check the database**

```sql
-- Check if documents/notes table has a title column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' OR table_name = 'notes' OR table_name = 'world_notes';
```

If no title column exists:
```sql
ALTER TABLE [table_name] ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled';
```

**Step 2: Add title input to the note creation UI**

Find the component that renders the note creation form. Add a title 
input ABOVE the content area:

```tsx
<div className="note-editor-container">
  {/* Title input — prominent, large, no visible border */}
  <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="Note title..."
    className="note-title-input"
    autoFocus
  />
  
  {/* Content area — textarea or Tiptap editor */}
  <textarea 
    value={content} 
    onChange={(e) => setContent(e.target.value)}
    placeholder="Start writing..."
    rows={8}
    className="note-content-input"
  />
</div>
```

**Step 3: Style the title input**

```css
.note-title-input {
  width: 100%;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 22px;
  font-weight: 300;
  color: rgba(250, 250, 250, 0.95);
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 8px 0 12px 0;
  margin-bottom: 16px;
  outline: none;
  letter-spacing: 0.02em;
}

.note-title-input::placeholder {
  color: rgba(255, 255, 255, 0.2);
  font-style: italic;
}

.note-title-input:focus {
  border-bottom-color: rgba(0, 212, 255, 0.2);
}
```

**Step 4: Add title to the note list/card display**

Wherever notes are listed (sidebar, note view, etc.), show the title:

```tsx
// In note list item:
<div className="note-list-item">
  <span className="note-title">{note.title || 'Untitled'}</span>
  <span className="note-date">{formatDate(note.updated_at)}</span>
</div>
```

**Step 5: Save title to database**

Ensure the create and update functions include the title field:

```typescript
// Create note
const { data, error } = await supabase
  .from('documents')  // or 'notes' or whatever the table is
  .insert({
    world_id: activeWorldId,
    user_id: userId,
    title: title || 'Untitled',
    content: content,
  });

// Update note title
const { error } = await supabase
  .from('documents')
  .update({ title: newTitle, updated_at: new Date().toISOString() })
  .eq('id', noteId);
```

### Verify
After fix:
- Create a new note → title input field is visible and focused at the top
- Type a title → it appears in the note list/sidebar
- Open an existing note → title is editable at the top
- A note created without typing a title shows as "Untitled" in the list
- Title persists after page refresh

---

## Summary of All Three Fixes

| Bug | Fix | Verify By |
|---|---|---|
| Resize expands border only | Inner content element needs `flex: 1` or `height: 100%` to fill resized parent | Drag handle → content area visibly grows |
| Single-line new note | Change from `<input>` to `<textarea rows={8}>` or set `min-height: 160px` | New note shows 6-8 lines immediately |
| No title field on notes | Add title column to DB + title input above content area | Title field visible at top of every note |

**After all three fixes, increment version to 0.5968 and update CHANGELOG.md.**

---

*These worlds exist in you. Waiting to be found.*
