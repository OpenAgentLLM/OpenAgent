'use client'

import { useEditor, Editor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
// import { Plugin, DecorationSet } from '@tiptap/core';

// import { Editor, Extension } from '@tiptap/core'
import { Node as ProsemirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

import { ColorHighlighter } from './ColorHighlighter'

/*
export const Tiptap = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: '<p>Hello World! 🌎️</p>',
  })

  return (
    <EditorContent editor={editor} />
  )
}
*/

const MyColorPlugin = (colorFunction) => {
  return new Plugin({
    name: 'colorPlugin',
    state: {
      init(_, { doc }) {
        return this.applyDecorations(doc);
      },
      applyDecorations(doc) {
        const decorations = [];
        const textRanges = colorFunction(doc.text);

        textRanges.forEach(({ range, color }) => {
          decorations.push(DecorationSet.create(doc, [
            Decoration.inline(range.start, range.end, {
              style: `color: ${color};`,
            }),
          ]));
        });

        return DecorationSet.create(doc, decorations);
      },
      apply(tr, decorationSet) {
        return decorationSet.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
};

export const Tiptap = () => {
  const yourColorFunction = (text) => {
    // Return text ranges with respective colors based on your logic.
    // Example: [{ range: { start: 0, end: 5 }, color: 'red' }, ...]
    console.log('yourColorfunc', text);
    return [];
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      ColorHighlighter,
    //   MyColorPlugin(yourColorFunction),
    ],
    content: '<p>Your content here: #FFF, #0D0D0D, #616161, #A975FF, #FB5151, #FD9170, #FFCB6B, #68CEF8, #80cbc4, #9DEF8F</p>',
  });

  return <EditorContent editor={editor} />;
};
