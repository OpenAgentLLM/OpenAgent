@{%
	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	const moo = require("moo")
	const lexer = moo.compile({
		//PREFIX: ['PREFIX1:', 'PREFIX2:'],
		//text: { match: /(?:(?!USER:|ASSISTANT:|BEGININPUT|BEGINCONTEXT|ENDCONTEXT|ENDINPUT|BEGININSTRUCTION|ENDINSTRUCTION).)+/, lineBreaks: true },
		//objectKey: /[a-zA-Z0-9]+/,
		//text: { match: /(?:(?!USER:|ASSISTANT:).)+/ },
		//NL: { match: /\n/, lineBreaks: true },

		userPrefix: /USER:/,
		assistantPrefix: /ASSISTANT:/,

		beginInput: /BEGININPUT/,
		beginContext: /BEGINCONTEXT/,
		endContext: /ENDCONTEXT/,
		endInput: /ENDINPUT/,
		beginInstruction: /BEGININSTRUCTION/,
		endInstruction: /ENDINSTRUCTION/,

		//number: /[0-9]+/,
		//times: /\*|times/,
		//word: /[a-zA-Z:]+/,
		//char: /[.\:]/,
		//ws: /[ \n]+/,
		lineBreak: { match: /\n/, lineBreaks: true },
		//char: { match: /(?:.)+/, },
		char: { match: /./, },
		//lineBreaks: /(?:(?:[ \n]+))/
	});
%}

# Pass your lexer with @lexer:
@lexer lexer

#@builtin "whitespace.ne"

Main -> PromptWithSystem | PromptOnlyMessages | PromptOnlySystem {% (d) => d[0] %}

PromptOnlySystem -> SystemPrompt {% (d) => ({ d, system: d[0].content, messages: [] }) %}
#PromptWithSystem -> SystemPrompt "\n" Messages {% (d) => ({ d, system: d[0].content, messages: d[2].flat() }) %}
# PromptWithSystem -> SystemPrompt Messages {% (d) => ({ d, system: d[0].content, messages: flatten(d[2]) }) %}
PromptWithSystem -> SystemPrompt Messages {% (d) => ({ d, system: d[0].content, messages: flatten(d[1]) }) %}
PromptOnlyMessages -> Messages {% (d) => ({ d, system: null, messages: flatten(d[0]) }) %}

SystemPrompt -> Text {% (d) => ({ role: 'system', content: d[0] }) %}
#Messages -> Message | Message "\n" Messages {% (d) => d.filter(v => v !== '\n' ).flat(2) %}
#Message -> UserPrompt | UserPrompt "\n" AssistantPrompt {% (d) => d.filter(v => v !== '\n' ).flat(1) %}

Messages -> Message:+ {% (d) => flatten(d.filter(v => v !== '\n' ), 2) %}
Message -> UserPrompt | UserPrompt AssistantPrompt {% (d) => flatten(d.filter(v => v !== '\n' )) %}

#UserPrompt -> "USER:" Text:? {% (d) => ({ role: 'user', content: d[1] }) %}
#UserPrompt -> "USER:" UserContent:? {% (d) => ({ role: 'user', content: d[1] }) %}
UserPrompt -> %userPrefix UserContent:? {% (d) => ({ role: 'user', content: d[1] }) %}
#AssistantPrompt -> "ASSISTANT:" Text:? {% (d) => ({ role: 'assistant', content: d[1] }) %}
# AssistantPrompt -> %assistantPrefix Text:? {% (d) => ({ role: 'assistant', content: d[1] }) %}
AssistantPrompt -> %assistantPrefix Text:? {% (d) => ({ role: 'assistant', content: { text: d[1] } }) %}

# UserContent -> Text {% (d) => d[0] %}
UserContent -> Text {% (d) => ({ text: d[0] }) %}
#UserContent -> UserContext _ InputBlock:* _ Text:?
#UserContent -> Text _ InputBlock:* _ UserContent:?
UserContent -> _ InputBlock:* _ InstructionBlock _ {% (d) => ({ inputs: d[1], instruction: d[3]?.instruction }) %}

# Text -> %text {% (d) => d[0].value %}
#Text -> %char:+ {% (d) => d %}
TextWithoutNewline -> Char:+ {% (d) => d[0].join('') %}
# Text -> TextWithoutNewline
Char -> %char {% (d) => d[0].value %}
#Text -> %char:+ {% (d) => d[0].value %}
# Text -> Text LineBreak:+ {% (d) => d[0] + (d[1] || '').join('') %}
# Text -> LineBreak:+ Text {% (d) => (d[0] || '').join('') + d[1] %}

CharWithNewline -> Char
CharWithNewline -> LineBreak
Text -> CharWithNewline:+ {% (d) => d[0].join('') %}

# Text -> Text LineBreak:+ {% (d) => d[0] + (d[1] || '').join('') %}


# Text -> Text LineBreak:+ {% (d) => [d[0], d[1]].filter(Boolean).join('') %}
# Text -> Text LineBreak:+ {% (d) => [d[0], '\n', d[2]].filter(Boolean).join('') %}
# Text -> Text %lineBreak:+ {% (d) => [d[0], '\n', d[2]].filter(Boolean).join('') %}
#Text -> Line:+

#Line -> %char:+ {% (d) => [d[0], '\n', d[2]].filter(Boolean).join('') %}
#Line -> %lineBreak:+ {% (d) => [d[0], '\n', d[2]].filter(Boolean).join('') %}
#Line -> %char:+ %lineBreak:+ {% (d) => [d[0], '\n', d[2]].filter(Boolean).join('') %}
#Line -> %char:* %lineBreak:* {% (d) => [d[0], '\n', d[2]].filter(Boolean).join('') %}

#Text -> Text %lineBreak:+ %text:? {% (d) => [d[0], '\n', d[2]].filter(Boolean).join('') %}
# Text -> Text %lineBreak:? TextWithoutNewline:?
# TextWithoutNewline -> %text {% (d) => d[0].value %}

#Text -> %text {% (d) => d[0].value %}

#Text -> [ a-zA-Z0-9\n!?.\-'",]:+ {% (d) => d[0].join('') %}
# Text -> [ a-zA-Z0-9\n!?.\-'",\:]:+ {% (d) => d[0].join('') %}
# Text -> .:+ {% (d) => d[0].join('') %}

# InputBlock -> %beginInput _ %beginContext %lineBreak InputContextProp:* %endContext _ Text _ %endInput _ {% (d) => ({ context: d[4], content: d[8] }) %}
# InputBlock -> %beginInput _ %beginContext %lineBreak InputContextProp:* %endContext %lineBreak Text %lineBreak %endInput _ {% (d) => ({ context: d[4], content: d[8] }) %}
#InputBlock -> %beginInput _ %beginContext %lineBreak InputContextProp:* %endContext %lineBreak Text:? %lineBreak %endInput _ {% (d) => ({ context: d[4], content: d[7] }) %}
#InputBlock -> %beginInput %lineBreak %beginContext %lineBreak InputContextProp:* %endContext %lineBreak Text:? %lineBreak %endInput %lineBreak {% (d) => ({ context: d[4], content: d[7] }) %}
#InputBlock -> %beginInput %lineBreak %beginContext %lineBreak %endContext %lineBreak %endInput %lineBreak {% (d) => ({ context: d[4], content: d[7] }) %}
InputBlock -> %beginInput %lineBreak:+ InputContextBlock %lineBreak Text:? %lineBreak %endInput %lineBreak {% (d) => ({ context: d[2], content: d[4] }) %}
InputBlock -> %beginInput %lineBreak:+ InputContextBlock %lineBreak:+ %endInput %lineBreak {% (d) => ({ context: d[2], content: null }) %}


InputContextBlock -> %beginContext %lineBreak InputContextProp:* %endContext {% (d) => d[2] %}
InputContextBlock -> %beginContext %lineBreak:+ %endContext {% (d) => null %}

#InputBlock -> %beginInput _ %beginContext _ InputContextProp:* _ %endContext _ Text _ %endInput _ {% (d) => ({ context: d[4], content: d[8] }) %}
#InputBlock -> %beginInput _ %beginContext _ %endContext _ Text _ %endInput _ #{% (d) => ({ content: d[6] }) %}
#InputBlock -> "BEGININPUT" _ "BEGINCONTEXT" _ "ENDCONTEXT" _ Text _ "ENDINPUT" {% (d) => ({ content: d }) %}
#InputBlock -> "BEGININPUT"
#InputBlock -> %beginInput _ %beginContext _ %endContext _ Text _ %endInput _ %beginInstruction Text %endInstruction {% (d) => ({ content: d[6] }) %}

#InputContext -> Text
#InputContext -> InputContextProp:*
#InputContextProp -> _ Text ":" Text _ #{% (d) => ({ key: d[0], value: d[2] }) %}
# InputContextProp -> _ ObjectKey ":" Text _ #{% (d) => ({ key: d[0], value: d[2] }) %}
#InputContextProp -> "Broken" #{% (d) => ({ key: d[0], value: d[2] }) %}
# InputContextProp -> _ ObjectKey ":" Text %lineBreak:? {% (d) => ({ key: d[1], value: d[3] }) %}
InputContextProp -> _ ObjectKey ":" ObjectValue %lineBreak {% (d) => ({ key: d[1], value: d[3] }) %}
# InputContextProp -> _ ObjectKey ":" %text %lineBreak:? #{% (d) => ({ key: d[0], value: d[2] }) %}

# ObjectKey -> [a-zA-Z0-9]:+
# ObjectKey -> %char:+
ObjectKey -> TextWithoutNewline {% (d) => d[0] %}
# ObjectValue -> %char:+
ObjectValue -> Text {% (d) => d[0] %}

LineBreak -> %lineBreak {% (d) => d[0].value %}

#InstructionBlock -> %beginInstruction %lineBreak:? Text %endInstruction {% (d) => ({ instruction: d }) %}
#InstructionBlock -> %beginInstruction %lineBreak:? Text %endInstruction {% (d) => ({ instruction: d[2] }) %}
InstructionBlock -> %beginInstruction %lineBreak Text %lineBreak %endInstruction {% (d) => ({ instruction: d[2] }) %}
InstructionBlock -> %beginInstruction %lineBreak:+ %endInstruction {% (d) => ({ instruction: null }) %}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% function(d) {return null;} %}
__ -> wschar:+ {% function(d) {return null;} %}
wschar -> [ \t\n] {% id %}

@{%

function flatten(arr, depth = 1) {
    if (!Array.isArray(arr)) {
        throw new Error(`Is not an array: ${arr.toString()}`);
    }
    return arr.flat(depth);
}

%}
