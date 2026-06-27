import { PartialType } from '@nestjs/swagger';
import { CreateExampleDto } from './create-example.dto.js';

export class UpdateExampleDto extends PartialType(CreateExampleDto) {}
