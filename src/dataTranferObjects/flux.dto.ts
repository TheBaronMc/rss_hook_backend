import { Type } from 'class-transformer';
import { IsUrl, IsPositive, IsInt } from 'class-validator';

export class CreateFluxDto {
    @IsUrl()
    public url: string;
}

export class GetFluxDto {
    @IsInt()
    @Type(() => Number)
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}

export class UpdateFluxDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;

    @IsUrl()
    public url: string;
}

export class DeleteFluxDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}