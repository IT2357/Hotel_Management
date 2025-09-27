import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5174', // Frontend dev server
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    downloadsFolder: 'cypress/downloads',
    fixturesFolder: 'cypress/fixtures',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    video: true,
    screenshotOnRunFailure: true,
    watchForFileChanges: false,
    retries: {
      runMode: 2,
      openMode: 0
    },
    env: {
      API_URL: 'http://localhost:5000',
      ADMIN_EMAIL: 'admin@example.com',
      ADMIN_PASSWORD: 'AdminPass123!',
      USER_EMAIL: 'user@example.com',
      USER_PASSWORD: 'UserPass123!'
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})
