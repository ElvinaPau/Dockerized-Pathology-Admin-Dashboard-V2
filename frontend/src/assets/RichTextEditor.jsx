import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import ResizableImageComponent from "../assets/ResizableImageComponent";
import CustomOrderedList from "../extensions/CustomOrderedList";
import LinkModal from "./LinkModal";
import MenuBar from "./MenuBar";
import axios from "axios";
import "../css/RichTextEditor.css";

function RichTextEditor({ value = "", onChange }) {
  const [linkPosition, setLinkPosition] = useState({ left: 0, top: 0 });
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [defaultLinkText, setDefaultLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: false, // disable default ordered list
      }),
      CustomOrderedList, // custom ordered list supporting a,b,c / i,ii,iii
      ResizableImageComponent,
      Link.configure({ openOnClick: true }),
      TextAlign.configure({ types: ["paragraph", "heading", "listItem"] }),
      Underline,
    ],
    content: value, // Set initial content from prop
    editorProps: {
      handlePaste: async (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let item of items) {
          if (item.type.includes("image")) {
            const file = item.getAsFile();
            const formData = new FormData();
            formData.append("image", file);

            try {
              const res = await axios.post(
                "http://localhost:5001/api/uploads/image",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
              );
              const imageUrl = res.data.url;
              Promise.resolve().then(() => {
                editor
                  .chain()
                  .focus()
                  .setResizableImage({ src: imageUrl })
                  .run();
              });
            } catch (err) {
              console.error("Image upload failed:", err);
            }

            return true; // handled
          }
        }

        return false;
      },

      handleDrop: async (view, event, slice, moved) => {
        const files = Array.from(event.dataTransfer?.files || []);
        for (let file of files) {
          if (file.type.startsWith("image/")) {
            const formData = new FormData();
            formData.append("image", file);

            try {
              const res = await axios.post(
                "http://localhost:5001/api/uploads/image",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
              );
              const imageUrl = res.data.url;
              Promise.resolve().then(() => {
                editor
                  .chain()
                  .focus()
                  .setResizableImage({ src: imageUrl })
                  .run();
              });
            } catch (err) {
              console.error("Image upload failed:", err);
            }
          }
        }
        return false;
      },
    },

    onUpdate: ({ editor }) => {
      // Trigger onChange callback when content changes
      if (onChange) {
        const html = editor.getHTML();
        onChange(html);
      }
    },
  });

  // Sync editor content when value prop changes (for editing mode)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const openLinkModal = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    setDefaultLinkText(selectedText);
    setLinkUrl("");
    const coords = editor.view.coordsAtPos(from);
    setLinkPosition({ left: coords.left, top: coords.bottom + window.scrollY });
    setIsLinkModalOpen(true);
  };

  const insertLink = (text, url) => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .deleteSelection()
      .insertContent({
        type: "text",
        text,
        marks: [{ type: "link", attrs: { href: url } }],
      })
      .run();
    setIsLinkModalOpen(false);
  };

  return (
    <div className="editor-wrapper">
      <MenuBar editor={editor} openLinkModal={openLinkModal} />

      <div
        className="editor-container"
        onClick={() => editor?.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>

      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onInsert={insertLink}
        defaultText={defaultLinkText}
        defaultUrl={linkUrl}
        position={linkPosition}
      />
    </div>
  );
}

export default RichTextEditor;
