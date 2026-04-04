/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/__tests__/**/**/*.test.js'],
    collectCoverageFrom: [
        'services/**/*.js',
    ],
    coverageThreshold: {
        global: {
            lines:     80,
            functions: 80,
            branches:  70,
        },
    },
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
};
