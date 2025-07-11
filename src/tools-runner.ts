import { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
import { ValidatorTool } from "./tools/validator";
import { MemoryTool } from "./tools/memory";
import { StateTool } from "./tools/state";
import { PetInfo } from "./types";

export class ToolsRunner {
  constructor(
    private validator: ValidatorTool,
    private memory: MemoryTool,
    private state: StateTool
  ) {}

  public execute(
    toolCalls: ChatCompletionMessageToolCall[]
  ): Array<{ tool_call_id: string; output: string }> {
    const results: Array<{ tool_call_id: string; output: string }> = [];

    for (const call of toolCalls) {
      if (call.type !== "function") {
        results.push({
          tool_call_id: call.id,
          output: JSON.stringify({ error: "Unsupported tool call type" }),
        });
        continue;
      }

      const { name, arguments: args } = call.function;
      let parsedArgs: any;

      try {
        parsedArgs = JSON.parse(args);
      } catch (error) {
        results.push({
          tool_call_id: call.id,
          output: JSON.stringify({ error: "Invalid JSON arguments" }),
        });
        continue;
      }

      try {
        const result = this.executeToolCall(name, parsedArgs);
        results.push({
          tool_call_id: call.id,
          output: JSON.stringify(result),
        });
      } catch (error) {
        results.push({
          tool_call_id: call.id,
          output: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        });
      }
    }

    return results;
  }

  private executeToolCall(name: string, args: any): any {
    switch (name) {
      // Memory tool methods
      case "get_message_history":
        const history = this.memory.get();
        return { history };

      // State tool methods
      case "store_dog_info":
        const updateData: Partial<PetInfo> = {};
        if (args.breed) updateData.breed = args.breed;
        if (args.age !== undefined) updateData.age = args.age;
        if (args.weight !== undefined) updateData.weight = args.weight;

        this.state.update(updateData);
        const isComplete = this.state.isComplete();
        return {
          success: true,
          message: "Dog info updated",
          isComplete,
          data: this.state.get(),
        };

      case "get_dog_state":
        const currentState = this.state.get();
        const complete = this.state.isComplete();
        return {
          state: currentState,
          isComplete: complete,
        };

      // Validator tool methods
      case "validate_dog_data":
        const dataToValidate: Partial<PetInfo> = {};
        if (args.breed !== undefined) dataToValidate.breed = args.breed;
        if (args.age !== undefined) dataToValidate.age = args.age;
        if (args.weight !== undefined) dataToValidate.weight = args.weight;

        const validatedData = this.validator.validate(dataToValidate);
        return {
          validatedData,
          isValid: Object.keys(validatedData).length > 0,
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
