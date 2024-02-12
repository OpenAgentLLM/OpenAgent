"use client";

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react';
// import { AutoTokenizer } from '@xenova/transformers';
// Import AutoTokenizer as client side library

// Import Tokenizer as SSR disabled React component for Next.js
// import dynamic from 'next/dynamic';
// const Tokenizer = dynamic(() => import('../components/Tokenizer').then(mod => mod.Tokenizer), { ssr: false });
import { Tokenizer } from '../components/Tokenizer';
import validator from '@rjsf/validator-ajv8';
import Form from '@rjsf/core';
import nearley from 'nearley';

// import schema from '../components/json-schema.json';
// import uiSchema from '../components/ui-schema.json';
// import schema from '../prompts/v0.2/json-schema.json';
// import uiSchema from '../prompts/v0.2/ui-schema.json';
// import schema from '../prompts/airoboros/json-schema.json';
// import uiSchema from '../prompts/airoboros/ui-schema.json';
// import { stringifyPrompt } from '../prompts/airoboros/stringifyPrompt';
// const grammar = require("../prompts/airoboros/grammar");

import { jsonSchema, uiSchema, stringifyPrompt, grammar } from '../prompts/airoboros';

function parseTextWithGrammar(text: string): [Error | null, any[] | null] {
  // Create a Parser object from our grammar.
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

  // Parse something!
  // parser.feed(`USER:hey
  // ASSISTANT:ello
  // USER:hey
  // ASSISTANT:ello

  // USER:hey
  // ASSISTANT:ello
  // USER:hey
  // ASSISTANT:ello`);
  try {
    parser.feed(text);

    // parser.results is an array of possible parsings.
    console.log('parser', parser);
    console.log((parser.results)); // [[[[["foo"],"\n"]]]]
    return [null, parser.results.flat(2)];
  } catch (error: any) {
    console.error(error);
    return [error, null];
  }
}

const log = (type) => console.log.bind(console, type);

export default function Home() {

  const [text, setText] = useState('');
  const [json, setJson] = useState({});

  const [parsedError, parsed] = useMemo(() => parseTextWithGrammar(text), [text]);
  // console.log('parsed', parsed);

  // const json = parsed.length > 0 ? {
  //   system: parsed[0].system,
  //   messages: parsed[0].messages,
  // } : {};

  const updateJson = useCallback((text: string) => {
    const [parsedError, parsed] = parseTextWithGrammar(text);
    console.log('parsed', { parsedError, parsed });

    if (!parsed
      || (Array.isArray(parsed) && parsed.length === 0)
    ) {
      return;
    }

    const nextJson = parsed.length > 0 ? {
      system: parsed[0].system,
      messages: parsed[0].messages,
    } : {};
    setJson(nextJson);
  }, [setJson]);

  const setTextAndJson = useCallback((text: string) => {
    setText(text);
    updateJson(text);
  }, [setText, updateJson]);

  // useEffect(() => {
  //   (async () => {
  //     const { AutoTokenizer } = await import("@xenova/transformers");
  //     console.log('AutoTokenizer', AutoTokenizer);
  //     let tokenizer = await AutoTokenizer.from_pretrained('bert-base-uncased');
  //     let { input_ids } = await tokenizer('I love transformers!');
  //     console.log(input_ids);
  //   })();
  // }, []);

  const onSchemaFormChanged = useCallback((event) => {
    console.log('onSchemaFormChanged', event);
    const { formData } = event;

    const newText = stringifyPrompt(formData);
    console.log('newText', newText);
    setText(newText);
    setJson(formData);
  }, [setText, setJson]);

  return (
    // <main className="flex min-h-screen flex-col items-center justify-between p-24">
    <main>

      {/* <div className="mx-auto w-full max-w-7xl grow lg:flex xl:px-2"> */}
      <div className="mx-auto w-full grow lg:flex xl:px-2">
        {/* Left sidebar & main wrapper */}
        {/* <div className="flex-1 xl:flex"> */}
        <div className="flex-1 flex">
          {/* <div className="columns-2"> */}
          <div className="w-full h-screen overflow-y-scroll">
            {/* <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">*/}
            <Form
              className="schema-form"
              schema={jsonSchema}
              uiSchema={uiSchema}
              validator={validator}
              // onChange={log('changed')}
              onChange={onSchemaFormChanged}
              onSubmit={log('submitted')}
              onError={log('errors')}
              formData={json}
            />
          </div>

          {/* <div className="border-b border-gray-200 px-4 py-6 sm:px-6 lg:pl-8 xl:w-64 xl:shrink-0 xl:border-b-0 xl:border-r xl:pl-6"> */}
          {/* <div className="border-b border-gray-200 px-4 py-6 sm:px-6 lg:pl-8 xl:border-b-0 xl:border-r xl:pl-6"> */}
          <div className="w-full h-screen overflow-y-scroll">
            {/* Left column area */}

            <Tokenizer
              text={text}
              setText={setTextAndJson}
              />

            {parsedError && (
              <pre>
                {parsedError.toString()}
              </pre>
            )}
            <pre>
              {/* {JSON.stringify(text)} */}
              {/* {JSON.stringify(parsed, null, 2)} */}
              {/* {JSON.stringify(json, null, 2)} */}
            </pre>

          </div>

        </div>

        {/* <div className="shrink-0 border-t border-gray-200 px-4 py-6 sm:px-6 lg:w-96 lg:border-l lg:border-t-0 lg:pr-8 xl:pr-6">
          <Tokenizer />
        </div> */}
      </div>

      {/*
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started by editing&nbsp;
          <code className="font-mono font-bold">src/app/page.tsx</code>
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{' '}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px]">
        <Image
          className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
          src="/next.svg"
          alt="Next.js Logo"
          width={180}
          height={37}
          priority
        />
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left">
        <a
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Docs{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Find in-depth information about Next.js features and API.
          </p>
        </a>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800 hover:dark:bg-opacity-30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Learn{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Learn about Next.js in an interactive course with&nbsp;quizzes!
          </p>
        </a>

        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Templates{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Explore the Next.js 13 playground.
          </p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Deploy{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Instantly deploy your Next.js site to a shareable URL with Vercel.
          </p>
        </a>
      </div>
      */}
    </main>
  )
}
