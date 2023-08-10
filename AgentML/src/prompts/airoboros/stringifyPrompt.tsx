"use client";
export function stringifyPrompt(formData: any): string {
  const messages: string[] = formData.messages.map(message => {
    return `${(message.role || 'USER').toUpperCase()}:${message.content || ''}`;
  });
  const newText = `${formData.system || ''}\n${messages.join('\n')}`;
  return newText;
}
