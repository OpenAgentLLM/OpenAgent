import { RJSFSchema, UiSchema } from "@rjsf/utils";

export const jsonSchema: RJSFSchema = {
  "title": "Airoboros",
  "description": "From https://huggingface.co/jondurbin/airoboros-l2-13b-gpt4-m2.0",
  "type": "object",
  "required": ["messages"],
  "properties": {
    "system": {
      "type": "string",
      "title": "Preamble/System Prompt"
    },
    "messages": {
      "title": "Messages",
      "type": "array",
      "items": {
        "type": "object",
        "required": ["role"],
        "properties": {
          "role": {
            "type": "string",
            "title": "Role",
            "default": "user",
            "enum": ["user", "assistant"]
          },
          // "content": {
          //   "type": "string",
          //   "title": "Content"
          // }
          "content": {
            "anyOf": [
              {
                "title": "Text Content",
                "type": "string",
              },
              {
                "title": "Input Blocks with Instruction",
                "type": "object",
                "properties": {
                  "inputs": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "content": {
                          "type": "string"
                        }
                      }
                    }
                  },
                  "instruction": {
                    "type": "string"
                  }
                }
              }
            ]
          }
        }
      }
    }
  }
}

export const uiSchema: UiSchema = {
  "header": {
    "goal": {
      "ui:widget": "textarea"
    },
    "tools": {
      "items": {
        "description": {
          "ui:widget": "textarea"
        }
      }
    },
    "context": {
      "ui:widget": "textarea"
    }
  },
  "system": {
    "ui:widget": "textarea"
  },
  // "messages": {
  //   "items": {
  //     "content": {
  //       "ui:widget": "textarea"
  //     }
  //   }
  // }
};
