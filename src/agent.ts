
import { createInterface } from 'node:readline/promises';
import OpenAI from "openai";


async function ask(prompt: string) {
  const rl = createInterface({ 
    input: process.stdin, 
    output: process.stdout,
    terminal: true
  });
  const message = await rl.question(prompt);
  rl.close();
  return message;
}

export class Agent {
  
  constructor(private readonly client: OpenAI) {}

  async run() {
    console.log('Agent started! Type "exit()" to quit.');

    try {
      const message = await ask('> ');
      console.log(`You said: "${message}"`);

      const response = await this.client.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      });

      console.log(response.choices[0].message.content);

    } catch (error) {
      console.error('Error reading input:', error);
      return;
    }
  }
}

