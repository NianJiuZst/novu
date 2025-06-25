import { Test, TestingModule } from '@nestjs/testing';
import { GetLayoutCommand as V1GetLayoutCommand, GetLayoutUseCase as V1GetLayoutUseCase } from '@novu/application-generic';
import { GetLayoutUseCase } from './get-layout.use-case';
import { GetLayoutCommand } from './get-layout.command';
import { mapToResponseDto } from '../mapper';

jest.mock('../mapper');

describe('GetLayoutUseCase', () => {
  let useCase: GetLayoutUseCase;
  let v1GetLayoutUseCase: jest.Mocked<V1GetLayoutUseCase>;

  const mockUser = {
    _id: 'user-id',
    environmentId: 'env-id',
    organizationId: 'org-id',
  };

  const mockV1Layout = {
    _id: 'layout-id',
    name: 'Test Layout',
    identifier: 'test-layout',
    description: 'Test description',
    content: '<html><body>{{{body}}}</body></html>',
    variables: [{ name: 'testVar', type: 'String', defaultValue: 'test', required: false }],
    isDefault: false,
    _environmentId: 'env-id',
    _organizationId: 'org-id',
    _creatorId: 'user-id',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockV2Response = {
    _id: 'layout-id',
    layoutId: 'test-layout',
    name: 'Test Layout',
    isDefault: false,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    origin: 'NOVU_CLOUD',
    type: 'BRIDGE',
    variables: { type: 'object', properties: {}, required: [], additionalProperties: false },
    issues: undefined,
    controls: {
      uiSchema: undefined,
      dataSchema: undefined,
      values: {},
    },
  };

  beforeEach(async () => {
    const mockV1GetLayoutUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLayoutUseCase,
        {
          provide: V1GetLayoutUseCase,
          useValue: mockV1GetLayoutUseCase,
        },
      ],
    }).compile();

    useCase = module.get<GetLayoutUseCase>(GetLayoutUseCase);
    v1GetLayoutUseCase = module.get(V1GetLayoutUseCase);

    // Mock the mapper function
    (mapToResponseDto as jest.Mock).mockReturnValue(mockV2Response);
  });

  describe('execute', () => {
    it('should successfully get a layout using v1 usecase', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'layout-id',
        user: mockUser,
      } as GetLayoutCommand;

      v1GetLayoutUseCase.execute.mockResolvedValue(mockV1Layout);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(v1GetLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'env-id',
          organizationId: 'org-id',
          layoutId: 'layout-id',
        })
      );

      expect(mapToResponseDto).toHaveBeenCalledWith({
        layout: mockV1Layout,
        controlValues: null,
        variables: { type: 'object', properties: {}, required: [], additionalProperties: false },
      });

      expect(result).toEqual(mockV2Response);
    });

    it('should use V1GetLayoutCommand.create properly', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'layout-id',
        user: mockUser,
      } as GetLayoutCommand;

      v1GetLayoutUseCase.execute.mockResolvedValue(mockV1Layout);

      // Spy on V1GetLayoutCommand.create
      const createSpy = jest.spyOn(V1GetLayoutCommand, 'create');

      // Act
      await useCase.execute(command);

      // Assert
      expect(createSpy).toHaveBeenCalledWith({
        environmentId: 'env-id',
        organizationId: 'org-id',
        layoutId: 'layout-id',
      });

      createSpy.mockRestore();
    });

    it('should propagate error when v1 usecase fails', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'non-existent-layout-id',
        user: mockUser,
      } as GetLayoutCommand;

      v1GetLayoutUseCase.execute.mockRejectedValue(new Error('Layout not found'));

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Layout not found');
    });

    it('should handle different layout identifiers', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'different-layout-identifier',
        user: mockUser,
      } as GetLayoutCommand;

      v1GetLayoutUseCase.execute.mockResolvedValue(mockV1Layout);

      // Act
      await useCase.execute(command);

      // Assert
      expect(v1GetLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          layoutId: 'different-layout-identifier',
        })
      );
    });

    it('should handle different user contexts', async () => {
      // Arrange
      const differentUser = {
        _id: 'different-user-id',
        environmentId: 'different-env-id',
        organizationId: 'different-org-id',
      };

      const command = {
        layoutIdOrInternalId: 'layout-id',
        user: differentUser,
      } as GetLayoutCommand;

      v1GetLayoutUseCase.execute.mockResolvedValue(mockV1Layout);

      // Act
      await useCase.execute(command);

      // Assert
      expect(v1GetLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'different-env-id',
          organizationId: 'different-org-id',
          layoutId: 'layout-id',
        })
      );
    });
  });
});
