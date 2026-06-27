import { Test, TestingModule } from '@nestjs/testing';
import { ExampleService } from './example.service';
import { ExampleRepository } from './example.repository';
import { NotFoundError } from '../../common/exceptions/domain.exceptions';

const MOCK_EXAMPLE = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test',
  description: 'Test description',
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findAll: jest.fn().mockResolvedValue([MOCK_EXAMPLE]),
  findById: jest.fn().mockResolvedValue(MOCK_EXAMPLE),
  create: jest.fn().mockResolvedValue(MOCK_EXAMPLE),
  update: jest.fn().mockResolvedValue(MOCK_EXAMPLE),
  remove: jest.fn().mockResolvedValue(MOCK_EXAMPLE),
  count: jest.fn().mockResolvedValue(1),
};

describe('ExampleService', () => {
  let service: ExampleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExampleService,
        { provide: ExampleRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ExampleService>(ExampleService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated data with total', async () => {
      const result = await service.findAll(0, 20);

      expect(result.data).toEqual([MOCK_EXAMPLE]);
      expect(result.total).toBe(1);
      expect(mockRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return an example by id', async () => {
      const result = await service.findOne(MOCK_EXAMPLE.id);

      expect(result).toEqual(MOCK_EXAMPLE);
      expect(mockRepository.findById).toHaveBeenCalledWith(MOCK_EXAMPLE.id);
    });

    it('should throw NotFoundError when not found', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe('create', () => {
    it('should create and return an example', async () => {
      const dto = { name: 'New', description: 'Desc' };
      const result = await service.create(dto);

      expect(result).toEqual(MOCK_EXAMPLE);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update and return an example', async () => {
      const dto = { name: 'Updated' };
      const result = await service.update(MOCK_EXAMPLE.id, dto);

      expect(result).toEqual(MOCK_EXAMPLE);
      expect(mockRepository.update).toHaveBeenCalledWith(MOCK_EXAMPLE.id, dto);
    });

    it('should throw NotFoundError when updating non-existent', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.update('nonexistent', { name: 'X' }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('remove', () => {
    it('should remove and return an example', async () => {
      const result = await service.remove(MOCK_EXAMPLE.id);

      expect(result).toEqual(MOCK_EXAMPLE);
      expect(mockRepository.remove).toHaveBeenCalledWith(MOCK_EXAMPLE.id);
    });

    it('should throw NotFoundError when removing non-existent', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
