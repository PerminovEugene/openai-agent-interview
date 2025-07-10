import OpenAI from "openai";
import { Agent } from "./agent";
import dotenv from "dotenv";

dotenv.config({ override: true });

async function main() {
  const agent = new Agent(new OpenAI());
  await agent.run();
}

main().catch(console.error);