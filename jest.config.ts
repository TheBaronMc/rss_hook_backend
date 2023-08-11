import type {Config} from 'jest';

const config: Config = {
    verbose: true,
    forceExit: true,
    maxWorkers: 1,
    moduleFileExtensions: [
        "js",
        "json",
        "ts"
    ],
    rootDir: "src",
    testRegex: ".*\\.spec\\.ts$",
    transform: {
        "^.+\\.(t|j)s$": "ts-jest"
    },
    collectCoverageFrom: [
      "**/*.(t|j)s"
    ],
    coverageDirectory: "../coverage",
    testEnvironment: "node" 
};

export default config;