import { type Answers, prompt as InquirerPrompt, type ListQuestionOptions } from 'inquirer';

export async function prompt(questions: ListQuestionOptions[]): Promise<Answers> {
  return InquirerPrompt(questions);
}
