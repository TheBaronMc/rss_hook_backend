import { Type } from 'class-transformer';
import { IsUrl, IsPositive, IsInt } from 'class-validator';

export class CreateFluxDto {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @IsUrl({ require_tld: false })
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

    // eslint-disable-next-line @typescript-eslint/naming-convention
    @IsUrl({ require_tld: false })
    public url: string;
}

export class DeleteFluxDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}