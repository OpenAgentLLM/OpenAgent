import { RJSFSchema, UiSchema } from "@rjsf/utils";

export const jsonSchema: RJSFSchema = {
  "title": "Airoboros",
  "description": "From https://huggingface.co/jondurbin/airoboros-l2-13b-gpt4-m2.0",
  "type": "object",
  "required": ["messages"],
  "properties": {
    "system": {
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
                // "$ref": "#/definitions/multilineString"
                "type": "object",
                "properties": {
                  "text": {
                    "$ref": "#/definitions/multilineString"
                    // "type": "string"
                  }
                }
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
    "ui:widget": "textarea",
    "ui:options": {
      "rows": 3
    }
  },
  "messages": {
    "items": {
      "content": {
        // "ui:widget": "textarea",
        "text": {
          // "ui:widget": "textarea",
          "ui:options": {
            "widget": "textarea",
            "rows": 3
          }
        },
        "instruction": {
          "ui:widget": "textarea",
          "ui:options": {
            "rows": 3
          }
        },
        "inputs": {
          "items": {
            "content": {
              "ui:widget": "textarea",
              "ui:options": {
                "rows": 3
              }
            },
            "context": {
              "items": {
                "key": {
                  // "ui:widget": "textarea",
                  // "ui:options": {
                  //   "rows": 1
                  // }
                },
                "value": {
                  "ui:widget": "textarea",
                  "ui:options": {
                    "rows": 2
                  }
                }
              }
            
            }
          }
        }
      }
    }
  },
  "definitions": {
    "multilineString": {
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 3
      }
    }
  }
};
