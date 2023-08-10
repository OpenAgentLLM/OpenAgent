'use client'

import { useEditor, Editor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { ColorHighlighter } from './ColorHighlighter'

export const Tiptap = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ColorHighlighter,
    ],
    // content: '<p>Your content here: #FFF, #0D0D0D, #616161, #A975FF, #FB5151, #FD9170, #FFCB6B, #68CEF8, #80cbc4, #9DEF8F</p>',
    content: newlinewsToParagraphs(`<|header|>
<|goal|>Create a list of current open-source LLMs
<|tools|>
<|tool|>1
search
Use this tool to search the internet for websites, the result is a JSON list of search results with URLs
<|tool|>2
browse
Use this tool to get the content of a website with a given URL
<|context|>
The current date is 2023-06-02
<|execution|>
I need to find information about current open-source large language models as of June 2023
<|actions_start|>
<|action|>1
<|use_tool|>1
open-source llms june 2023
<|action|>2
<|use_tool|>1
open-source large language models
<|actions_end|>
<|observations_start|>
<|observation|>1
{search_result_1}
<|observation|>2
{search_result_2}
<|observations_end|>
`)
  });

  return <EditorContent editor={editor} />;
};

function newlinewsToParagraphs(text) {
  return text.split('\n').map(line => `<p>${line}</p>`).join('');
}
