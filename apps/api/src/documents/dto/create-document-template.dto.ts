import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateDocumentTemplateDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  templateType?: string;

  @IsString()
  contentHtml!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
