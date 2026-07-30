module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  clearMocks: true,
  collectCoverageFrom: ['lib/**/*.js', 'app/api/register/**/*.js'],
  // Babel config lives here (inline) rather than in a root babel.config.js
  // on purpose: Next.js auto-detects a root babel.config.js and, if it
  // finds one, switches its own build off the fast default SWC compiler
  // onto Babel for the ENTIRE app — including every .js file with JSX.
  // This config only has @babel/preset-env (fine for plain lib/route
  // files, which is all Jest needs to transform), so `next build` would
  // fail on every page/component with "Support for the experimental
  // syntax 'jsx' isn't currently enabled". Keeping it inline here means
  // only Jest ever sees it.
  transform: {
    '^.+\\.jsx?$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }],
  },
};
