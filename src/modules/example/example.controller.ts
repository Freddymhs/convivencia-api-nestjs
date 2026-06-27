import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaginationQueryDto, ErrorResponseDto } from '@common/dto/index.js';
import { ExampleService } from './example.service.js';
import { CreateExampleDto } from './dto/create-example.dto.js';
import { UpdateExampleDto } from './dto/update-example.dto.js';
import { ExampleResponseDto } from './dto/example-response.dto.js';

@ApiTags('Example')
@Controller('examples')
export class ExampleController {
  constructor(private readonly service: ExampleService) {}

  @Get()
  @ApiOperation({ summary: 'Listar recursos con paginacion' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada',
    type: [ExampleResponseDto],
  })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query.offset, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener recurso por ID' })
  @ApiResponse({
    status: 200,
    description: 'Recurso encontrado',
    type: ExampleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado',
    type: ErrorResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear recurso' })
  @ApiResponse({
    status: 201,
    description: 'Recurso creado',
    type: ExampleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos invalidos',
    type: ErrorResponseDto,
  })
  create(@Body() dto: CreateExampleDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar recurso' })
  @ApiResponse({
    status: 200,
    description: 'Recurso actualizado',
    type: ExampleResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado',
    type: ErrorResponseDto,
  })
  update(@Param('id') id: string, @Body() dto: UpdateExampleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar recurso' })
  @ApiResponse({ status: 204, description: 'Recurso eliminado' })
  @ApiResponse({
    status: 404,
    description: 'Recurso no encontrado',
    type: ErrorResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
