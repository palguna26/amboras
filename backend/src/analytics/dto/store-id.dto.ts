import { IsUUID } from 'class-validator';

export class StoreIdDto {
  @IsUUID('4', { message: 'store_id must be a valid UUID' })
  store_id!: string;
}
