describe('AI Menu Extractor', () => {
  beforeEach(() => {
    cy.adminLogin()
    cy.visit('/admin/ai-menu-extractor')
    cy.waitForPageLoad()
  })

  it('should display AI menu extractor interface', () => {
    cy.get('[data-cy="ai-extractor-title"]').should('contain', 'AI Menu Extractor')
    cy.get('[data-cy="upload-area"]').should('be.visible')
    cy.get('[data-cy="extract-button"]').should('be.visible')
    cy.get('[data-cy="supported-formats"]').should('be.visible')
  })

  it('should upload and process menu image', () => {
    // Upload test image
    cy.get('[data-cy="file-input"]').selectFile('cypress/fixtures/sample-menu.jpg', { force: true })
    
    // Verify file is selected
    cy.get('[data-cy="selected-file"]').should('contain', 'sample-menu.jpg')
    cy.get('[data-cy="file-preview"]').should('be.visible')
    
    // Process image
    cy.get('[data-cy="extract-button"]').click()
    cy.get('[data-cy="processing-indicator"]').should('be.visible')
    
    // Wait for AI processing
    cy.wait('@apiPost', { timeout: 30000 })
    
    // Verify extraction results
    cy.get('[data-cy="extraction-results"]').should('be.visible')
    cy.get('[data-cy="extracted-items"]').should('have.length.greaterThan', 0)
  })

  it('should display extracted menu items correctly', () => {
    // Mock AI response
    cy.intercept('POST', '/api/ai/extract-menu', { fixture: 'ai-extraction-result.json' }).as('aiExtract')
    
    cy.get('[data-cy="file-input"]').selectFile('cypress/fixtures/sample-menu.jpg', { force: true })
    cy.get('[data-cy="extract-button"]').click()
    cy.wait('@aiExtract')
    
    // Verify extracted items structure
    cy.get('[data-cy="extracted-item"]').each(($item) => {
      cy.wrap($item).within(() => {
        cy.get('[data-cy="item-name"]').should('be.visible')
        cy.get('[data-cy="item-price"]').should('be.visible')
        cy.get('[data-cy="item-description"]').should('be.visible')
        cy.get('[data-cy="item-category"]').should('be.visible')
        cy.get('[data-cy="confidence-score"]').should('be.visible')
      })
    })
  })

  it('should edit extracted items before saving', () => {
    cy.intercept('POST', '/api/ai/extract-menu', { fixture: 'ai-extraction-result.json' }).as('aiExtract')
    
    cy.get('[data-cy="file-input"]').selectFile('cypress/fixtures/sample-menu.jpg', { force: true })
    cy.get('[data-cy="extract-button"]').click()
    cy.wait('@aiExtract')
    
    // Edit first extracted item
    cy.get('[data-cy="extracted-item"]').first().within(() => {
      cy.get('[data-cy="edit-item-button"]').click()
    })
    
    cy.get('[data-cy="edit-modal"]').should('be.visible')
    cy.get('[data-cy="edit-name-input"]').clear().type('Corrected Item Name')
    cy.get('[data-cy="edit-price-input"]').clear().type('15.99')
    cy.get('[data-cy="save-edit-button"]').click()
    
    // Verify changes
    cy.get('[data-cy="extracted-item"]').first().within(() => {
      cy.get('[data-cy="item-name"]').should('contain', 'Corrected Item Name')
      cy.get('[data-cy="item-price"]').should('contain', '15.99')
    })
  })

  it('should save selected items to menu', () => {
    cy.intercept('POST', '/api/ai/extract-menu', { fixture: 'ai-extraction-result.json' }).as('aiExtract')
    
    cy.get('[data-cy="file-input"]').selectFile('cypress/fixtures/sample-menu.jpg', { force: true })
    cy.get('[data-cy="extract-button"]').click()
    cy.wait('@aiExtract')
    
    // Select items to save
    cy.get('[data-cy="item-checkbox"]').eq(0).check()
    cy.get('[data-cy="item-checkbox"]').eq(1).check()
    
    // Save to menu
    cy.get('[data-cy="save-to-menu-button"]').click()
    cy.wait('@apiPost')
    
    cy.get('[data-cy="success-notification"]').should('contain', 'Items added to menu successfully')
  })

  it('should handle extraction errors gracefully', () => {
    cy.intercept('POST', '/api/ai/extract-menu', { statusCode: 500, body: { error: 'AI service unavailable' } }).as('aiError')
    
    cy.get('[data-cy="file-input"]').selectFile('cypress/fixtures/sample-menu.jpg', { force: true })
    cy.get('[data-cy="extract-button"]').click()
    cy.wait('@aiError')
    
    cy.get('[data-cy="error-message"]').should('be.visible')
    cy.get('[data-cy="error-message"]').should('contain', 'Failed to extract menu items')
  })

  it('should validate file types', () => {
    // Try to upload unsupported file type
    cy.get('[data-cy="file-input"]').selectFile('cypress/fixtures/food-data.json', { force: true })
    
    cy.get('[data-cy="file-error"]').should('be.visible')
    cy.get('[data-cy="file-error"]').should('contain', 'Please select a valid image file')
  })

  it('should show confidence scores and allow filtering', () => {
    cy.intercept('POST', '/api/ai/extract-menu', { fixture: 'ai-extraction-result.json' }).as('aiExtract')
    
    cy.get('[data-cy="file-input"]').selectFile('cypress/fixtures/sample-menu.jpg', { force: true })
    cy.get('[data-cy="extract-button"]').click()
    cy.wait('@aiExtract')
    
    // Filter by confidence level
    cy.get('[data-cy="confidence-filter"]').select('High (>80%)')
    
    cy.get('[data-cy="extracted-item"]').each(($item) => {
      cy.wrap($item).within(() => {
        cy.get('[data-cy="confidence-score"]').invoke('text').then((score) => {
          const confidence = parseInt(score.replace('%', ''))
          expect(confidence).to.be.greaterThan(80)
        })
      })
    })
  })

  it('should allow batch processing of multiple images', () => {
    // Upload multiple files
    cy.get('[data-cy="file-input"]').selectFile([
      'cypress/fixtures/menu1.jpg',
      'cypress/fixtures/menu2.jpg'
    ], { force: true })
    
    cy.get('[data-cy="selected-files"]').should('contain', '2 files selected')
    cy.get('[data-cy="batch-extract-button"]').click()
    
    cy.get('[data-cy="batch-progress"]').should('be.visible')
    cy.wait('@apiPost')
    
    cy.get('[data-cy="batch-results"]').should('be.visible')
    cy.get('[data-cy="total-extracted"]').should('be.visible')
  })
})
