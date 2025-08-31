import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { SubmissionsService } from './submissions.service';

class CreateSubmissionDto {
  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsObject()
  generalData!: Record<string, any>;

  @IsArray()
  products!: any[];

  @IsOptional()
  @IsString()
  emailStatus?: string;
}

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly service: SubmissionsService) {}

  @Post()
  create(@Body() body: CreateSubmissionDto) {
    // Ensure required JSON fields are present and not undefined
    const payload = {
      sessionId: body.sessionId || null,
      generalData: body.generalData ?? {},
      products: Array.isArray(body.products) ? body.products : [],
      emailStatus: body.emailStatus || null,
    };
    return this.service.create(payload);
  }

  @Get()
  list() {
    return this.service.findMany();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}


