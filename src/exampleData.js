/**
 * Example data for each endpoint, based on the OpenAPI schema examples.
 * Used by the "Load Example" feature to pre-fill forms.
 */

export const exampleData = {
  createProduct: {
    pathValues: {},
    queryValues: {},
    bodyValues: {
      externalProductId: 'ext-id-001',
      productKey: 'mortgage-2025-05-fixed-term',
      templateKey: 'mortgages-fixed-term-view',
      name: 'Fixed-Term Mortgage',
      availabilityStartDate: '2025-06-01T00:00:00Z',
      availabilityEndDate: '2025-12-01T23:59:59Z',
      rank: 0,
      icon: 'product-icon-from-design-system',
      categories: ['cards'],
      linkGroups: [
        {
          groupKey: 'documents',
          links: [
            {
              type: 'PDF',
              name: 'Terms and Conditions',
              url: 'https://cdn.example.com/documents/mortgage-terms-and-conditions.pdf',
              additions: {
                additionalProp1: 'string',
                additionalProp2: 'string',
                additionalProp3: 'string',
              },
              translations: {
                'en-US': {
                  name: 'Product',
                  description: 'This is product',
                },
                'fr-FR': {
                  name: 'Produit',
                  description: "C'est un produit",
                },
              },
            },
          ],
        },
      ],
      faqs: [
        {
          faqKey: 'faq-main-section',
          faqItems: [
            {
              question: 'Can I transfer my existing mortgage from another bank?',
              answer:
                'Yes, you can transfer your existing mortgage from another bank to us through a process called a home loan balance transfer. It allows you to move your outstanding loan to our bank, often to enjoy better interest rates, lower EMIs, or improved loan terms.',
              additions: {
                additionalProp1: 'string',
                additionalProp2: 'string',
                additionalProp3: 'string',
              },
              translations: {
                'en-US': {
                  name: 'Product',
                  description: 'This is product',
                },
                'fr-FR': {
                  name: 'Produit',
                  description: "C'est un produit",
                },
              },
            },
          ],
        },
      ],
      descriptions: [
        {
          type: 'pricing_section_header',
          content: 'This is the best product.',
          additions: {
            additionalProp1: 'string',
            additionalProp2: 'string',
            additionalProp3: 'string',
          },
          translations: {
            'en-US': {
              name: 'Product',
              description: 'This is product',
            },
            'fr-FR': {
              name: 'Produit',
              description: "C'est un produit",
            },
          },
        },
      ],
      features: [
        {
          name: 'Surprise Benefit',
          description: 'Surprise benefit when you apply now!',
          type: 'benefit',
          additions: {
            additionalProp1: 'string',
            additionalProp2: 'string',
            additionalProp3: 'string',
          },
          translations: {
            'en-US': {
              name: 'Product',
              description: 'This is product',
            },
            'fr-FR': {
              name: 'Produit',
              description: "C'est un produit",
            },
          },
        },
      ],
      translations: {
        'en-US': {
          name: 'Product',
          description: 'This is product',
        },
        'fr-FR': {
          name: 'Produit',
          description: "C'est un produit",
        },
      },
      additions: {
        additionalProp1: 'string',
        additionalProp2: 'string',
        additionalProp3: 'string',
      },
    },
  },

  updateProduct: {
    pathValues: { productKey: 'mortgage-2025-05-fixed-term' },
    queryValues: {},
    bodyValues: {
      availabilityStartDate: '2025-06-01T00:00:00Z',
      availabilityEndDate: '2025-12-01T23:59:59Z',
      rank: 11.05,
    },
  },

  upsertCategory: {
    pathValues: { categoryKey: 'cards' },
    queryValues: {},
    bodyValues: {
      externalCategoryId: 'ext-id-001',
      name: 'Accounts',
      description: 'Flexible, secure, and easy everyday banking.',
      icon: 'product-icon-from-design-system',
      additionalDescriptions: [
        {
          content:
            'A mortgage is a long-term loan that helps you turn the keys to your dream home into reality.',
          type: 'tagline',
          translations: {
            'en-US': {
              name: 'Product',
              description: 'This is product',
            },
            'fr-FR': {
              name: 'Produit',
              description: "C'est un produit",
            },
          },
        },
      ],
      translations: {
        'en-US': {
          name: 'Product',
          description: 'This is product',
        },
        'fr-FR': {
          name: 'Produit',
          description: "C'est un produit",
        },
      },
      additions: {
        additionalProp1: 'string',
        additionalProp2: 'string',
        additionalProp3: 'string',
      },
    },
  },

  upsertHierarchy: {
    pathValues: { hierarchyKey: 'retail-products' },
    queryValues: {},
    bodyValues: {
      roots: [
        {
          category: 'cards',
          subCategories: [
            {
              category: 'credit-cards',
              subCategories: [],
            },
            {
              category: 'debit-cards',
              subCategories: [],
            },
          ],
        },
      ],
      additions: {
        additionalProp1: 'string',
      },
    },
  },
};
