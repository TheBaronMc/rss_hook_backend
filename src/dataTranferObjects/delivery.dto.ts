import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class GetDeliveryDstDto {
    @IsInt()
    @Type(() => Number)
    @IsPositive({ message:'id must be positive'})
    public id: number;
}

export class GetDeliverySrcDto {
    @IsInt()
    @Type(() => Number)
    @IsPositive({ message:'id must be positive'})
    public id: number;
}