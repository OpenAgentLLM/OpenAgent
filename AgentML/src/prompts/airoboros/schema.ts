import { RJSFSchema, UiSchema } from "@rjsf/utils";

export const jsonSchema: RJSFSchema = {
  "title": "Airoboros",
  "description": "From https://huggingface.co/jondurbin/airoboros-l2-13b-gpt4-m2.0",
  "type": "object",
  "required": ["messages"],
  "properties": {
    "system": {
      // "type": "string",
      "title": "Preamble/System Prompt",
      "$ref": "#/definitions/multilineString"
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
          "content": {
            "anyOf": [
              {
                "title": "Text Content",
                "$ref": "#/definitions/multilineString"
                // "type": "string",
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
                        },
                        "context": {
                          "type": "array",
                          "items": {
                            "type": "object",
                            "properties": {
                              "key": {
                                "type": "string",
                              },
                              "value": {
                                "type": "string"
                              }
                            }
                          }
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
  },
  "definitions": {
    "multilineString": {
      "title": "Multiline String",
      "type": "string",
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
  "messages": {
    "items": {
      "content": {
        // "ui:widget": "textarea",
        "instruction": {
          "ui:widget": "textarea",
        },
        "inputs": {
          "items": {
            "content": {
              "ui:widget": "textarea",
            }
          }
        }
      }
    }
  },
  "definitions": {
    "multilineString": {
      "ui:widget": "textarea",
    }
  }
};
