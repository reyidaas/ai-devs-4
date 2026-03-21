import path from 'path';
import { fork } from 'child_process';

const main = (): void => {
  const [,,filename] = process.argv;
  if (!filename) throw new Error('Filename arg must be provided');

  const filePath = path.join(process.cwd(), 'src', `${filename}.ts`);
  fork(filePath);
};

main();
