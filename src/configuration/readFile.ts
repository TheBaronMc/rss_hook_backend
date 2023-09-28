/* eslint-disable @typescript-eslint/naming-convention */

import { readFileSync, existsSync } from 'fs';

type Configuration = { 
    [section: string]: { 
        [key: string]: string 
    } 
};

export class ConfParseError extends Error {}

/**
 * Parse an INI string and returns a Configuration object
 * @param data {string} data contained in the ini file
 * @returns 
 */
function parseIni(data: string): Configuration {
    const conf: Configuration = {};

    // Parse each line
    data.split('\n').reduce((section: string, line: string, index: number) => {
        let match: RegExpMatchArray;
        // new section
        if (match = line.match(/^\[([a-zA-Z]+)\]$/)) {
            section = match[1];
            conf[section] = {};
        }
        // new element
        else if (match = line.match(/^([a-zA-Z]+)="?([^"]+)"?$/)) {
            if (section === undefined) {
                throw new ConfParseError(`Configuration parse error at line ${index+1}: element outside a section`);
            }

            const key = match[1];
            const value = match[2];

            conf[section][key] = value;
        } 
        // Comment
        else if (line.startsWith(';') || line.startsWith('#')) {
            // Do nothing
        }
        else {
            throw new ConfParseError(`Configuration parse error at line ${index+1}: ${line}`);
        }
        return section;

    }, undefined);

    return conf;
}

function trySetEnv(name: string, defaultValue: string, conf: Configuration, pathInConf: string[], possibilities?: string[]): void {
    if (process.env[name] === undefined) {
        const valueInConf = pathInConf.reduce((previous: any, current: any) => {
            if (previous != undefined) {
                return previous[current];
            } else {
                return undefined;
            }
        }, conf);

        process.env[name] = valueInConf === undefined ? defaultValue : valueInConf;

        if (possibilities && !possibilities.includes(process.env[name])) {
            throw new Error(`Wrong value for '${process.env[name]}': Value must be in ${possibilities}`);
        }
    }
}

export const ACCESS_PASSWORD_ENV = 'ACCESS_PASSWORD';
export const ENVIRONMENT_ENV = 'ENV';
export const ENVIRONMENT_PROD_VALUE = 'PROD';
export const ENVIRONMENT_DEV_VALUE = 'DEV';
export const JWT_SECRET = 'JWT_SECRET';


/**
 * Read the potential INI file and set env variables
 * @param filePath {string} location of configuration file
 * @returns 
 */
export function setConfiguration(filePath: string): void {
    // read configuration file
    if (filePath != undefined && existsSync(filePath)) {
        const data = readFileSync(filePath, { encoding: 'utf-8' });
        const conf = parseIni(data);

        // Set access password
        const defaultPass = '';
        trySetEnv(ACCESS_PASSWORD_ENV, defaultPass, conf, ['general', 'access_password']);
        trySetEnv(ENVIRONMENT_ENV, 'ENV', conf, ['general', 'environment'], [ENVIRONMENT_PROD_VALUE, ENVIRONMENT_DEV_VALUE]);
        trySetEnv(JWT_SECRET, '', conf, ['general', 'secret']);
    } 
}