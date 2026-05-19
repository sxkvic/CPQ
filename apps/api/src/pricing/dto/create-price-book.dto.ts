import { IsOptional, IsString } from 'class-validator';

export class CreatePriceBookDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  customerGrade?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  effectiveAt?: string;

  @IsOptional()
  @IsString()
  expiredAt?: string;
}
