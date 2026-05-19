import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaginationDto } from '../common/pagination.dto';
import { DocumentsService } from './documents.service';
import { CreateDocumentTemplateDto } from './dto/create-document-template.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('document-templates')
  listTemplates(@Query() query: PaginationDto) {
    return this.documentsService.listTemplates(query);
  }

  @Post('document-templates')
  @Roles('admin', 'sales_manager')
  createTemplate(@Body() dto: CreateDocumentTemplateDto) {
    return this.documentsService.createTemplate(dto);
  }

  @Get('quotes/:quoteId/documents')
  quoteDocuments(@Param('quoteId') quoteId: string) {
    return this.documentsService.listQuoteDocuments(quoteId);
  }

  @Post('quotes/:quoteId/documents/generate')
  generate(@Param('quoteId') quoteId: string, @Body() body: { templateId?: string }) {
    return this.documentsService.generateForQuote(quoteId, body?.templateId);
  }
}
