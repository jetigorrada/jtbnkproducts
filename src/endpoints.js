// Endpoint definitions derived from the OpenAPI 3.0.3 YAML specification
// product-directory-integration-inbound-api-v1.3.0

export const BASE_URL = 'http://localhost:8080';

// Field type constants
const T = {
  TEXT: 'text',
  NUMBER: 'number',
  DATETIME: 'datetime',
  ARRAY: 'array',
  OBJECT: 'object',
  KEY_VALUE: 'key-value',
  TRANSLATIONS: 'translations',
  HIERARCHY: 'hierarchy',
  CATEGORY_PICKER: 'category-picker',
  ICON: 'icon',
  SLIDER: 'slider',
};

// ---------- Reusable sub-schemas ----------

const additionsField = {
  key: 'additions',
  label: 'Additions',
  type: T.KEY_VALUE,
  description: 'Additional properties (key-value pairs)',
  required: false,
};

const translationsField = {
  key: 'translations',
  label: 'Translations',
  type: T.TRANSLATIONS,
  description: 'English and Albanian translations',
  required: false,
};

const linkFields = [
  { key: 'type', label: 'Type', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. PDF', translatable: false },
  { key: 'name', label: 'Name', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. Terms and Conditions' },
  { key: 'url', label: 'URL', type: T.TEXT, required: true, placeholder: 'e.g. https://cdn.example.com/doc.pdf', translatable: false },
  additionsField,
  translationsField,
];

const faqItemFields = [
  { key: 'question', label: 'Question', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'Enter question' },
  { key: 'answer', label: 'Answer', type: T.TEXT, required: true, minLength: 1, maxLength: 2000, placeholder: 'Enter answer', multiline: true },
  additionsField,
  translationsField,
];

const descriptionFields = [
  { key: 'type', label: 'Type', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. pricing_section_header', translatable: false },
  { key: 'content', label: 'Content', type: T.TEXT, required: true, minLength: 1, maxLength: 2000, placeholder: 'Description content', multiline: true },
  additionsField,
  translationsField,
];

const featureFields = [
  { key: 'name', label: 'Name', type: T.TEXT, required: true, minLength: 1, maxLength: 100, placeholder: 'e.g. Surprise Benefit' },
  { key: 'description', label: 'Description', type: T.TEXT, required: false, minLength: 1, maxLength: 2000, placeholder: 'Feature description', multiline: true },
  { key: 'type', label: 'Type', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. benefit', translatable: false },
  additionsField,
  translationsField,
];

// NOTE: If adding multiple additional descriptions, they are not mapped to
// each other — each one is independent and unordered in the API payload.
const categoryAdditionalDescFields = [
  { key: 'content', label: 'Content', type: T.TEXT, required: true, minLength: 1, maxLength: 2000, placeholder: 'Additional description content', multiline: true },
  { key: 'type', label: 'Type', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. tagline', translatable: false },
  translationsField,
];

// ---------- Endpoint definitions ----------

export const endpoints = [
  {
    id: 'createProduct',
    label: 'Create Product',
    method: 'POST',
    path: '/integration-api/v1/products',
    tag: 'Products',
    summary: 'Create a product',
    pathParams: [],
    queryParams: [],
    bodyFields: [
      { key: 'externalProductId', label: 'External Product ID', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. ext-id-001', translatable: false },
      { key: 'productKey', label: 'Product Key', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. mortgage-2025-05-fixed-term', translatable: false },
      { key: 'templateKey', label: 'Template Key', type: T.TEXT, required: false, maxLength: 255, placeholder: 'e.g. mortgages-fixed-term-view', translatable: false },
      { key: 'name', label: 'Product Name', type: T.TEXT, required: true, minLength: 1, maxLength: 150, placeholder: 'e.g. Fixed-Term Mortgage' },
      { key: 'availabilityStartDate', label: 'Availability Start Date', type: T.DATETIME, required: true, placeholder: '2025-06-01T00:00:00Z' },
      { key: 'availabilityEndDate', label: 'Availability End Date', type: T.DATETIME, required: false, placeholder: '2025-12-01T23:59:59Z', description: 'Leave empty if the product should remain available indefinitely.' },
      { key: 'rank', label: 'Rank', type: T.SLIDER, required: false, min: 0, max: 50, step: 1, description: 'Controls the display order of products in this category. Lower rank = closer to the top of the list.' },
      { key: 'icon', label: 'Icon', type: T.ICON, required: false, maxLength: 2000, placeholder: 'e.g. product-icon-from-design-system', description: 'Select one of the built-in icons from the library, or provide a URL for the icon you want to use.' },
      {
        key: 'categories',
        label: 'Categories',
        type: T.CATEGORY_PICKER,
        required: true,
        minItems: 1,
        description: 'Select from saved categories (create categories first via Upsert Category)',
      },
      {
        key: 'linkGroups',
        label: 'Link Groups',
        type: T.ARRAY,
        required: true,
        itemType: 'object',
        itemLabel: 'Link Group',
        itemFields: [
          { key: 'groupKey', label: 'Group Key', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. documents' },
          {
            key: 'links',
            label: 'Links',
            type: T.ARRAY,
            required: true,
            minItems: 1,
            itemType: 'object',
            itemLabel: 'Link',
            itemFields: linkFields,
          },
        ],
      },
      {
        key: 'faqs',
        label: 'FAQs',
        type: T.ARRAY,
        required: true,
        itemType: 'object',
        itemLabel: 'FAQ Section',
        itemFields: [
          { key: 'faqKey', label: 'FAQ Key', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. faq-main-section' },
          {
            key: 'faqItems',
            label: 'FAQ Items',
            type: T.ARRAY,
            required: true,
            minItems: 1,
            maxItems: 5,
            itemType: 'object',
            itemLabel: 'FAQ Item',
            itemFields: faqItemFields,
          },
        ],
      },
      {
        key: 'descriptions',
        label: 'Descriptions',
        type: T.ARRAY,
        required: true,
        itemType: 'object',
        itemLabel: 'Description',
        itemFields: descriptionFields,
      },
      {
        key: 'features',
        label: 'Features',
        type: T.ARRAY,
        required: true,
        maxItems: 3,
        itemType: 'object',
        itemLabel: 'Feature',
        itemFields: featureFields,
      },
      translationsField,
      {
        key: 'additions',
        label: 'Additions',
        type: T.KEY_VALUE,
        description: 'Additional properties (key-value pairs). Currency is required.',
        required: false,
        pinnedKeys: [
          { key: 'CCY', label: 'Currency', options: ['EUR', 'ALL', 'USD'], required: true },
          { key: '__loanOrCard', label: 'Is this a Loan or Credit Card?', type: 'yesno', required: true },
          { key: 'Max Limit', label: 'Max Limit', inputType: 'number', required: true, showWhen: '__loanOrCard', placeholder: 'e.g. 50000' },
          { key: 'Min Limit', label: 'Min Limit', inputType: 'number', required: true, showWhen: '__loanOrCard', placeholder: 'e.g. 1000' },
        ],
      },
    ],
  },
  {
    id: 'updateProduct',
    label: 'Update Product',
    method: 'PATCH',
    path: '/integration-api/v1/products/{productKey}',
    tag: 'Products',
    summary: 'Update a product',
    pathParams: [
      { key: 'productKey', label: 'Product Key', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. mortgage-2025-05-fixed-term' },
    ],
    queryParams: [],
    bodyFields: [
      { key: 'availabilityStartDate', label: 'Availability Start Date', type: T.DATETIME, required: false, placeholder: '2025-06-01T00:00:00Z' },
      { key: 'availabilityEndDate', label: 'Availability End Date', type: T.DATETIME, required: false, placeholder: '2025-12-01T23:59:59Z' },
      { key: 'rank', label: 'Rank', type: T.SLIDER, required: false, min: 0, max: 50, step: 1, description: 'Controls the display order of products in this category. Lower rank = closer to the top of the list.' },
    ],
  },
  {
    id: 'getProducts',
    label: 'Get Products',
    method: 'GET',
    path: '/integration-api/v1/products',
    tag: 'Products',
    summary: 'Get list of products',
    pathParams: [],
    queryParams: [
      { key: 'page', label: 'Page', type: T.NUMBER, required: false, default: 0, min: 0, description: 'Page number' },
      { key: 'perPage', label: 'Per Page', type: T.NUMBER, required: false, default: 20, min: 1, max: 1000, description: 'Number of items per page' },
    ],
    bodyFields: [],
  },
  {
    id: 'upsertCategory',
    label: 'Upsert Category',
    method: 'PUT',
    path: '/integration-api/v1/categories/{categoryKey}',
    tag: 'Categories',
    summary: 'Upsert a category',
    pathParams: [
      { key: 'categoryKey', label: 'Category Key', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. cards', description: 'Machine-readable identifier for the category. Use lowercase kebab-case (e.g. savings-accounts, credit-cards). Must be unique and consistent across updates.' },
    ],
    queryParams: [],
    bodyFields: [
      { key: 'externalCategoryId', label: 'External Category ID', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. ext-id-001', translatable: false, description: 'Identifier used to map this category across systems (e.g. the category ID in Flexcube corresponds to this category in the app).' },
      { key: 'name', label: 'Category Name', type: T.TEXT, required: true, minLength: 1, maxLength: 50, placeholder: 'e.g. Accounts', description: 'Displayed as-is on the app frontend.' },
      { key: 'description', label: 'Description', type: T.TEXT, required: false, minLength: 1, maxLength: 500, placeholder: 'e.g. Flexible, secure, and easy everyday banking.', description: 'Displayed as-is on the app frontend below the category name.' },
      { key: 'icon', label: 'Icon', type: T.ICON, required: false, maxLength: 2000, placeholder: 'Icon reference or URL', description: 'Select one of the built-in icons from the library, or provide a URL for the icon you want to use.' },
      {
        key: 'additionalDescriptions',
        label: 'Additional Descriptions',
        type: T.ARRAY,
        required: true,
        itemType: 'object',
        itemLabel: 'Additional Description',
        itemFields: categoryAdditionalDescFields,
        description: 'Only the first description is displayed in the app. Additional entries are stored for future use.',
      },
      translationsField,
      additionsField,
    ],
  },
  {
    id: 'deleteCategory',
    label: 'Delete Category',
    method: 'DELETE',
    path: '/integration-api/v1/categories/{categoryKey}',
    tag: 'Categories',
    summary: 'Delete a category',
    pathParams: [
      { key: 'categoryKey', label: 'Category Key', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. cards', description: 'Machine-readable identifier for the category. Use lowercase kebab-case (e.g. savings-accounts, credit-cards).' },
    ],
    queryParams: [],
    bodyFields: [],
  },
  {
    id: 'upsertHierarchy',
    label: 'Upsert Hierarchy',
    method: 'PUT',
    path: '/integration-api/v1/categories/hierarchies/{hierarchyKey}',
    tag: 'Hierarchies',
    summary: 'Upsert a hierarchy',
    pathParams: [
      { key: 'hierarchyKey', label: 'Hierarchy Key', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. retail-products' },
    ],
    queryParams: [],
    bodyFields: [
      {
        key: 'roots',
        label: 'Root Categories',
        type: T.HIERARCHY,
        required: true,
        description: 'Top-level categories in hierarchy',
      },
      additionsField,
    ],
  },
  {
    id: 'deleteHierarchy',
    label: 'Delete Hierarchy',
    method: 'DELETE',
    path: '/integration-api/v1/categories/hierarchies/{hierarchyKey}',
    tag: 'Hierarchies',
    summary: 'Delete a hierarchy',
    pathParams: [
      { key: 'hierarchyKey', label: 'Hierarchy Key', type: T.TEXT, required: true, minLength: 1, maxLength: 255, placeholder: 'e.g. retail-products' },
    ],
    queryParams: [],
    bodyFields: [],
  },
];

// Method badge colors
export const methodColors = {
  GET: { bg: '#1a3a2a', color: '#51cf66', border: '#2d5a3d' },
  POST: { bg: '#1a2a4a', color: '#6c8cff', border: '#2d3d6a' },
  PUT: { bg: '#3a2a1a', color: '#ffc078', border: '#5a3d2d' },
  PATCH: { bg: '#2a1a3a', color: '#da77f2', border: '#3d2d5a' },
  DELETE: { bg: '#3a1a1a', color: '#ff6b6b', border: '#5a2d2d' },
};
