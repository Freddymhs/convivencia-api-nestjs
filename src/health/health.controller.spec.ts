import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../database/prisma.service';

const mockPrisma = {
  isHealthy: jest.fn(),
};

const createMockReply = () => {
  const reply = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockResolvedValue(undefined),
  };
  return reply as unknown as Parameters<HealthController['check']>[0];
};

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('should return 200 ok when DB is healthy', async () => {
    mockPrisma.isHealthy.mockResolvedValue(true);
    const reply = createMockReply();

    await controller.check(reply);

    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ok', db: 'connected' }),
    );
  });

  it('should return 503 degraded when DB is down', async () => {
    mockPrisma.isHealthy.mockResolvedValue(false);
    const reply = createMockReply();

    await controller.check(reply);

    expect(reply.status).toHaveBeenCalledWith(503);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'degraded', db: 'disconnected' }),
    );
  });
});
