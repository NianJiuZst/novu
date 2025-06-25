import { Test, TestingModule } from '@nestjs/testing';
import { GetLayoutUseCase } from '@novu/application-generic';
import { DeleteLayoutUseCase } from '../layouts/usecases';
import { DuplicateLayoutUseCase } from './usecases';
import { LayoutsV2Controller } from './layouts.controller';

describe('LayoutsV2Controller', () => {
  let controller: LayoutsV2Controller;
  let getLayoutUseCase: jest.Mocked<GetLayoutUseCase>;
  let deleteLayoutUseCase: jest.Mocked<DeleteLayoutUseCase>;
  let duplicateLayoutUseCase: jest.Mocked<DuplicateLayoutUseCase>;

  const mockUser = {
    _id: 'user-id',
    environmentId: 'env-id',
    organizationId: 'org-id',
  };

  const mockLayout = {
    _id: 'layout-id',
    name: 'Test Layout',
    identifier: 'test-layout',
    description: 'Test description',
    content: '<html><body>{{{body}}}</body></html>',
    variables: [],
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

    const mockDeleteLayoutUseCase = {
      execute: jest.fn(),
    };

    const mockDuplicateLayoutUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LayoutsV2Controller],
      providers: [
        {
          provide: GetLayoutUseCase,
          useValue: mockGetLayoutUseCase,
        },
        {
          provide: DeleteLayoutUseCase,
          useValue: mockDeleteLayoutUseCase,
        },
        {
          provide: DuplicateLayoutUseCase,
          useValue: mockDuplicateLayoutUseCase,
        },
      ],
    }).compile();

    controller = module.get<LayoutsV2Controller>(LayoutsV2Controller);
    getLayoutUseCase = module.get(GetLayoutUseCase);
    deleteLayoutUseCase = module.get(DeleteLayoutUseCase);
    duplicateLayoutUseCase = module.get(DuplicateLayoutUseCase);
  });

  describe('getLayout', () => {
    it('should return a layout by ID', async () => {
      // Arrange
      getLayoutUseCase.execute.mockResolvedValue(mockLayout);

      // Act
      const result = await controller.getLayout(mockUser as any, 'layout-id');

      // Assert
      expect(getLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'env-id',
          organizationId: 'org-id',
          layoutId: 'layout-id',
        })
      );
      expect(result).toEqual(mockLayout);
    });

    it('should propagate error when getting layout fails', async () => {
      // Arrange
      getLayoutUseCase.execute.mockRejectedValue(new Error('Layout not found'));

      // Act & Assert
      await expect(controller.getLayout(mockUser as any, 'non-existent-id')).rejects.toThrow('Layout not found');
    });
  });

  describe('deleteLayout', () => {
    it('should delete a layout by ID', async () => {
      // Arrange
      deleteLayoutUseCase.execute.mockResolvedValue(undefined);

      // Act
      const result = await controller.deleteLayout(mockUser as any, 'layout-id');

      // Assert
      expect(deleteLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'env-id',
          organizationId: 'org-id',
          userId: 'user-id',
          layoutId: 'layout-id',
        })
      );
      expect(result).toBeUndefined();
    });

    it('should propagate error when deleting layout fails', async () => {
      // Arrange
      deleteLayoutUseCase.execute.mockRejectedValue(new Error('Cannot delete layout'));

      // Act & Assert
      await expect(controller.deleteLayout(mockUser as any, 'layout-id')).rejects.toThrow('Cannot delete layout');
    });
  });

  describe('duplicateLayout', () => {
    it('should duplicate a layout', async () => {
      // Arrange
      const duplicatedLayout = {
        ...mockLayout,
        _id: 'duplicated-layout-id',
      };

      const requestBody = {
        name: 'Duplicated Layout',
        identifier: 'duplicated-layout',
      };

      duplicateLayoutUseCase.execute.mockResolvedValue(duplicatedLayout);

      // Act
      const result = await controller.duplicateLayout(mockUser as any, 'layout-id', requestBody);

      // Assert
      expect(duplicateLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'env-id',
          organizationId: 'org-id',
          userId: 'user-id',
          sourceLayoutId: 'layout-id',
          name: 'Duplicated Layout',
          identifier: 'duplicated-layout',
        })
      );
      expect(result).toEqual({
        _id: 'duplicated-layout-id',
      });
    });

    it('should propagate error when duplicating layout fails', async () => {
      // Arrange
      const requestBody = {
        name: 'Duplicated Layout',
        identifier: 'duplicated-layout',
      };

      duplicateLayoutUseCase.execute.mockRejectedValue(new Error('Duplicate failed'));

      // Act & Assert
      await expect(controller.duplicateLayout(mockUser as any, 'layout-id', requestBody)).rejects.toThrow(
        'Duplicate failed'
      );
    });
  });
});
