import { Module } from '@nestjs/common';
import { ExampleController } from './example.controller.js';
import { ExampleService } from './example.service.js';
import { ExampleRepository } from './example.repository.js';

@Module({
  controllers: [ExampleController],
  providers: [ExampleService, ExampleRepository],
  exports: [ExampleService],
})
export class ExampleModule {}
