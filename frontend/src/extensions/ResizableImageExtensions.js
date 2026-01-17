import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ResizableImageComponent from "../assets/ResizableImageComponent";

const ResizableImageExtensions = Node.create({
  name: "resizableImage",

  group: "block",
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: 200 },
      height: { default: 200 },
      x: { default: 0 },
      y: { default: 0 },
    };
  },

  // This ensures TipTap reads back the attributes on reload
  parseHTML() {
    return [
      {
        tag: "img[data-type='resizableImage']",
        getAttrs: (element) => ({
          src: element.getAttribute("src"),
          width: parseInt(element.getAttribute("width")) || 200,
          height: parseInt(element.getAttribute("height")) || 200,
          x: parseInt(element.getAttribute("data-x")) || 0,
          y: parseInt(element.getAttribute("data-y")) || 0,
        }),
      },
    ];
  },

  // This ensures TipTap saves them when serializing to HTML
  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        "data-type": "resizableImage",
        src: HTMLAttributes.src,
        width: HTMLAttributes.width,
        height: HTMLAttributes.height,
        "data-x": HTMLAttributes.x,
        "data-y": HTMLAttributes.y,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export default ResizableImageExtensions;
