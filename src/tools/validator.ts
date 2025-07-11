import { ChatCompletionTool } from "openai/resources/index";
import { PetInfo } from "../types";

export class ValidatorTool {
  private maxAge = 50;
  private maxWeight = 50;

  validate(data: Partial<PetInfo>): Partial<PetInfo> {
    const valid: Partial<PetInfo> = {};
    if (data.breed && data.breed.length > 1) valid.breed = data.breed;
    if (data.age && data.age > 0 && data.age < this.maxAge)
      valid.age = data.age;
    if (data.weight && data.weight > 0 && data.weight < this.maxWeight)
      valid.weight = data.weight;
    return valid;
  }
}

export const validateDogToolDefinition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "validate_dog_data",
    description: "Validate and clean user-provided dog information",
    parameters: {
      type: "object",
      properties: {
        breed: { type: "string" },
        age: { type: "number" },
        weight: { type: "number" },
      },
    },
  },
};

export const validatorTools = [validateDogToolDefinition];