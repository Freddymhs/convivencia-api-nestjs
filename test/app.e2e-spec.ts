import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './../src/app.module';

interface HealthResponse {
  status: string;
  db: string;
  uptime: number;
  timestamp: string;
}

describe('Health (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health should return health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    const body = JSON.parse(response.body) as HealthResponse;
    expect(response.statusCode).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.db).toBe('connected');
    expect(body.uptime).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });
});
