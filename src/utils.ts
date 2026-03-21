import path from 'path';
import { writeFile } from 'fs/promises';
import OpenAI from 'openai';
import { openAIClient } from './lib';

interface Answer {
  answer: JsonValue;
  submit?: boolean;
}

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

interface SendMessageData {
  message: string;
  system?: string;
  model?: string;
  json?: boolean;
}

const submitTask = async (task: string, answer: JsonValue): Promise<unknown> => {
  const response = await fetch(`${process.env.HUB_URL}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apikey: process.env.HUB_API_KEY,
      task,
      answer,
    }),
  });

  return response.json();
};

export const fetchData = async (file: string): Promise<Response> => {
  const response = await fetch(`${process.env.HUB_URL}/data/${process.env.HUB_API_KEY}/${file}`);
  return response;
};

export const sendMessage = async ({
  message,
  system,
  model = 'claude-sonnet-4',
  json,
}: SendMessageData): Promise<string | null> => {
  const messages: OpenAI.ChatCompletionMessageParam[] = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  if (json) {
    messages.push({
      role: 'system',
      content:
        'ALWAYS return plain JSON without any additional text or code block indicators. You MUST return valid JSON directly. If the user specifies the <schema> block, you MUST follow the JSON schema.',
    });
  }
  messages.push({ role: 'user', content: message });

  const result = await openAIClient.chat.completions.create({ model, messages });

  return result.choices[0].message.content?.trim() ?? null;
};

export const saveResource = async (file: string, data: unknown) => {
  const target = path.join(process.cwd(), '..', 'resources', file);

  await writeFile(target, typeof data === 'string' ? data : JSON.stringify(data));
};

export const run = async (
  task: string,
  answerCb: () => Answer | Promise<Answer>,
): Promise<void> => {
  try {
    const { answer, submit = true } = await answerCb();
    if (submit) {
      console.log('SUBMITTING ANSWER: ', answer);
      const data = await submitTask(task, answer);
      console.log('SUBMIT RESULT: ', data);
    } else {
      console.log('SUBMITTING ANSWER SKIPPED: ', answer);
    }
  } catch (error) {
    console.error(error);
  }
};
