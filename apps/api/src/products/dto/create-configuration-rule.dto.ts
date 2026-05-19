import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateConfigurationRuleDto {
  @IsString()
  productId!: string;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsIn(['require', 'exclude', 'quantity', 'region'])
  ruleType!: string;

  @IsObject()
  conditionJson!: Record<string, unknown>;

  @IsObject()
  actionJson!: Record<string, unknown>;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  severity?: string;
}
