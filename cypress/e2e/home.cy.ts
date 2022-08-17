describe('home page', () => {
  it('should ask you to sign in if there are no cookies', () => {
    cy.visit('/')

    cy.get('h1').should('have.text', 'Coffee Recipes')

    cy.get('button').should('have.text', 'Sign In')
  })
})
