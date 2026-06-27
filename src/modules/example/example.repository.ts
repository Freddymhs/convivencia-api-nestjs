import { Injectable } from '@nestjs/common';
import { Example, Prisma } from '@prisma/client';
import { BaseRepository } from '../../database/base.repository.js';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class ExampleRepository extends BaseRepository<
  Example,
  Prisma.ExampleCreateInput,
  Prisma.ExampleUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get delegate() {
    return this.prisma.example;
  }

  async count(): Promise<number> {
    return this.prisma.example.count();
  }
}
