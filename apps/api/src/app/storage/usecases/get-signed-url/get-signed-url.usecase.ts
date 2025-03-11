import { Injectable } from '@nestjs/common';
import * as hat from 'hat';
import { StorageService } from '@novu/application-generic';

import { GetSignedUrlResponseDto } from '../../dtos/get-signed-url-response.dto';
import { GetSignedUrlCommand } from './get-signed-url.command';

const mimeTypes = {
  jpeg: 'image/jpeg',
  png: 'image/png',
};

@Injectable()
export class GetSignedUrl {
  constructor(private storageService: StorageService) {}

  async execute(command: GetSignedUrlCommand): Promise<GetSignedUrlResponseDto> {
    const path =
      command.operation === 'read'
        ? (command.imagePath as string)
        : `${command.organizationId}/${command.environmentId}/${hat()}.${command.extension}`;

    const { signedUrl, additionalHeaders } = await this.storageService.getSignedUrl(
      path,
      command.operation === 'write' ? mimeTypes[command.extension as keyof typeof mimeTypes] : 'image/png',
      command.operation
    );

    return {
      signedUrl,
      path,
      additionalHeaders,
    };
  }
}
