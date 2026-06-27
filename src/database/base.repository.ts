import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma delegates use generated
 * types per model; `any` is required here because the generic base cannot reference
 * model-specific create/update input types. Concrete repositories provide type safety via generics. */
type PrismaDelegate<T> = {
  findUnique: (args: { where: { id: string } }) => Promise<T | null>;
  findMany: (args?: { skip?: number; take?: number }) => Promise<T[]>;
  create: (args: { data: any }) => Promise<T>;
  update: (args: { where: { id: string }; data: any }) => Promise<T>;
  delete: (args: { where: { id: string } }) => Promise<T>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

@Injectable()
export abstract class BaseRepository<
  T,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
> {
  constructor(protected readonly prisma: PrismaService) {}

  protected abstract get delegate(): PrismaDelegate<T>;

  async findById(id: string): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  async findAll(params?: { skip?: number; take?: number }): Promise<T[]> {
    return this.delegate.findMany(params);
  }

  async create(data: CreateInput): Promise<T> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    return this.delegate.update({ where: { id }, data });
  }

  async remove(id: string): Promise<T> {
    return this.delegate.delete({ where: { id } });
  }
}
