import type {Config} from 'jest';

const config: Config = {
    verbose: true,
    forceExit: true,
    detectOpenHandles: false,
    maxWorkers: 1,
    testTimeout: 50000,
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