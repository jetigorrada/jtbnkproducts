/**
 * Example data for each endpoint, based on the OpenAPI schema examples.
 * Used by the "Load Example" feature to pre-fill forms.
 * Translations use only en-US and sq-AL (Albanian).
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
              translations: {
                'en-US': {
                  name: 'Terms and Conditions',
                },
                'sq-AL': {
                  name: 'Kushtet dhe Rregullat',
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
              translations: {
                'en-US': {
                  question: 'Can I transfer my existing mortgage from another bank?',
                  answer:
                    'Yes, you can transfer your existing mortgage from another bank to us through a process called a home loan balance transfer.',
                },
                'sq-AL': {
                  question: 'A mund ta transferoj hipoteken time ekzistuese nga nje banke tjeter?',
                  answer:
                    'Po, ju mund ta transferoni hipoteken tuaj ekzistuese nga nje banke tjeter tek ne permes nje procesi te quajtur transferim i bilancit te kredise.',
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
          translations: {
            'en-US': {
              content: 'This is the best product.',
            },
            'sq-AL': {
              content: 'Ky eshte produkti me i mire.',
            },
          },
        },
      ],
      features: [
        {
          name: 'Surprise Benefit',
          description: 'Surprise benefit when you apply now!',
          type: 'benefit',
          translations: {
            'en-US': {
              name: 'Surprise Benefit',
              description: 'Surprise benefit when you apply now!',
            },
            'sq-AL': {
              name: 'Perfitim Surprize',
              description: 'Perfitim surprize kur aplikoni tani!',
            },
          },
        },
      ],
      translations: {
        'en-US': {
          name: 'Fixed-Term Mortgage',
        },
        'sq-AL': {
          name: 'Hipoteke me Afat te Caktuar',
        },
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
              content: 'A mortgage is a long-term loan that helps you turn the keys to your dream home into reality.',
            },
            'sq-AL': {
              content: 'Nje hipoteke eshte nje kredi afatgjate qe ju ndihmon te realizoni shtepine e enderrave tuaja.',
            },
          },
        },
      ],
      translations: {
        'en-US': {
          name: 'Accounts',
          description: 'Flexible, secure, and easy everyday banking.',
        },
        'sq-AL': {
          name: 'Llogarite',
          description: 'Banke e perditshme fleksibel, e sigurt dhe e lehte.',
        },
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
    },
  },
};
