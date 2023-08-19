import { IsPositive } from 'class-validator';

export class CreateBindingDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public fluxId: number;

    @IsPositive({ always: true, message:'id must be positive'})
    public webhookId: number;
}

export class GetWebhookBindingsDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}

export class GetFluxBindingsDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public id: number;
}

export class DeleteBindingDto {
    @IsPositive({ always: true, message:'id must be positive'})
    public fluxId: number;

    @IsPositive({ always: true, message:'id must be positive'})
    public webhookId: number;
}