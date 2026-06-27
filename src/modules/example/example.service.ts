import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../../common/exceptions/domain.exceptions.js';
import { ExampleRepository } from './example.repository.js';
import { CreateExampleDto } from './dto/create-example.dto.js';
import { UpdateExampleDto } from './dto/update-example.dto.js';

@Injectable()
export class ExampleService {
  constructor(private readonly repository: ExampleRepository) {}

  async findAll(offset: number, limit: number) {
    const [data, total] = await Promise.all([
      this.repository.findAll({ skip: offset, take: limit }),
      this.repository.count(),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const example = await this.repository.findById(id);
    if (!example) {
      throw new NotFoundError('Example');
    }
    return example;
  }

  async create(dto: CreateExampleDto) {
    return this.repository.create(dto);
  }

  async update(id: string, dto: UpdateExampleDto) {
    await this.findOne(id);
    return this.repository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.repository.remove(id);
  }
}
