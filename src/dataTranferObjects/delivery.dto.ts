import { IsPositive } from 'class-validator';

export class GetDeliveryDstDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}

export class GetDeliverySrcDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}