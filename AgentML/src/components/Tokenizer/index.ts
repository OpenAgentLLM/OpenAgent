import dynamic from 'next/dynamic';

// export * from './Tokenizer';

export const Tokenizer = dynamic(() => import('./Tokenizer').then(mod => mod.Tokenizer), { ssr: false });
