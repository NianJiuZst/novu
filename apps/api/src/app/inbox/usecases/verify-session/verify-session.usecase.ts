import { Injectable, NotFoundException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { EnvironmentRepository } from '@novu/dal';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { VerifySessionCommand } from './verify-session.command';
import { AuthService } from '../../../auth/services/auth.service';

@Injectable()
export class VerifySession {
  constructor(
    private environmentRepository: EnvironmentRepository,
    private authService: AuthService
  ) {}

  async execute(command: VerifySessionCommand) {
    const { token } = command;

    // decode the token
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) throw new NotFoundException('Invalid token format');

    console.log(decoded);

    // get subcriberId
    const { subscriberId, iss, aud } = decoded.payload;

    const applicationIdentifier = 'demo-identifier';

    // find secret by applicationIdentifier (environments collection)
    const environment = await this.environmentRepository.findEnvironmentByIdentifier(applicationIdentifier);

    if (!environment) {
      throw new NotFoundException('Environment not found');
    }

    // 1) first check if its API key issued by us
    const verified = environment.apiKeys?.find((key) => {
      try {
        jwt.verify(token, key.key);

        return true;
      } catch {
        return false;
      }
    });

    if (verified) {
      return {
        subscriberId,
        applicationIdentifier,
      };
    }

    // 2) find the issuer in environments
    const externalAuthIssuerUrl = environment.externalAuthIssuerUrls?.find((url) => url.url === iss);

    if (!externalAuthIssuerUrl) {
      throw new NotFoundException('JWT cant be verified');
    }

    const jwksUrl = `${iss}/.well-known/jwks.json`;

    try {
      // For Clerk specifically (replace with your Clerk instance URL)
      const JWKS = createRemoteJWKSet(new URL(jwksUrl));

      // Verify the token using the JWKS
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: iss,
        audience: aud,
      });

      return {
        verified: payload,
        subscriberId: payload.sub,
        applicationIdentifier,
        iss,
      };
    } catch (error) {
      throw new NotFoundException(`Token verification failed: ${error.message}`);
    }
  }
}
