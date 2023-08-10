import { Node } from '@tiptap/pm/model'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { PreTrainedTokenizer } from '@xenova/transformers';

type Token = { content: string, id: number };

export function findTokens({ doc, tokenizer }: { doc: Node; tokenizer: PreTrainedTokenizer | null; }): DecorationSet {

  if (!tokenizer) {
    return DecorationSet.create(doc, []);
  }

  const decorations: Decoration[] = []

  // console.log('findTokens', doc, tokenizer);

  doc.descendants((node, position) => {
    if (!node.text) {
      return
    }

    // console.log('findTokens nodes', { node, position });

    const text = node.text;
    const tokenIds = tokenizer.encode(text);
    const tokens = tokenizer.batch_decode(tokenIds.map((id) => [id]), {
      clean_up_tokenization_spaces: false, // Didn't work
    });

    let tokenPairs: Token[] = tokenIds.map((tokenId, i): Token => ({ content: tokens[i], id: tokenId }));
    // If first token content is "<s>" then remove it otherwise keep all
    if (tokenPairs?.[0]?.content === '<s>') {
      tokenPairs = tokenPairs.slice(1);
    }

    // console.log('findTokens tokens', { tokens, tokenPairs, text });

    tokenPairs.reduce((offsetIndex, tokenPair) => {
      // Find index of first occurence of token
      const remainingText = text.slice(offsetIndex);
      const startIndex = remainingText.indexOf(tokenPair.content);
      const endIndex = startIndex + tokenPair.content.length;

      // Create decoration
      const color = tokenNumberToColor(tokenPair.id);
      const from = position + offsetIndex
      const to = position + offsetIndex + endIndex
      const decoration = Decoration.inline(from, to, {
        class: 'color',
        style: `--color: ${color}; background-color: ${color}`
      })
      decorations.push(decoration);

      // Remove text up to end of token
      return offsetIndex + endIndex;

    }, 0);
  })

  return DecorationSet.create(doc, decorations)
}

function tokenNumberToColor(number: number) {
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
