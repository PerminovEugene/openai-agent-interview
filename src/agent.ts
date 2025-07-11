import { createInterface } from "node:readline/promises";
import OpenAI from "openai";
import { ValidatorTool, validatorTools } from "./tools/validator";
import { StateTool, stateTools } from "./tools/state";
import { MemoryTool, memoryTools } from "./tools/memory";
import { ToolsRunner } from "./tools-runner";
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index";

// Terminal input
async function ask(prompt: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  const answer = await rl.question(prompt);
  rl.close();
  return answer.trim();
}

const systemPrompt = `You are a veterinary form assistant. Your job is to extract: breed, age, and weight from user input.
If unrelated input is given, reply: \"Let's get back to filling out the form.\"
When complete, return: \"Thank you! Here is your data:\" followed by the object.`;

// Agent
export class Agent {
  constructor(private readonly client: OpenAI) {}

  private memory = new MemoryTool();
  private state = new StateTool();
  private validator = new ValidatorTool();
  private tools = [...memoryTools, ...stateTools, ...validatorTools];
  private toolsRunner = new ToolsRunner(
    this.validator,
    this.memory,
    this.state
  );

  async run() {
    console.log('🐾 Vet Assistant Started! Type "exit()" to quit.');

    let message;
    let input;
    while (true) {
      // if message content is not empty then LLM wants something from user, if empty - not need to ask user anything
      if (!message || message.content) {
        input = await ask("> ");
        this.memory.add({ role: "user", content: input });
      }
      if (input === "exit()") break;

      if (message && message.tool_calls?.length) {
        await this.applyTools(message);
      }

      // it's possible that LLM returns only tool calls, with no content
      // in this case we need to send the last user message and all the next messages, like tool calls
      // and LLM responses
      const messages = this.memory.getLastUserMessageAndAllNextMessages();
      message = await this.callLLM(messages);

      console.debug("LLM response", JSON.stringify(message));

      this.memory.add(message);

      if (this.state.isComplete()) {
        const current = this.state.get();
        console.log("✅ Thank you! Here is your data:");
        console.log(JSON.stringify(this.memory.get()));
        console.log(JSON.stringify(current, null, 2));
        return;
      }
    }
  }

  private async applyTools(message: ChatCompletionMessage) {
    const toolResults = this.toolsRunner.execute(message.tool_calls);

    // Debug tools results
    for (const result of toolResults) {
      try {
        const parsedResult = JSON.parse(result.output);
        if (parsedResult.error) {
          console.debug(`Tool error: ${parsedResult.error}`);
        } else {
          console.debug(`Tool result:`, parsedResult);
        }
      } catch (e) {
        console.log(`Tool error result: ${result.output}`);
      }
    }
    toolResults.forEach((toolResult) =>
      this.memory.add({
        role: "tool",
        tool_call_id: toolResult.tool_call_id,
        content: toolResult.output,
      })
    );
  }

  private async callLLM(
    messages: ChatCompletionMessageParam[] // LLM responses and tools results
  ) {
    const response = await this.client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      tools: this.tools as ChatCompletionTool[],
      tool_choice: "auto",
    });

    const message = response.choices[0].message;
    return message;
  }
}
