import { z } from 'zod';
import { generateText, Output } from 'ai';
import { run, fetchData, saveResource } from './utils';
import { openrouter } from './lib';

const taggedPersonSchema = z.object({
  name: z.string(),
  surname: z.string(),
  gender: z.string(),
  born: z.number(),
  city: z.string(),
  tags: z.array(z.string()),
});

type TaggedPerson = z.infer<typeof taggedPersonSchema>;

type Person = Omit<TaggedPerson, 'tags'> & { description: string };

const TAGS = [
  'IT',
  'transport',
  'edukacja',
  'medycyna',
  'praca z ludźmi',
  'praca z pojazdami',
  'praca fizyczna',
] as const;

const parsePerson = (csvStr: string): Person => {
  const [name, surname, gender, born, city, , description] = csvStr.split(/,(?!\s)/);
  return { name, surname, gender, born: new Date(born).getFullYear(), city, description };
};

run('people', async () => {
  const response = await fetchData('people.csv');
  const csvStr = await response.text();

  const people = csvStr.split(/\n\r?/).map(parsePerson);

  const candidates = people.filter(({ born, city }) => {
    const age = 2026 - born;
    return age >= 20 && age <= 40 && city === 'Grudziądz';
  });
  await saveResource('people.json', candidates);

  const result = await generateText({
    model: openrouter('anthropic/claude-sonnet-4.6', { reasoning: { effort: 'low' } }),
    output: Output.array({ element: taggedPersonSchema }),
    messages: [{
      role: 'user', content: `\
You will be provided with array of people. One of the fields is 'description'. Base on that field, determine the tags, that should be assigned to the person. Return the same array, but instead of 'description' field, use 'tags' field with assigned tags. One person can have multiple tags. Tags can not be empty, you should always assign at least one tag to the person.

<available_tags>
${TAGS}
</available_tags>

<people>
${JSON.stringify(candidates)}
</people>
\
`}],
  });

  console.log(result.content);

  return { answer: result.output.filter(({ tags }) => tags.includes('transport')) };
});
