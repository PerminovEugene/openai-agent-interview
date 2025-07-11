import { ChatCompletionTool } from "openai/resources/index";
import { PetInfo } from "../types";

export class StateTool {
  private data: PetInfo = {};

  update(update: Partial<PetInfo>) {
    this.data = { ...this.data, ...update };
  }
  get() {
    return this.data;
  }
  isComplete() {
    return !!(this.data.breed && this.data.age && this.data.weight);
  }
}

export const storeDogToolDefinition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "store_dog_info",
    description: "Store or update known dog info from user input",
    parameters: {
      type: "object",
      properties: {
        breed: {
          type: "string",
          description: "Dog breed like 'Beagle', 'Golden Retriever'",
        },
        age: {
          type: "number",
          description: "Dog age in years, must be reasonable",
        },
        weight: {
          type: "number",
          description: "Dog weight in kg, must be realistic",
        },
      },
    },
  },
};

export const getDogStateToolDefinition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "get_dog_state",
    description: "Returns currently known dog information",
    parameters: {
      type: "object",
      properties: {},
    },
  },
};

export const stateTools = [storeDogToolDefinition, getDogStateToolDefinition];