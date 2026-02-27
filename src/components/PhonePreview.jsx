import { useState, useEffect, useCallback } from 'react';
import { getSavedCategories, getSavedProducts } from '../storage';

/**
 * Unified interactive phone preview for both Category and Product endpoints.
 *
 * Navigation stack (3 views):
 *   1. Category list   — shows all saved + currently-editing category/product's category
 *   2. Product list    — products inside a selected category
 *   3. Product detail  — features, descriptions, links, FAQ, CTA
 *
 * Props:
 *   mode        — 'category' | 'product'
 *   currentCategory — { categoryKey, name, description, icon } when mode='category'
 *   currentProduct  — { productKey, name, icon, categories, descriptions, features, faqs, linkGroups } when mode='product'
 */
export default function PhonePreview({ mode, currentCategory, currentProduct }) {
  // Navigation state: 'categories' | 'products' | 'detail'
  const [view, setView] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  // Stable identity keys for reset detection
  const catKey = currentCategory?.categoryKey?.trim() || '';
  const prodKey = currentProduct?.productKey?.trim() || '';

  // Reset the navigation whenever the entity being edited changes
  useEffect(() => {
    setView('categories');
    setSelectedCategory(null);
    setSelectedProduct(null);
    setOpenFaqIdx(null);
  }, [catKey, prodKey]);

  // When in product mode and a category is selected, auto-navigate to products view
  // (so the user immediately sees their product card inside its category)
  const prodCategories = currentProduct?.categories || [];
  const primaryCatKey = prodCategories.find((c) => typeof c === 'string' && c.trim()) || null;

  useEffect(() => {
    if (mode !== 'product' || !primaryCatKey) return;
    const cats = getSavedCategories();
    const cat = cats.find((c) => c.categoryKey === primaryCatKey);
    if (cat) {
      setSelectedCategory({ key: cat.categoryKey, name: cat.name, description: cat.description || '', icon: cat.icon || '' });
      setView('products');
    }
  }, [mode, primaryCatKey]);

  // ── Data assembly ──
  const savedCategories = getSavedCategories();
  const savedProducts = getSavedProducts();

  // Build unique category list
  const categoryMap = new Map();
  for (const cat of savedCategories) {
    if (cat.categoryKey) {
      categoryMap.set(cat.categoryKey, {
        key: cat.categoryKey,
        name: cat.name,
        description: cat.description || '',
        icon: cat.icon || '',
      });
    }
  }

  // Merge / add currently-editing category (only in category mode)
  if (mode === 'category') {
    const curName = currentCategory?.name?.trim() || '';
    const curDesc = currentCategory?.description?.trim() || '';
    const curIcon = currentCategory?.icon?.trim() || '';

    if (curName && catKey) {
      categoryMap.set(catKey, { key: catKey, name: curName, description: curDesc, icon: curIcon, isCurrent: true });
    } else if (curName) {
      categoryMap.set('__current__', { key: '__current__', name: curName, description: curDesc, icon: curIcon, isCurrent: true });
    }
  }

  const allCategories = Array.from(categoryMap.values());

  // Products for the selected category
  const buildProductList = useCallback(() => {
    const selKey = selectedCategory?.key || '';
    if (!selKey || selKey === '__current__') return [];

    let products = savedProducts.filter(
      (p) => Array.isArray(p.categories) && p.categories.includes(selKey)
    );

    // Merge current product (product mode only)
    if (mode === 'product' && currentProduct?.name?.trim()) {
      const cp = {
        productKey: prodKey || '__current_prod__',
        name: currentProduct.name.trim(),
        icon: currentProduct.icon?.trim() || '',
        categories: currentProduct.categories || [],
        descriptions: currentProduct.descriptions || [],
        features: currentProduct.features || [],
        faqs: currentProduct.faqs || [],
        linkGroups: currentProduct.linkGroups || [],
        isCurrent: true,
      };

      // Only include if this product belongs to the selected category
      if (Array.isArray(cp.categories) && cp.categories.includes(selKey)) {
        const idx = prodKey ? products.findIndex((p) => p.productKey === prodKey) : -1;
        if (idx >= 0) {
          products = [...products];
          products[idx] = cp;
        } else {
          products = [...products, cp];
        }
      }
    }

    return products;
  }, [selectedCategory, savedProducts, mode, currentProduct, prodKey]);

  const categoryProducts = view !== 'categories' ? buildProductList() : [];

  // ── Helpers ──
  const tealShade = (str) => {
    let h = 0;
    for (let i = 0; i < (str || '').length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return `hsl(${160 + (Math.abs(h) % 30)}, 45%, 88%)`;
  };

  const iconInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const renderIcon = (item) => {
    if (item.icon) {
      if (item.icon.startsWith('http')) return <img src={item.icon} alt="" className="ph-card-icon-img" />;
      return <span className="ph-card-icon-ref">{item.icon}</span>;
    }
    return <span className="ph-card-icon-letter">{iconInitial(item.name)}</span>;
  };

  const goBack = () => {
    if (view === 'detail') {
      setSelectedProduct(null);
      setOpenFaqIdx(null);
      setView('products');
    } else if (view === 'products') {
      setSelectedCategory(null);
      setView('categories');
    }
  };

  const openCategory = (cat) => {
    setSelectedCategory(cat);
    setSelectedProduct(null);
    setOpenFaqIdx(null);
    setView('products');
  };

  const openProduct = (prod) => {
    setSelectedProduct(prod);
    setOpenFaqIdx(null);
    setView('detail');
  };

  // ── Render ──
  return (
    <div className="category-preview">
      <div className="phone-frame">
        <PhoneStatusBar />

        {view === 'categories' && (
          <CategoryListView
            categories={allCategories}
            onSelect={openCategory}
            renderIcon={renderIcon}
            tealShade={tealShade}
          />
        )}

        {view === 'products' && (
          <ProductListView
            category={selectedCategory}
            products={categoryProducts}
            onBack={goBack}
            onSelectProduct={openProduct}
            renderIcon={renderIcon}
            tealShade={tealShade}
          />
        )}

        {view === 'detail' && (
          <ProductDetailView
            product={selectedProduct}
            categoryName={selectedCategory?.name || 'Category'}
            openFaqIdx={openFaqIdx}
            setOpenFaqIdx={setOpenFaqIdx}
            onBack={goBack}
            renderIcon={renderIcon}
            tealShade={tealShade}
          />
        )}

        {view === 'categories' && (
          <>
            <div className="ph-bottom-bar"></div>
            <div className="ph-home-indicator"></div>
          </>
        )}
        {view === 'products' && <div className="ph-home-indicator"></div>}
        {view === 'detail' && <div className="ph-home-indicator"></div>}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════
// VIEW 1 — Category List
// ═══════════════════════════════════════
function CategoryListView({ categories, onSelect, renderIcon, tealShade }) {
  return (
    <>
      <div className="ph-navbar">
        <BackArrow />
        <span className="ph-nav-title">Products</span>
      </div>

      <div className="ph-page-title">Add a new product</div>
      <div className="ph-separator-teal"></div>

      <div className="ph-list">
        {categories.length === 0 && (
          <div className="ph-empty">
            No categories yet. Create and save a category to see it here.
          </div>
        )}
        {categories.map((cat, idx) => (
          <div
            key={cat.key || idx}
            className={`ph-card${cat.isCurrent ? ' ph-card-editing' : ''}`}
            onClick={() => onSelect(cat)}
            style={{ cursor: 'pointer' }}
          >
            <div className="ph-card-icon" style={{ background: tealShade(cat.name) }}>
              {renderIcon(cat)}
            </div>
            <div className="ph-card-text">
              <span className="ph-card-name">{cat.name}</span>
              {cat.description && <span className="ph-card-desc">{cat.description}</span>}
            </div>
            <Chevron />
          </div>
        ))}
      </div>
    </>
  );
}


// ═══════════════════════════════════════
// VIEW 2 — Product List
// ═══════════════════════════════════════
function ProductListView({ category, products, onBack, onSelectProduct, renderIcon, tealShade }) {
  return (
    <>
      <div className="ph-navbar">
        <BackArrow clickable onClick={onBack} />
        <span className="ph-nav-title">Open {category?.name?.toLowerCase() || 'category'}</span>
      </div>

      <div className="ph-page-title ph-page-title-sm">
        Select the product you are interested in
      </div>

      <div className="ph-section-header">
        <span className="ph-section-title">{category?.name || 'Category'}</span>
        <span className="ph-section-subtitle">Choose between these products</span>
      </div>

      <div className="ph-list ph-product-list">
        {products.length === 0 && (
          <div className="ph-empty-products">
            <p>No products in this category yet.</p>
            <p className="ph-empty-hint">Create a product and assign it to this category to see it here.</p>
          </div>
        )}
        {products.map((product, idx) => (
          <div
            key={product.productKey || idx}
            className={`ph-product-card${product.isCurrent ? ' ph-card-editing' : ''}`}
          >
            <div className="ph-product-top">
              <div className="ph-card-icon ph-card-icon-sm" style={{ background: tealShade(product.name) }}>
                {renderIcon(product)}
              </div>
              <span className="ph-product-name">{product.name}</span>
            </div>
            {product.descriptions?.[0]?.content && (
              <p className="ph-product-desc">{product.descriptions[0].content}</p>
            )}
            <span
              className="ph-product-more"
              onClick={() => onSelectProduct(product)}
              style={{ cursor: 'pointer' }}
            >
              More information
            </span>
            <div className="ph-product-btn">Choose this product</div>
          </div>
        ))}
      </div>
    </>
  );
}


// ═══════════════════════════════════════
// VIEW 3 — Product Detail
// ═══════════════════════════════════════
function ProductDetailView({ product, categoryName, openFaqIdx, setOpenFaqIdx, onBack, renderIcon, tealShade }) {
  if (!product) return null;

  const mainDesc = product.descriptions?.find((d) => d.type !== 'pricing_section_header');
  const subDesc = product.descriptions?.find((d) => d.type === 'pricing_section_header');
  const allFaqItems = (product.faqs || []).flatMap((faq) => faq.faqItems || []);
  const allLinks = (product.linkGroups || []).flatMap((lg) => lg.links || []);
  const features = product.features || [];

  return (
    <>
      <div className="ph-navbar">
        <BackArrow clickable onClick={onBack} />
        <span className="ph-nav-title">Open {categoryName.toLowerCase()}</span>
      </div>

      <div className="ph-list ph-detail-scroll">
        {/* Product header */}
        <div className="ph-detail-header">
          <div className="ph-card-icon ph-card-icon-detail" style={{ background: tealShade(product.name) }}>
            {renderIcon(product)}
          </div>
          <div className="ph-detail-header-text">
            <span className="ph-detail-name">{product.name}</span>
            {subDesc && <span className="ph-detail-subtitle">{subDesc.content}</span>}
          </div>
        </div>

        {/* Main description */}
        {mainDesc && <p className="ph-detail-desc">{mainDesc.content}</p>}

        {/* Features */}
        {features.length > 0 && (
          <div className="ph-detail-features">
            {features.map((f, i) => (
              <div key={i} className="ph-feature-row">
                <svg className="ph-feature-check" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12.5l4.5 4.5L20 6" stroke="#009688" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12.5l4.5 4.5L20 6" stroke="#009688" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(1.5, 1.5)" opacity=".3"/>
                </svg>
                <span className="ph-feature-text">{f.description || f.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Links */}
        {allLinks.length > 0 && (
          <div className="ph-detail-links">
            <div className="ph-detail-divider"></div>
            {allLinks.map((link, i) => (
              <div key={i} className="ph-link-row">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 1h6a4 4 0 010 8H5" stroke="#111" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 4l-2 4 2 4" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="ph-link-text">{link.name}</span>
              </div>
            ))}
            <div className="ph-detail-divider"></div>
          </div>
        )}

        {/* FAQ */}
        {allFaqItems.length > 0 && (
          <div className="ph-detail-faq">
            <h3 className="ph-faq-title">FAQ</h3>
            {allFaqItems.map((item, i) => (
              <div key={i} className="ph-faq-item">
                <div className="ph-faq-question" onClick={() => setOpenFaqIdx(openFaqIdx === i ? null : i)}>
                  <span>{item.question}</span>
                  <svg
                    className={`ph-faq-chevron${openFaqIdx === i ? ' ph-faq-open' : ''}`}
                    width="14" height="8" viewBox="0 0 14 8" fill="none"
                  >
                    <path d="M1 1l6 6 6-6" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {openFaqIdx === i && <p className="ph-faq-answer">{item.answer}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="ph-detail-cta">
        <div className="ph-product-btn">Choose this product</div>
      </div>
    </>
  );
}


// ═══════════════════════════════════════
// Shared small components
// ═══════════════════════════════════════

function BackArrow({ clickable, onClick }) {
  return (
    <svg
      className={`ph-back-arrow${clickable ? ' ph-back-clickable' : ''}`}
      width="12" height="20" viewBox="0 0 12 20" fill="none"
      onClick={clickable ? onClick : undefined}
    >
      <path d="M10.5 1.5L2 10l8.5 8.5" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Chevron() {
  return (
    <svg className="ph-card-chevron" width="9" height="16" viewBox="0 0 9 16" fill="none">
      <path d="M1 1l6.5 7L1 15" stroke="#009688" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PhoneStatusBar() {
  return (
    <div className="ph-statusbar">
      <span className="ph-time">9:41</span>
      <span className="ph-island"></span>
      <span className="ph-indicators">
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0" y="8" width="3" height="4" rx="0.8" fill="#111"/>
          <rect x="4.5" y="5" width="3" height="7" rx="0.8" fill="#111"/>
          <rect x="9" y="2" width="3" height="10" rx="0.8" fill="#111"/>
          <rect x="13.5" y="0" width="3" height="12" rx="0.8" fill="#111" opacity=".25"/>
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 10.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5z" fill="#111"/>
          <path d="M4.5 8.5C5.4 7.4 6.6 6.8 8 6.8s2.6.6 3.5 1.7" stroke="#111" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          <path d="M2 5.8c1.6-1.7 3.6-2.6 6-2.6s4.4.9 6 2.6" stroke="#111" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        </svg>
        <svg width="28" height="13" viewBox="0 0 28 13" fill="none">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3" stroke="#111" strokeWidth="1" fill="none"/>
          <rect x="24.5" y="3.5" width="2.5" height="5" rx="1" fill="#111" opacity=".35"/>
          <rect x="2" y="2" width="16" height="9" rx="1.5" fill="#111"/>
          <text x="21" y="9.5" fontSize="7" fill="#111" fontWeight="600" fontFamily="-apple-system,sans-serif">80</text>
        </svg>
      </span>
    </div>
  );
}
