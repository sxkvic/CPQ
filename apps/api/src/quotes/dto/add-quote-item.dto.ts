import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SelectedOptionDto {
  @IsString()
  optionId!: string;

  @IsArray()
  valueIds!: string[];
}

export class AddQuoteItemDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxRate?: number;

  @IsOptional()
  @IsArray()
  selectedOptions?: SelectedOptionDto[];
}
