@{%
	// Moo lexer documention is here:
	// https://github.com/no-context/moo

	const moo = require("moo")
	const lexer = moo.compile({
		//PREFIX: ['PREFIX1:', 'PREFIX2:'],
		text: { match: /(?:(?!USER:|ASSISTANT:|BEGININPUT|BEGINCONTEXT|ENDCONTEXT|ENDINPUT|BEGININSTRUCTION|ENDINSTRUCTION).|\n)+/, lineBreaks: true },
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
		word: /[a-zA-Z:]+/,
		//char: /[.\:]/,
		//ws: /[ \n]+/,
		//lineBreaks: /(?:(?:[ \n]+))/
	});
%}

# Pass your lexer with @lexer:
@lexer lexer

#@builtin "whitespace.ne"

Main -> PromptWithSystem | PromptOnlyMessages | PromptOnlySystem {% (d) => d[0] %}

PromptOnlySystem -> SystemPrompt {% (d) => ({ d, system: d[0].content, messages: [] }) %}
#PromptWithSystem -> SystemPrompt "\n" Messages {% (d) => ({ d, system: d[0].content, messages: d[2].flat() }) %}
PromptWithSystem -> SystemPrompt Messages {% (d) => ({ d, system: d[0].content, messages: d[2].flat() }) %}
PromptOnlyMessages -> Messages {% (d) => ({ d, system: null, messages: d[0].flat() }) %}

SystemPrompt -> Text {% (d) => ({ role: 'system', content: d[0] }) %}
#Messages -> Message | Message "\n" Messages {% (d) => d.filter(v => v !== '\n' ).flat(2) %}
#Message -> UserPrompt | UserPrompt "\n" AssistantPrompt {% (d) => d.filter(v => v !== '\n' ).flat(1) %}


Messages -> Message:+ {% (d) => d.filter(v => v !== '\n' ).flat(2) %}
Message -> UserPrompt | UserPrompt AssistantPrompt {% (d) => d.filter(v => v !== '\n' ).flat(1) %}

#UserPrompt -> "USER:" Text:? {% (d) => ({ role: 'user', content: d[1] }) %}
#UserPrompt -> "USER:" UserContent:? {% (d) => ({ role: 'user', content: d[1] }) %}
UserPrompt -> %userPrefix UserContent:? {% (d) => ({ role: 'user', content: d[1] }) %}
#AssistantPrompt -> "ASSISTANT:" Text:? {% (d) => ({ role: 'assistant', content: d[1] }) %}
AssistantPrompt -> %assistantPrefix Text:? {% (d) => ({ role: 'assistant', content: d[1] }) %}

UserContent -> Text {% (d) => d[0] %}
#UserContent -> UserContext _ InputBlock:* _ Text:?
#UserContent -> Text _ InputBlock:* _ UserContent:?
UserContent -> _ InputBlock:* _ InstructionBlock _ {% (d) => ({ inputs: d[1], instruction: d[3]?.instruction }) %}

Text -> %text {% (d) => d[0].value %}
#Text -> [ a-zA-Z0-9\n!?.\-'",]:+ {% (d) => d[0].join('') %}
# Text -> [ a-zA-Z0-9\n!?.\-'",\:]:+ {% (d) => d[0].join('') %}
# Text -> .:+ {% (d) => d[0].join('') %}

InputBlock -> %beginInput _ %beginContext "\n" InputContextProp:* %endContext _ Text _ %endInput _ {% (d) => ({ context: d[4], content: d[8] }) %}

#InputBlock -> %beginInput _ %beginContext _ InputContextProp:* _ %endContext _ Text _ %endInput _ {% (d) => ({ context: d[4], content: d[8] }) %}
#InputBlock -> %beginInput _ %beginContext _ %endContext _ Text _ %endInput _ #{% (d) => ({ content: d[6] }) %}
#InputBlock -> "BEGININPUT" _ "BEGINCONTEXT" _ "ENDCONTEXT" _ Text _ "ENDINPUT" {% (d) => ({ content: d }) %}
#InputBlock -> "BEGININPUT"
#InputBlock -> %beginInput _ %beginContext _ %endContext _ Text _ %endInput _ %beginInstruction Text %endInstruction {% (d) => ({ content: d[6] }) %}

#InputContext -> Text
#InputContext -> InputContextProp:*
#InputContextProp -> _ Text ":" Text _ #{% (d) => ({ key: d[0], value: d[2] }) %}
InputContextProp -> _ ObjectKey ":" Text _ #{% (d) => ({ key: d[0], value: d[2] }) %}
#InputContextProp -> "Broken" #{% (d) => ({ key: d[0], value: d[2] }) %}

ObjectKey -> [a-zA-Z0-9]:+

InstructionBlock -> %beginInstruction Text %endInstruction {% (d) => ({ instruction: d[1] }) %}

# Whitespace: `_` is optional, `__` is mandatory.
_  -> wschar:* {% function(d) {return null;} %}
__ -> wschar:+ {% function(d) {return null;} %}
wschar -> [ \t\n] {% id %}

#BEGININPUT
#BEGINCONTEXT
#key0: value0
#key1: value1
#ENDCONTEXT
#Insert your block of text here
#ENDINPUT
#BEGININPUT
#BEGINCONTEXT
#key0: value0
#key1: value1
#ENDCONTEXT
#Insert your block of text here
#ENDINPUT
