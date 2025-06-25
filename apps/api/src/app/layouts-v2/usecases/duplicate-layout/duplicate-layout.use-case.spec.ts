import { Test, TestingModule } from '@nestjs/testing';
import { GetLayoutCommand, GetLayoutUseCase } from '@novu/application-generic';
import { CreateLayoutCommand, CreateLayoutUseCase } from '../../../layouts-v1/usecases';
import { DuplicateLayoutUseCase } from './duplicate-layout.use-case';
import { DuplicateLayoutCommand } from './duplicate-layout.command';
import { mapToResponseDto } from '../mapper';
import { ResourceTypeEnum, ResourceOriginEnum } from '@novu/shared';

jest.mock('../mapper');

describe('DuplicateLayoutUseCase', () => {
  let useCase: DuplicateLayoutUseCase;
  let getLayoutUseCase: jest.Mocked<GetLayoutUseCase>;
  let createLayoutUseCase: jest.Mocked<CreateLayoutUseCase>;

  const mockUser = {
    _id: 'user-id',
    environmentId: 'env-id',
    organizationId: 'org-id',
  };

  const mockSourceLayout = {
    _id: 'source-layout-id',
    name: 'Original Layout',
    identifier: 'original-layout',
    description: 'Original description',
    content: '<html><body>{{{body}}}</body></html>',
    variables: [{ name: 'testVar', type: 'String', defaultValue: 'test', required: false }],
    isDefault: false,
    type: ResourceTypeEnum.BRIDGE,
    origin: ResourceOriginEnum.NOVU_CLOUD,
    _environmentId: 'env-id',
    _organizationId: 'org-id',
    _creatorId: 'user-id',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDuplicatedLayout = {
    _id: 'duplicated-layout-id',
    name: 'Duplicated Layout',
    identifier: 'duplicated-layout',
    description: 'Copy of Original description',
    content: '<html><body>{{{body}}}</body></html>',
    variables: [{ name: 'testVar', type: 'String', defaultValue: 'test', required: false }],
    isDefault: false,
    type: ResourceTypeEnum.BRIDGE,
    origin: ResourceOriginEnum.NOVU_CLOUD,
    _environmentId: 'env-id',
    _organizationId: 'org-id',
    _creatorId: 'user-id',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockV2Response = {
    _id: 'duplicated-layout-id',
    layoutId: 'duplicated-layout',
    name: 'Duplicated Layout',
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
    const mockGetLayoutUseCase = {
      execute: jest.fn(),
    };

    const mockCreateLayoutUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuplicateLayoutUseCase,
        {
          provide: GetLayoutUseCase,
          useValue: mockGetLayoutUseCase,
        },
        {
          provide: CreateLayoutUseCase,
          useValue: mockCreateLayoutUseCase,
        },
      ],
    }).compile();

    useCase = module.get<DuplicateLayoutUseCase>(DuplicateLayoutUseCase);
    getLayoutUseCase = module.get(GetLayoutUseCase);
    createLayoutUseCase = module.get(CreateLayoutUseCase);

    // Mock the mapper function
    (mapToResponseDto as jest.Mock).mockReturnValue(mockV2Response);
  });

  describe('execute', () => {
    it('should successfully duplicate a layout', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'source-layout-id',
        user: mockUser,
        overrides: {
          name: 'Duplicated Layout',
        },
      } as DuplicateLayoutCommand;

      getLayoutUseCase.execute.mockResolvedValue(mockSourceLayout);
      createLayoutUseCase.execute.mockResolvedValue(mockDuplicatedLayout);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(getLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          layoutIdOrInternalId: 'source-layout-id',
          environmentId: 'env-id',
          organizationId: 'org-id',
        })
      );

      expect(createLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'env-id',
          organizationId: 'org-id',
          userId: 'user-id',
          name: 'Duplicated Layout',
          identifier: 'duplicated-layout', // slugified version
          description: 'Copy of Original description',
          content: '<html><body>{{{body}}}</body></html>',
          variables: [{ name: 'testVar', type: 'String', defaultValue: 'test', required: false }],
          isDefault: false,
          type: ResourceTypeEnum.BRIDGE,
          origin: ResourceOriginEnum.NOVU_CLOUD,
        })
      );

      expect(mapToResponseDto).toHaveBeenCalledWith({
        layout: mockDuplicatedLayout,
        controlValues: null,
        variables: { type: 'object', properties: {}, required: [], additionalProperties: false },
      });

      expect(result).toEqual(mockV2Response);
    });

    it('should use layout name for description when original has no description', async () => {
      // Arrange
      const sourceLayoutWithoutDescription = {
        ...mockSourceLayout,
        description: undefined,
      };

      const command = {
        layoutIdOrInternalId: 'source-layout-id',
        user: mockUser,
        overrides: {
          name: 'Duplicated Layout',
        },
      } as DuplicateLayoutCommand;

      getLayoutUseCase.execute.mockResolvedValue(sourceLayoutWithoutDescription);
      createLayoutUseCase.execute.mockResolvedValue(mockDuplicatedLayout);

      // Act
      await useCase.execute(command);

      // Assert
      expect(createLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Copy of Original Layout',
        })
      );
    });

    it('should always set isDefault to false for duplicated layouts', async () => {
      // Arrange
      const defaultSourceLayout = {
        ...mockSourceLayout,
        isDefault: true,
      };

      const command = {
        layoutIdOrInternalId: 'source-layout-id',
        user: mockUser,
        overrides: {
          name: 'Duplicated Layout',
        },
      } as DuplicateLayoutCommand;

      getLayoutUseCase.execute.mockResolvedValue(defaultSourceLayout);
      createLayoutUseCase.execute.mockResolvedValue(mockDuplicatedLayout);

      // Act
      await useCase.execute(command);

      // Assert
      expect(createLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          isDefault: false,
        })
      );
    });

    it('should handle default type and origin when not present', async () => {
      // Arrange
      const sourceLayoutWithoutTypeOrigin = {
        ...mockSourceLayout,
        type: undefined,
        origin: undefined,
      };

      const command = {
        layoutIdOrInternalId: 'source-layout-id',
        user: mockUser,
        overrides: {
          name: 'Duplicated Layout',
        },
      } as DuplicateLayoutCommand;

      getLayoutUseCase.execute.mockResolvedValue(sourceLayoutWithoutTypeOrigin);
      createLayoutUseCase.execute.mockResolvedValue(mockDuplicatedLayout);

      // Act
      await useCase.execute(command);

      // Assert
      expect(createLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ResourceTypeEnum.BRIDGE,
          origin: ResourceOriginEnum.NOVU_CLOUD,
        })
      );
    });

    it('should propagate error when source layout is not found', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'non-existent-layout-id',
        user: mockUser,
        overrides: {
          name: 'Duplicated Layout',
        },
      } as DuplicateLayoutCommand;

      getLayoutUseCase.execute.mockRejectedValue(new Error('Layout not found'));

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Layout not found');
    });

    it('should propagate error when creating layout fails', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'source-layout-id',
        user: mockUser,
        overrides: {
          name: 'Duplicated Layout',
        },
      } as DuplicateLayoutCommand;

      getLayoutUseCase.execute.mockResolvedValue(mockSourceLayout);
      createLayoutUseCase.execute.mockRejectedValue(new Error('Failed to create layout'));

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Failed to create layout');
    });

    it('should handle different user contexts', async () => {
      // Arrange
      const differentUser = {
        _id: 'different-user-id',
        environmentId: 'different-env-id',
        organizationId: 'different-org-id',
      };

      const command = {
        layoutIdOrInternalId: 'source-layout-id',
        user: differentUser,
        overrides: {
          name: 'Duplicated Layout',
        },
      } as DuplicateLayoutCommand;

      getLayoutUseCase.execute.mockResolvedValue(mockSourceLayout);
      createLayoutUseCase.execute.mockResolvedValue(mockDuplicatedLayout);

      // Act
      await useCase.execute(command);

      // Assert
      expect(getLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'different-env-id',
          organizationId: 'different-org-id',
        })
      );

      expect(createLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'different-env-id',
          organizationId: 'different-org-id',
          userId: 'different-user-id',
        })
      );
    });

    it('should generate slugified identifier from layout name', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'source-layout-id',
        user: mockUser,
        overrides: {
          name: 'My Custom Layout Name!',
        },
      } as DuplicateLayoutCommand;

      getLayoutUseCase.execute.mockResolvedValue(mockSourceLayout);
      createLayoutUseCase.execute.mockResolvedValue(mockDuplicatedLayout);

      // Act
      await useCase.execute(command);

      // Assert
      expect(createLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'my-custom-layout-name', // slugified version
        })
      );
    });
  });
});
