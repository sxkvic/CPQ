import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateQuoteItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discountRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxRate?: number;
}
