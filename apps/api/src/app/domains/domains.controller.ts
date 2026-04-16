import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiRateLimitCategoryEnum, UserSessionData } from '@novu/shared';

import { RequireAuthentication } from '../auth/framework/auth.decorator';
import { ThrottlerCategory } from '../rate-limiting/guards';
import { ApiCommonResponses, ApiNoContentResponse, ApiResponse } from '../shared/framework/response.decorator';
import { UserSession } from '../shared/framework/user.decorator';
import { CreateDomainDto } from './dtos/create-domain.dto';
import { DomainResponseDto } from './dtos/domain-response.dto';
import { DomainRouteDto } from './dtos/domain-route.dto';
import { CreateDomainCommand } from './usecases/create-domain/create-domain.command';
import { CreateDomain } from './usecases/create-domain/create-domain.usecase';
import { CreateRouteCommand } from './usecases/create-route/create-route.command';
import { CreateRoute } from './usecases/create-route/create-route.usecase';
import { DeleteDomainCommand } from './usecases/delete-domain/delete-domain.command';
import { DeleteDomain } from './usecases/delete-domain/delete-domain.usecase';
import { DeleteRouteCommand } from './usecases/delete-route/delete-route.command';
import { DeleteRoute } from './usecases/delete-route/delete-route.usecase';
import { GetDomainCommand } from './usecases/get-domain/get-domain.command';
import { GetDomain } from './usecases/get-domain/get-domain.usecase';
import { GetDomainsCommand } from './usecases/get-domains/get-domains.command';
import { GetDomains } from './usecases/get-domains/get-domains.usecase';
import { UpdateRouteCommand } from './usecases/update-route/update-route.command';
import { UpdateRoute } from './usecases/update-route/update-route.usecase';
import { VerifyDomainCommand } from './usecases/verify-domain/verify-domain.command';
import { VerifyDomain } from './usecases/verify-domain/verify-domain.usecase';

@ThrottlerCategory(ApiRateLimitCategoryEnum.CONFIGURATION)
@ApiCommonResponses()
@Controller('/domains')
@UseInterceptors(ClassSerializerInterceptor)
@ApiExcludeController()
@RequireAuthentication()
@ApiTags('Domains')
export class DomainsController {
  constructor(
    private readonly createDomainUsecase: CreateDomain,
    private readonly getDomainsUsecase: GetDomains,
    private readonly getDomainUsecase: GetDomain,
    private readonly deleteDomainUsecase: DeleteDomain,
    private readonly verifyDomainUsecase: VerifyDomain,
    private readonly createRouteUsecase: CreateRoute,
    private readonly updateRouteUsecase: UpdateRoute,
    private readonly deleteRouteUsecase: DeleteRoute
  ) {}

  @Get('/')
  @ApiOperation({ summary: 'List domains for an environment' })
  @ApiResponse(DomainResponseDto, 200, true)
  async listDomains(@UserSession() user: UserSessionData): Promise<DomainResponseDto[]> {
    return this.getDomainsUsecase.execute(
      GetDomainsCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
      })
    );
  }

  @Post('/')
  @ApiOperation({ summary: 'Create a new domain' })
  @ApiResponse(DomainResponseDto, 201)
  async createDomain(@Body() body: CreateDomainDto, @UserSession() user: UserSessionData): Promise<DomainResponseDto> {
    return this.createDomainUsecase.execute(
      CreateDomainCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        name: body.name,
      })
    );
  }

  @Get('/:domainId')
  @ApiOperation({ summary: 'Get a domain by ID' })
  @ApiResponse(DomainResponseDto, 200)
  async getDomain(
    @Param('domainId') domainId: string,
    @UserSession() user: UserSessionData
  ): Promise<DomainResponseDto> {
    return this.getDomainUsecase.execute(
      GetDomainCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        domainId,
      })
    );
  }

  @Delete('/:domainId')
  @ApiOperation({ summary: 'Delete a domain' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async deleteDomain(@Param('domainId') domainId: string, @UserSession() user: UserSessionData): Promise<void> {
    return this.deleteDomainUsecase.execute(
      DeleteDomainCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        domainId,
      })
    );
  }

  @Post('/:domainId/verify')
  @ApiOperation({ summary: 'Trigger MX record verification for a domain' })
  @ApiResponse(DomainResponseDto, 200)
  async verifyDomain(
    @Param('domainId') domainId: string,
    @UserSession() user: UserSessionData
  ): Promise<DomainResponseDto> {
    return this.verifyDomainUsecase.execute(
      VerifyDomainCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        domainId,
      })
    );
  }

  @Post('/:domainId/routes')
  @ApiOperation({ summary: 'Add a route to a domain' })
  @ApiResponse(DomainResponseDto, 201)
  async createRoute(
    @Param('domainId') domainId: string,
    @Body() body: DomainRouteDto,
    @UserSession() user: UserSessionData
  ): Promise<DomainResponseDto> {
    return this.createRouteUsecase.execute(
      CreateRouteCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        domainId,
        address: body.address,
        destination: body.destination,
        type: body.type,
      })
    );
  }

  @Patch('/:domainId/routes/:routeIndex')
  @ApiOperation({ summary: 'Update a route on a domain' })
  @ApiResponse(DomainResponseDto, 200)
  async updateRoute(
    @Param('domainId') domainId: string,
    @Param('routeIndex', ParseIntPipe) routeIndex: number,
    @Body() body: Partial<DomainRouteDto>,
    @UserSession() user: UserSessionData
  ): Promise<DomainResponseDto> {
    return this.updateRouteUsecase.execute(
      UpdateRouteCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        domainId,
        routeIndex,
        address: body.address,
        destination: body.destination,
        type: body.type,
      })
    );
  }

  @Delete('/:domainId/routes/:routeIndex')
  @ApiOperation({ summary: 'Delete a route from a domain' })
  @ApiResponse(DomainResponseDto, 200)
  async deleteRoute(
    @Param('domainId') domainId: string,
    @Param('routeIndex', ParseIntPipe) routeIndex: number,
    @UserSession() user: UserSessionData
  ): Promise<DomainResponseDto> {
    return this.deleteRouteUsecase.execute(
      DeleteRouteCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        userId: user._id,
        domainId,
        routeIndex,
      })
    );
  }
}
