import type { UserEntity } from '../user';
import type { ChangeEntity } from './change.entity';

export type ChangeEntityPopulated = ChangeEntity & {
  user: Pick<UserEntity, '_id' | 'firstName' | 'lastName' | 'profilePicture'>;
};
