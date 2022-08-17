describe('home page', () => {
  it('passes', () => {
    cy.visit('/')

    cy.get('h1').should('have.text', 'Coffee Recipes')
  })
})
