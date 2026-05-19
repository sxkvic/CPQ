import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateContractDto {
  @IsOptional()
  @IsString()
  quoteId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsString()
  customerId!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  renewalNoticeDays?: number;
}
