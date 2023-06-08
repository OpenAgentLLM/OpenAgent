"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { PreTrainedTokenizer, AutoTokenizer } from '@xenova/transformers';
import { debounce } from 'lodash';
import { getModelJSON } from '@xenova/transformers/src/utils/hub';

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
]

const showTokenIds = false;
const supportedModels: string[] = [
  'huggyllama/llama-7b',
  // 'tiiuae/falcon-7b',
  'mosaicml/mpt-7b',
];

export function Tokenizer() {

  const [text, setText] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);

  const [model, setModel] = useState(supportedModels[0]);

  const tokenizer = useTokenizer(model, { customTokens });

  // Debounce updating tokens based on text with callback cache
  const onUpdateTokens = useCallback(async (text: string) => {
    if (!tokenizer || !text) return;
    const tokenIds = await tokenizer.encode(text);
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

  useEffect(() => {
    onUpdateTokensDebounced(text);
  }, [onUpdateTokensDebounced, text]);

  const onChange = (e: any) => {
    const nextText = e.target.value;
    setText(nextText);
    onUpdateTokensDebounced(nextText);
  };

  return <div className="grid grid-cols-2 gap-4">
    <div>
      <textarea value={text} onChange={onChange} className="text-black h-full w-full" />
    </div>
    <div>
      <div>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          {supportedModels.map((model) => <option key={model} value={model}>{model}</option>)}
        </select>
      </div>
      <div># tokens: {tokens.length}</div>
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