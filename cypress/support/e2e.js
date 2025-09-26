import './commands'

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  const original = win.console.error
  win.console.error = function (message) {
    if (message && message.toString().includes('Warning: ReactDOM.render is no longer supported')) {
      return
    }
    return original.apply(win.console, arguments)
  }
})

// Global before hook
beforeEach(() => {
  cy.intercept('GET', '/api/**').as('apiGet')
  cy.intercept('POST', '/api/**').as('apiPost')
  cy.intercept('PUT', '/api/**').as('apiPut')
  cy.intercept('DELETE', '/api/**').as('apiDelete')
})
