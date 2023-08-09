#Main -> SystemPrompt "\n" Messages | Messages {% (d) => d.length === 1 ? ({ d, system: null, messages: d[0].flat() }) : ({ d: d, system: '', messages: 'mg' }) %}

Main -> PromptWithSystem | PromptOnlyMessages {% (d) => d[0] %}

PromptWithSystem -> SystemPrompt "\n" Messages {% (d) => ({ d, system: d[0].content, messages: d[2].flat() }) %}
PromptOnlyMessages -> Messages {% (d) => ({ d, system: null, messages: d[0].flat() }) %}

SystemPrompt -> Text {% (d) => ({ role: 'system', content: d[0] }) %}
Messages -> Message | Message "\n" Messages {% (d) => d.filter(v => v !== '\n' ).flat(2) %}
Message -> UserPrompt | UserPrompt "\n" AssistantPrompt {% (d) => d.filter(v => v !== '\n' ).flat(1) %}
UserPrompt -> "USER:" Text:? {% (d) => ({ role: 'user', content: d[1] }) %}
AssistantPrompt -> "ASSISTANT:" Text:? {% (d) => ({ role: 'assistant', content: d[1] }) %}
Text -> [a-zA-Z0-9 \n.]:+ {% (d) => d[0].join('') %}
