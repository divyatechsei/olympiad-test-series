module.exports = {
     testEnvironment: 'node',
     testMatch: ['**/__tests__/**/*.test.js'],
     clearMocks: true,
     collectCoverageFrom: ['lib/**/*.js'],
     transform: {
       '^.+\\.js$': ['babel-jest', { configFile: './babel.jest.config.js' }],
     },
   };
