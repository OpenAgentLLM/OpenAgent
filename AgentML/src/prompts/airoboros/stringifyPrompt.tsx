export function stringifyPrompt(formData: any): string {
  const messages: string[] = formData.messages.map(message => {
    const content = message.content;
    const contentText = typeof content === 'object' ? stringifyInputBlocksWithInstructions(content) : content || '';
    return `${(message.role || 'USER').toUpperCase()}:${contentText}`;
  });
  const systemPrompt = formData.system ? `${formData.system}\n` : '';
  const newText = `${systemPrompt}${messages.join('\n')}`;
  return newText;
}

function stringifyInputBlocksWithInstructions(content: any): string {
  const inputs = (content.inputs || []).map((input: any) => {
    return `
BEGININPUT
BEGINCONTEXT
ENDCONTEXT
${input.content || ''}
ENDINPUT
`;
  });
  return `${inputs.join('\n')}
BEGININSTRUCTION
${content.instruction || ''}
ENDINSTRUCTION`;
}

/*
content: Object
inputs: Array[1]
0: Object
content: " Insert your block of text here "
instruction: Object
instruction: " Insert instructions here "
*/
