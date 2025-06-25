import { Test, TestingModule } from '@nestjs/testing';
import { DeleteLayoutCommand as V1DeleteLayoutCommand, DeleteLayoutUseCase as V1DeleteLayoutUseCase } from '../../../layouts-v1/usecases';
import { DeleteLayoutUseCase } from './delete-layout.use-case';
import { DeleteLayoutCommand } from './delete-layout.command';

describe('DeleteLayoutUseCase', () => {
  let useCase: DeleteLayoutUseCase;
  let v1DeleteLayoutUseCase: jest.Mocked<V1DeleteLayoutUseCase>;

  const mockUser = {
    _id: 'user-id',
    environmentId: 'env-id',
    organizationId: 'org-id',
  };

  beforeEach(async () => {
    const mockV1DeleteLayoutUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteLayoutUseCase,
        {
          provide: V1DeleteLayoutUseCase,
          useValue: mockV1DeleteLayoutUseCase,
        },
      ],
    }).compile();

    useCase = module.get<DeleteLayoutUseCase>(DeleteLayoutUseCase);
    v1DeleteLayoutUseCase = module.get(V1DeleteLayoutUseCase);
  });

  describe('execute', () => {
    it('should successfully delete a layout using v1 usecase', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'layout-id',
        user: mockUser,
      } as DeleteLayoutCommand;

      v1DeleteLayoutUseCase.execute.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(v1DeleteLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'env-id',
          organizationId: 'org-id',
          userId: 'user-id',
          layoutId: 'layout-id',
        })
      );

      expect(result).toBeUndefined();
    });

    it('should propagate error when v1 usecase fails with conflict', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'default-layout-id',
        user: mockUser,
      } as DeleteLayoutCommand;

      v1DeleteLayoutUseCase.execute.mockRejectedValue(
        new Error('Layout with id default-layout-id is being used as your default layout, so it can not be deleted')
      );

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'Layout with id default-layout-id is being used as your default layout, so it can not be deleted'
      );
    });

    it('should propagate error when layout is in use', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'in-use-layout-id',
        user: mockUser,
      } as DeleteLayoutCommand;

      v1DeleteLayoutUseCase.execute.mockRejectedValue(
        new Error('Layout with id in-use-layout-id is being used so it can not be deleted')
      );

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'Layout with id in-use-layout-id is being used so it can not be deleted'
      );
    });

    it('should propagate error when layout is not found', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'non-existent-layout-id',
        user: mockUser,
      } as DeleteLayoutCommand;

      v1DeleteLayoutUseCase.execute.mockRejectedValue(new Error('Layout not found'));

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow('Layout not found');
    });

    it('should handle different layout identifiers', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'different-layout-identifier',
        user: mockUser,
      } as DeleteLayoutCommand;

      v1DeleteLayoutUseCase.execute.mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(v1DeleteLayoutUseCase.execute).toHaveBeenCalledWith(
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
      } as DeleteLayoutCommand;

      v1DeleteLayoutUseCase.execute.mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      expect(v1DeleteLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          environmentId: 'different-env-id',
          organizationId: 'different-org-id',
          userId: 'different-user-id',
          layoutId: 'layout-id',
        })
      );
    });

    it('should pass correct command structure to v1 usecase', async () => {
      // Arrange
      const command = {
        layoutIdOrInternalId: 'layout-id',
        user: mockUser,
      } as DeleteLayoutCommand;

      v1DeleteLayoutUseCase.execute.mockResolvedValue(undefined);

      // Act
      await useCase.execute(command);

      // Assert
      const expectedCommand = {
        environmentId: 'env-id',
        organizationId: 'org-id',
        userId: 'user-id',
        layoutId: 'layout-id',
      };

      expect(v1DeleteLayoutUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining(expectedCommand)
      );
      expect(v1DeleteLayoutUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });
});
