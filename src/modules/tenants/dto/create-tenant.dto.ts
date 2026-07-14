import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsNumber,
} from "class-validator";

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  adminName?: string;

  @IsEmail()
  @IsOptional()
  adminEmail?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  adminPassword?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;

  @IsString()
  @IsOptional()
  registerNumber?: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsString()
  @IsOptional()
  ownerMobile?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  townOrVillage?: string;

  @IsNumber()
  @IsOptional()
  subscriptionMonths?: number;
}