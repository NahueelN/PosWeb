# Producto Catalogo Specification

## Purpose

Maintain products as catalog records independent from operational stock.

## Requirements

### Requirement: Catalog-only product maintenance

The system MUST allow product create and edit flows without capturing, requiring, or mutating stock. Unlike today, catalog maintenance SHALL NOT imply inventory creation or availability.

#### Scenario: Create product without stock

- GIVEN a user completes the product form with valid catalog data
- WHEN the product is created
- THEN the request and stored catalog record omit stock as required input
- AND the product is available for later branch stock initialization

#### Scenario: Edit product without changing stock

- GIVEN an existing product has branch stock managed elsewhere
- WHEN the user edits product catalog data
- THEN the update succeeds without a stock field
- AND the edit does not create, reset, or infer branch stock

### Requirement: Intentional branch stock initialization after creation

After a product is created, the system MUST provide a clear next step to initialize stock per branch intentionally.

#### Scenario: Post-create initialization path

- GIVEN a product was created successfully
- WHEN the create flow finishes
- THEN the user sees an explicit action to initialize branch stock
- AND that action targets the branch stock workflow, not the product form

#### Scenario: Product exists before stock initialization

- GIVEN a product was created and no branch stock has been initialized yet
- WHEN the user leaves the create flow
- THEN the product remains a valid catalog item
- AND it is not treated as sellable stock for any branch
