import { type ArgumentMetadata, Injectable, type PipeTransform } from '@nestjs/common';
import { type InternalId, parseSlugId } from './parse-slug-id';

@Injectable()
export class ParseSlugIdPipe implements PipeTransform<string, InternalId> {
  transform(value: string, metadata: ArgumentMetadata): InternalId {
    return parseSlugId(value);
  }
}
