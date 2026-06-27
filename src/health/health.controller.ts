import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check with DB connectivity' })
  @ApiResponse({ status: 200, description: 'Service healthy' })
  @ApiResponse({ status: 503, description: 'Service degraded' })
  async check(@Res() reply: FastifyReply) {
    const dbHealthy = await this.prisma.isHealthy();
    const status = dbHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    await reply.status(status).send({
      status: dbHealthy ? 'ok' : 'degraded',
      db: dbHealthy ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
}
