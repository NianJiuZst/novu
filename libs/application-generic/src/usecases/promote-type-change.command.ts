import { IsDefined } from 'class-validator';
import { EnvironmentWithUserCommand } from '../commands';
import type { IItem } from './create-change';

export class PromoteTypeChangeCommand extends EnvironmentWithUserCommand {
  @IsDefined()
  item: IItem;
}
