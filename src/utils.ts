const submit = async (task: string, answer: Record<string, unknown>): Promise<unknown> => {
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

export const run = async (
  task: string,
  answerCb: () => Record<string, unknown> | Promise<Record<string, unknown>>,
): Promise<void> => {
  const data = await submit(task, await answerCb());
  console.log('RESULT', data);
};
