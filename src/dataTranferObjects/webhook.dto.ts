import { Type } from 'class-transformer';
import { IsUrl, IsPositive, IsInt } from 'class-validator';

export class CreateWebhookDto {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    @IsUrl({ require_tld: false })
    public url: string;
}

export class GetWebhookDto {
    @IsInt()
    @Type(() => Number)
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}

export class UpdateWebhookDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    @IsUrl({ require_tld: false })
    public url: string;
}

export class DeleteWebhookDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}