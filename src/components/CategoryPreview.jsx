import { useState, useEffect } from 'react';
import { getSavedCategories, getSavedProducts } from '../storage';

/**
 * Interactive phone-style preview with 3 views:
 * 1. Category list
 * 2. Product list (click category)
 * 3. Product detail (click "More information")
 */
export default function CategoryPreview({ currentCategory }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  // Reset drill-down whenever the current category being edited changes
  const currentKey = currentCategory?.categoryKey?.trim() || '';
  const currentName = currentCategory?.name?.trim() || '';
  useEffect(() => {
    setSelectedCategory(null);
    setSelectedProduct(null);
    setOpenFaqIdx(null);
  }, [currentKey]);

  const saved = getSavedCategories();
  const savedProducts = getSavedProducts();

  const currentDesc = currentCategory?.description?.trim() || '';
  const currentIcon = currentCategory?.icon?.trim() || '';

  // Build unique category list using categoryKey as the unique identifier
  const categoryMap = new Map();
  for (const cat of saved) {
    const k = cat.categoryKey;
    if (k) categoryMap.set(k, { key: k, name: cat.name, description: cat.description || '', icon: cat.icon || '' });
  }

  // Merge or add the currently-editing category
  if (currentName && currentKey) {
    categoryMap.set(currentKey, {
      key: currentKey,
      name: currentName,
      description: currentDesc,
      icon: currentIcon,
      isCurrent: true,
    });
  } else if (currentName && !currentKey) {
    // No key yet — show as a temporary entry
    categoryMap.set('__current__', {
      key: '__current__',
      name: currentName,
      description: currentDesc,
      icon: currentIcon,
      isCurrent: true,
    });
  }

  const previewItems = Array.from(categoryMap.values());

  // Only filter products when we have a real category key (not empty, not __current__)
  const selectedKey = selectedCategory?.key || '';
  const categoryProducts = (selectedKey && selectedKey !== '__current__')
    ? savedProducts.filter((p) =>
        Array.isArray(p.categories) && p.categories.includes(selectedKey)
      )
    : [];

  const tealShade = (str) => {
    let h = 0;
    for (let i = 0; i < (str || '').length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    const hue = 160 + (Math.abs(h) % 30);
    return `hsl(${hue}, 45%, 88%)`;
  };

  const iconInitial = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const renderIcon = (item, small) => {
    const cls = small ? 'ph-card-icon-img' : 'ph-card-icon-img';
    if (item.icon) {
      if (item.icon.startsWith('http')) {
        return <img src={item.icon} alt="" className={cls} />;
      }
      return <span className="ph-card-icon-ref">{item.icon}</span>;
    }
    return <span className="ph-card-icon-letter">{iconInitial(item.name)}</span>;
  };

  // ── VIEW 3: Product detail ──
  if (selectedProduct) {
    const p = selectedProduct;
    const mainDesc = p.descriptions.find((d) => d.type !== 'pricing_section_header');
    const subDesc = p.descriptions.find((d) => d.type === 'pricing_section_header');
    const allFaqItems = p.faqs.flatMap((faq) => faq.faqItems || []);
    const allLinks = p.linkGroups.flatMap((lg) => lg.links || []);

    return (
      <div className="category-preview">
        <div className="phone-frame">
          <PhoneStatusBar />
          <div className="ph-navbar">
            <svg
              className="ph-back-arrow ph-back-clickable"
              width="12" height="20" viewBox="0 0 12 20" fill="none"
              onClick={() => { setSelectedProduct(null); setOpenFaqIdx(null); }}
            >
              <path d="M10.5 1.5L2 10l8.5 8.5" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ph-nav-title">Open {selectedCategory?.name?.toLowerCase() || 'product'}</span>
          </div>

          <div className="ph-list ph-detail-scroll">
            {/* Product header */}
            <div className="ph-detail-header">
              <div className="ph-card-icon ph-card-icon-detail" style={{ background: tealShade(p.name) }}>
                {renderIcon(p)}
              </div>
              <div className="ph-detail-header-text">
                <span className="ph-detail-name">{p.name}</span>
                {subDesc && <span className="ph-detail-subtitle">{subDesc.content}</span>}
              </div>
            </div>

            {/* Main description */}
            {mainDesc && (
              <p className="ph-detail-desc">{mainDesc.content}</p>
            )}

            {/* Features with checkmarks */}
            {p.features.length > 0 && (
              <div className="ph-detail-features">
                {p.features.map((f, i) => (
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

            {/* Link groups */}
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

            {/* FAQ section */}
            {allFaqItems.length > 0 && (
              <div className="ph-detail-faq">
                <h3 className="ph-faq-title">FAQ</h3>
                {allFaqItems.map((item, i) => (
                  <div key={i} className="ph-faq-item">
                    <div
                      className="ph-faq-question"
                      onClick={() => setOpenFaqIdx(openFaqIdx === i ? null : i)}
                    >
                      <span>{item.question}</span>
                      <svg
                        className={`ph-faq-chevron${openFaqIdx === i ? ' ph-faq-open' : ''}`}
                        width="14" height="8" viewBox="0 0 14 8" fill="none"
                      >
                        <path d="M1 1l6 6 6-6" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {openFaqIdx === i && (
                      <p className="ph-faq-answer">{item.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky bottom CTA */}
          <div className="ph-detail-cta">
            <div className="ph-product-btn">Choose this product</div>
          </div>
          <div className="ph-home-indicator"></div>
        </div>
      </div>
    );
  }

  // ── VIEW 2: Product list ──
  if (selectedCategory) {
    return (
      <div className="category-preview">
        <div className="phone-frame">
          <PhoneStatusBar />

          <div className="ph-navbar">
            <svg
              className="ph-back-arrow ph-back-clickable"
              width="12" height="20" viewBox="0 0 12 20" fill="none"
              onClick={() => setSelectedCategory(null)}
            >
              <path d="M10.5 1.5L2 10l8.5 8.5" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ph-nav-title">Open {selectedCategory.name.toLowerCase()}</span>
          </div>

          <div className="ph-page-title ph-page-title-sm">
            Select the currency in which you want to grow your savings
          </div>

          <div className="ph-section-header">
            <span className="ph-section-title">{selectedCategory.name}</span>
            <span className="ph-section-subtitle">Choose between these accounts</span>
          </div>

          <div className="ph-list ph-product-list">
            {categoryProducts.length === 0 && (
              <div className="ph-empty-products">
                <p>No saved products in this category yet.</p>
                <p className="ph-empty-hint">Create a product and assign it to "{selectedCategory.name}" to see it here.</p>
              </div>
            )}
            {categoryProducts.map((product, idx) => (
              <div key={product.productKey || idx} className="ph-product-card">
                <div className="ph-product-top">
                  <div className="ph-card-icon ph-card-icon-sm" style={{ background: tealShade(product.name) }}>
                    {renderIcon(product)}
                  </div>
                  <span className="ph-product-name">{product.name}</span>
                </div>
                {product.descriptions[0]?.content && (
                  <p className="ph-product-desc">{product.descriptions[0].content}</p>
                )}
                <span
                  className="ph-product-more"
                  onClick={() => setSelectedProduct(product)}
                  style={{ cursor: 'pointer' }}
                >
                  More information
                </span>
                <div className="ph-product-btn">Choose this product</div>
              </div>
            ))}
          </div>

          <div className="ph-home-indicator"></div>
        </div>
      </div>
    );
  }

  // ── VIEW 1: Category list ──
  return (
    <div className="category-preview">
      <div className="phone-frame">
        <PhoneStatusBar />

        <div className="ph-navbar">
          <svg className="ph-back-arrow" width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10.5 1.5L2 10l8.5 8.5" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="ph-nav-title">Products</span>
        </div>

        <div className="ph-page-title">Add a new product</div>
        <div className="ph-separator-teal"></div>

        <div className="ph-list">
          {previewItems.map((item, idx) => (
            <div
              key={item.key || idx}
              className={`ph-card${item.isCurrent ? ' ph-card-editing' : ''}`}
              onClick={() => setSelectedCategory(item)}
              style={{ cursor: 'pointer' }}
            >
              <div className="ph-card-icon" style={{ background: tealShade(item.name) }}>
                {renderIcon(item)}
              </div>
              <div className="ph-card-text">
                <span className="ph-card-name">{item.name}</span>
                {item.description && <span className="ph-card-desc">{item.description}</span>}
              </div>
              <svg className="ph-card-chevron" width="9" height="16" viewBox="0 0 9 16" fill="none">
                <path d="M1 1l6.5 7L1 15" stroke="#009688" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ))}
        </div>

        <div className="ph-bottom-bar"></div>
        <div className="ph-home-indicator"></div>
      </div>
    </div>
  );
}

/** Reusable phone status bar */
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
