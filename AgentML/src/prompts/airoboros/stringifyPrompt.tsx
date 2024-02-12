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
  if (typeof content === 'string') {
    return content;
  }
  if (typeof content == 'object' && content.text) {
    return content.text;
  }
  const inputs = (content.inputs || []).map((input: any) => {
    const context = (input.context || []).map(({ key, value }) => `${key}:${value}`).join('\n');
    return `BEGININPUT
BEGINCONTEXT
${context}
ENDCONTEXT
${input.content || ''}
ENDINPUT`;
  });
  return `\n${inputs.join('\n')}
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
