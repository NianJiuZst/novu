import { Test, TestingModule } from '@nestjs/testing';
import { GetLayoutUseCase } from '@novu/application-generic';
import { CreateLayoutUseCase } from '../../../layouts/usecases';
import { DuplicateLayoutUseCase } from './duplicate-layout.usecase';
import { DuplicateLayoutCommand } from './duplicate-layout.command';

describe('DuplicateLayoutUseCase', () => {
  let useCase: DuplicateLayoutUseCase;
  let getLayoutUseCase: jest.Mocked<GetLayoutUseCase>;
  let createLayoutUseCase: jest.Mocked<CreateLayoutUseCase>;

  const mockLayout = {
    _id: 'original-layout-id',
    name: 'Original Layout',
    identifier: 'original-layout',
    description: 'Original description',
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

  const mockDuplicatedLayout = {
    _id: 'duplicated-layout-id',
    name: 'Duplicated Layout',
    identifier: 'duplicated-layout',
    description: 'Copy of Original description',
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
  });

  describe('execute', () => {
    it('should successfully duplicate a layout', async () => {
      // Arrange
      const command = DuplicateLayoutCommand.create({
        environmentId: 'env-id',
        organizationId: 'org-id',
        userId: 'user-id',
        sourceLayoutId: 'original-layout-id',
        name: 'Duplicated Layout',
        identifier: 'duplicated-layout',
      });

      getLayoutUseCase.execute.mockResolvedValue(mockLayout);
      createLayoutUseCase.execute.mockResolvedValue(mockDuplicatedLayout);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(getLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'env-id',
          organizationId: 'org-id',
          layoutId: 'original-layout-id',
        })
      );

      expect(createLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'env-id',
          organizationId: 'org-id',
          userId: 'user-id',
          name: 'Duplicated Layout',
          identifier: 'duplicated-layout',
          description: 'Copy of Original description',
          content: '<html><body>{{{body}}}</body></html>',
          variables: [{ name: 'testVar', type: 'String', defaultValue: 'test', required: false }],
          isDefault: false,
        })
      );

      expect(result).toEqual(mockDuplicatedLayout);
    });

    it('should use layout name for description when original has no description', async () => {
      // Arrange
      const layoutWithoutDescription = {
        ...mockLayout,
        description: undefined,
      };

      const command = DuplicateLayoutCommand.create({
        environmentId: 'env-id',
        organizationId: 'org-id',
        userId: 'user-id',
        sourceLayoutId: 'original-layout-id',
        name: 'Duplicated Layout',
        identifier: 'duplicated-layout',
      });

      getLayoutUseCase.execute.mockResolvedValue(layoutWithoutDescription);
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
      const defaultLayout = {
        ...mockLayout,
        isDefault: true,
      };

      const command = DuplicateLayoutCommand.create({
        environmentId: 'env-id',
        organizationId: 'org-id',
        userId: 'user-id',
        sourceLayoutId: 'original-layout-id',
        name: 'Duplicated Layout',
        identifier: 'duplicated-layout',
      });

      getLayoutUseCase.execute.mockResolvedValue(defaultLayout);
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

    it('should propagate error when getting source layout fails', async () => {
      // Arrange
      const command = DuplicateLayoutCommand.create({
        environmentId: 'env-id',
        organizationId: 'org-id',
        userId: 'user-id',
        sourceLayoutId: 'non-existent-layout-id',
        name: 'Duplicated Layout',
        identifier: 'duplicated-layout',
      });

      getLayoutUseCase.execute.mockRejectedValue(new Error('Layout not found'));

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Layout not found');
    });

    it('should propagate error when creating layout fails', async () => {
      // Arrange
      const command = DuplicateLayoutCommand.create({
        environmentId: 'env-id',
        organizationId: 'org-id',
        userId: 'user-id',
        sourceLayoutId: 'original-layout-id',
        name: 'Duplicated Layout',
        identifier: 'duplicated-layout',
      });

      getLayoutUseCase.execute.mockResolvedValue(mockLayout);
      createLayoutUseCase.execute.mockRejectedValue(new Error('Failed to create layout'));

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Failed to create layout');
    });
  });
});
