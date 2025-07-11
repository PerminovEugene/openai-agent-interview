import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index";

export class MemoryTool {
  private history: ChatCompletionMessageParam[] = [];

  add(message: ChatCompletionMessageParam) {
    this.history.push(message);
  }
  get() {
    return this.history;
  }
  getLastUserMessageAndAllNextMessages() {
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].role === "user") {
        return this.history.slice(i);
      }
    }
    // fallback: no user message found, return full history
    return this.history;
  }
}

export const getHistoryMessagesDefinition: ChatCompletionTool = {
  type: "function",
  function: {
    name: "get_message_history",
    description: "Returns the full message history stored in memory",
    parameters: {
      type: "object",
      properties: {},
    },
  },
};

export const memoryTools = [getHistoryMessagesDefinition];
