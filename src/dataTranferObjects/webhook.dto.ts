import { IsUrl, IsPositive } from 'class-validator';

export class CreateWebhookDto {
    @IsUrl()
    public url: string;
}

export class GetWebhookDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}

export class UpdateWebhookDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;

    @IsUrl()
    public url: string;
}

export class DeleteWebhookDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}