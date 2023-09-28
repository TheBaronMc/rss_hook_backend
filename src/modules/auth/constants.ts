import { log } from "console";
import { ENVIRONMENT_DEV_VALUE, ENVIRONMENT_ENV, ENVIRONMENT_PROD_VALUE, JWT_SECRET } from "../../configuration/readFile";

type JwtConstants = {
    secret: string
};

export function getJwtConstants(): JwtConstants {
    const constants: JwtConstants = {
        secret: ''
    };
    
    log(process.env[ENVIRONMENT_ENV]);

    if (process.env[ENVIRONMENT_ENV] == ENVIRONMENT_DEV_VALUE 
        || process.env[ENVIRONMENT_ENV] === undefined) {
        if (process.env[JWT_SECRET] != undefined && process.env[JWT_SECRET] != '') {
            constants.secret = process.env[JWT_SECRET];
        } else {
            constants.secret = 'thisSecretMustNotBeUsedInProd';
        }
    } else if (process.env[ENVIRONMENT_ENV] == ENVIRONMENT_PROD_VALUE) {
        if (process.env[JWT_SECRET] == '') {
            throw new Error('A secret must be set for the production environment');
        }
        constants.secret = process.env[JWT_SECRET];
    } else {
        throw new Error('Wrong value for environment');
    }

    return constants;
}