"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PreTrainedTokenizer, AutoTokenizer } from '@xenova/transformers';
import { debounce } from 'lodash';
import { getModelJSON } from '@xenova/transformers/src/utils/hub';
import { useEditor, Editor, EditorContent, EditorEvents } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'

import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'

import { findTokens } from './findTokens';

type Token = { content: string, id: number };

const customTokens: string[] = [
  "<|header|>",
  "<|goal|>",
  "<|tools|>",
  "<|tool|>",
  "<|context|>",
  "<|execution|>",
  "<|actions_start|>",
  "<|action|>",
  "<|use_tool|>",
  "<|actions_end|>",
  "<|observations_start|>",
  "<|observation|>",
  "<|observations_end|>",
  "USER:",
  "ASSISTANT:",
  "BEGININPUT",
  "BEGINCONTEXT",
  "ENDCONTEXT",
  "ENDINPUT",
  "BEGININSTRUCTION",
  "ENDINSTRUCTION",
];

const showTokenIds = false;
const supportedModels: string[] = [
  'mistralai/Mixtral-8x7B-v0.1',
  'huggyllama/llama-7b',
  // 'tiiuae/falcon-7b',
  'mosaicml/mpt-7b',
];

export interface TokenizerProps {
  text: string;
  // setText: React.Dispatch<React.SetStateAction<string>>;
  setText: (text: string) => void;
}

export function Tokenizer({ text, setText }: TokenizerProps) {

  // const [text, setText] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);

  const [model, setModel] = useState(supportedModels[0]);

  const tokenizer = useTokenizer(model, { customTokens });

  // Debounce updating tokens based on text with callback cache
  const onUpdateTokens = useCallback(async (text: string) => {
    if (!tokenizer || !text) return;
    const tokenIds = tokenizer.encode(text);
    const tokens = tokenizer.batch_decode(tokenIds.map((id) => [id]), {
      clean_up_tokenization_spaces: false, // Didn't work
    });

    const tokenPairs: Token[] = tokenIds.map((tokenId, i): Token => ({ content: tokens[i], id: tokenId }));

    // If first token content is "<s>" then remove it otherwise keep all
    if (tokenPairs?.[0]?.content === '<s>') {
      setTokens(tokenPairs.slice(1));
    } else {
      setTokens(tokenPairs);
    }
  }, [tokenizer]);

  const onUpdateTokensDebounced = useCallback(debounce(onUpdateTokens, 200, { 'maxWait': 500 }), [onUpdateTokens]);

  // useEffect(() => {
  //   onUpdateTokensDebounced(text);
  // }, [onUpdateTokensDebounced, text]);

  // const onChange = (e: any) => {
  //   const nextText = e.target.value;
  //   setText(nextText);
  //   onUpdateTokensDebounced(nextText);
  // };

  const onEditorUpdate = ({ editor: currentEditor }: EditorEvents['update']) => {
    let nextText = (currentEditor.getText({
      // blockSeparator: '\n',
      blockSeparator: '',
      textSerializers: {
        'paragraph': ({ node, parent }) => {
          // console.log('paragraph node', { node, parent });
          if (node.content.size === 0) {
            return '\n';
          }
          return '';
        },
        'text': ({ node, pos, parent, index }) => {
          // console.log('text node', { node, parent });
          const nonBreakingSpace = ' ';
          const text = (node.text || '')
            .replaceAll(nonBreakingSpace, ' ');
          if (parent?.type.name === 'paragraph') {
            return `${text}\n`;
          }
          return text;
          // return node?.text?.slice(Math.max(from, pos) - pos, to - pos) // eslint-disable-line
        }
      }
    }) || '')
    const nextHTML = currentEditor.getHTML();
    // console.log('onEditorUpdate', { nextText, nextHTML });
    console.log('onEditorUpdate nextText');
    console.log(nextText);
    console.log('onEditorUpdate nextHTML');
    console.log(nextHTML);
    
    // Remove last \n
    if (!nextHTML.endsWith('<p></p>')) {
      nextText = nextText.slice(0, -1);
    }

    setText(nextText);
    onUpdateTokensDebounced(nextText);
  };

  // console.log('tokens', tokens);

  const contentHtml = newlinewsToParagraphs(text);
  console.log('contentHtml');
  console.log(contentHtml);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Document,
      Paragraph,
      Text,
      useTokenHighlighter({ tokenizer }),
    ],
    onUpdate: onEditorUpdate,
    content: contentHtml,
    // content: '<p>Your content here: #FFF, #0D0D0D, #616161, #A975FF, #FB5151, #FD9170, #FFCB6B, #68CEF8, #80cbc4, #9DEF8F</p>',
    //     content: newlinewsToParagraphs(`<|header|>
    // <|goal|>Create a list of current open-source LLMs
    // <|tools|>
    // <|tool|>1
    // search
    // Use this tool to search the internet for websites, the result is a JSON list of search results with URLs
    // <|tool|>2
    // browse
    // Use this tool to get the content of a website with a given URL
    // <|context|>
    // The current date is 2023-06-02
    // <|execution|>
    // I need to find information about current open-source large language models as of June 2023
    // <|actions_start|>
    // <|action|>1
    // <|use_tool|>1
    // open-source llms june 2023
    // <|action|>2
    // <|use_tool|>1
    // open-source large language models
    // <|actions_end|>
    // <|observations_start|>
    // <|observation|>1
    // {search_result_1}
    // <|observation|>2
    // {search_result_2}
    // <|observations_end|> 
    // `)
    // }, [tokenizer, text]);
  });

  // useEffect(() => {
  //   editor?.commands.setContent(contentHtml);
  // }, [editor, contentHtml]);

  useEffect(() => {
    if (!editor) return;
    let { from, to } = editor.state.selection;
    editor.commands.setContent(contentHtml,
      false, {
      preserveWhitespace: "full"
    });
    editor.commands.setTextSelection({ from, to });
  }, [editor, contentHtml, tokenizer]);

  return <div>
    {/* <div className="grid grid-cols-2 gap-4"> */}
    <div>
      <div>
        <div>
          <div>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {supportedModels.map((model) => <option key={model} value={model}>{model}</option>)}
            </select>
          </div>
          <div># tokens: {tokens.length}</div>
        </div>
        {/*
        <div>
          <div>
            {tokens.map((token, i) => <TokenVisualizer key={i} model={model} token={token} />)}
          </div>
          {showTokenIds && (
            <div>
              [
              {tokens.map((token, i) => <React.Fragment key={i}><TokenVisualizer key={i} model={model} token={{ ...token, content: token.id.toString() }} />, </React.Fragment>)}
              ]
            </div>
          )}
        </div>
        */}
      </div>
    </div>
    <div
    // className="min-h-[500px]"
    >
      {/* <textarea value={text} onChange={onChange} className="text-black h-full w-full" /> */}
      <EditorContent editor={editor} />
    </div>
  </div>;
}

function TokenVisualizer({ token, model }: { token: Token; model: string; }) {
  return <span
    title={`Content: ${JSON.stringify(token.content)}\nID: ${token.id.toString()}`}
    style={{
      background: numberToColor(token.id),
      fontFamily: 'monospace',
      whiteSpace: 'pre',
      // FYI: It is expected prefix whitespace is removed in LLaMA tokenizer decoding: https://github.com/huggingface/transformers/issues/22710#issuecomment-1504897237
      paddingLeft: model === 'huggyllama/llama-7b' ? '0.25rem' : undefined,
    }}
  >
    {token.content === '\n' ? <br /> : token.content}
  </span>
}

function useTokenizer(modelName: string, { customTokens = [] }: { customTokens?: string[]; } = {}) {
  const [tokenizerMap, setTokenizerMap] = useState<{ [key: string]: PreTrainedTokenizer }>({});

  const cacheKey = `${modelName}-${JSON.stringify(customTokens)}`;
  useEffect(() => {
    console.log('useTokenizer', modelName);

    const cb = async () => {

      if (tokenizerMap[cacheKey]) {
        console.log('useTokenizer already loaded', modelName);
        return;
      }

      // let [tokenizerJSON, tokenizerConfig] = await loadTokenizer(modelName);
      // console.log("tokenizerJSON", tokenizerJSON);
      // console.log("tokenizerConfig", tokenizerConfig);

      // const newTokenizer = await AutoTokenizer.from_pretrained(modelName);
      const newTokenizer = await createTokenizerFrom(modelName, {
        customTokens,
      });
      console.log('newTokenizer', typeof newTokenizer, newTokenizer);
      setTokenizerMap((prevTokenizerMap) => ({ ...prevTokenizerMap, [cacheKey]: newTokenizer }));
    };
    cb();

    return () => {
      console.log('useTokenizer cleanup');
    };
  }, [cacheKey]);

  return tokenizerMap[cacheKey] ?? null;
}

async function createTokenizerFrom(pretrained_model_name_or_path: string, {
  quantized = true,
  progress_callback = null,
  config = null,
  cache_dir = null,
  local_files_only = false,
  revision = 'main',
  customTokens = [] as string[],
} = {}) {

  let [tokenizerJSON, tokenizerConfig] = await loadTokenizer(pretrained_model_name_or_path, {
    quantized,
    progress_callback,
    config,
    cache_dir,
    local_files_only,
    revision,
  })

  // Some tokenizers are saved with the "Fast" suffix, so we remove that if present.
  let tokenizerName = tokenizerConfig.tokenizer_class.replace(/Fast$/, '');

  let cls = AutoTokenizer.TOKENIZER_CLASS_MAPPING[tokenizerName as keyof typeof AutoTokenizer.TOKENIZER_CLASS_MAPPING];
  if (!cls) {
    console.warn(`Unknown tokenizer class "${tokenizerName}", attempting to construct from base class.`);
    cls = PreTrainedTokenizer;
  }

  console.log('tokenizerName', tokenizerName);

  const highestId = Math.max(...Object.values<number>(tokenizerJSON.model.vocab));

  const customTokensInfo = customTokens.map((token, i) => ({
    id: highestId + i + 1,
    content: token,
    single_word: false,
    lstrip: false,
    rstrip: false,
    normalized: true,
    special: false,
  }));
  tokenizerJSON.added_tokens = [...tokenizerJSON.added_tokens, ...customTokensInfo];

  return new cls(tokenizerJSON, tokenizerConfig);
}

async function loadTokenizer(pretrained_model_name_or_path: string, options?: any): Promise<[any, any]> {
  let info = await Promise.all([
    getModelJSON(pretrained_model_name_or_path, 'tokenizer.json', true, options),
    getModelJSON(pretrained_model_name_or_path, 'tokenizer_config.json', true, options),
  ])
  return info;
}

function numberToColor(number: number) {
  const goldenRatioConjugate = 0.618033988749895;

  // Constants for a linear congruential generator (LCG)
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);

  // Generate a pseudorandom number using the LCG.
  const pseudorandom = (a * number + c) % m;

  // Compute a hue value using the golden angle.
  const hue = ((pseudorandom * goldenRatioConjugate) % 1) * 360;

  // Allow saturation to vary between 60% and 100%.
  const s = 60 + (pseudorandom % 21);

  // Allow lightness to vary between 70% and 90%.
  const l = 70 + (pseudorandom % 21);

  return `hsl(${hue}, ${s}%, ${l}%)`;
}

function newlinewsToParagraphs(text: string): string {
  if (!text) {
    return '';
  }
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  // return lines.slice(0, -1)
  return lines.map(line => `<p>${line}</p>`).join('');
}

function useTokenHighlighter({ tokenizer }: { tokenizer: PreTrainedTokenizer; }) {
  const tokenizerRef = useRef<PreTrainedTokenizer | null>(null);
  const [TokenHighlighter] = useState(() => Extension.create({
    name: 'tokenHighlighter',

    addProseMirrorPlugins() {
      return [
        new Plugin({
          state: {
            init(_, { doc }) {
              return findTokens({ doc, tokenizer: tokenizerRef.current });
            },
            apply(transaction, oldState) {
              return transaction.docChanged ? findTokens({ doc: transaction.doc, tokenizer: tokenizerRef.current }) : oldState
            },
          },
          props: {
            decorations(state) {
              return this.getState(state)
            },
          },
        }),
      ]
    },
  }));

  tokenizerRef.current = tokenizer;

  return TokenHighlighter;
}