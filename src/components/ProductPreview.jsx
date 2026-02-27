import { useState, useEffect } from 'react';
import { getSavedCategories, getSavedProducts } from '../storage';

/**
 * Interactive phone-style preview for product creation.
 * 2 views:
 *   1. Product card in its category list
 *   2. Product detail page (features, links, FAQ, CTA)
 */
export default function ProductPreview({ currentProduct }) {
  const [showDetail, setShowDetail] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  const savedCategories = getSavedCategories();
  const savedProducts = getSavedProducts();

  const prodName = currentProduct?.name?.trim() || '';
  const prodIcon = currentProduct?.icon?.trim() || '';
  const prodKey = currentProduct?.productKey?.trim() || '';
  const prodCategories = currentProduct?.categories || [];
  const descriptions = currentProduct?.descriptions || [];
  const features = currentProduct?.features || [];
  const faqs = currentProduct?.faqs || [];
  const linkGroups = currentProduct?.linkGroups || [];

  // Reset detail view when the product being edited changes
  useEffect(() => {
    setShowDetail(false);
    setOpenFaqIdx(null);
  }, [prodKey]);

  // Find the first category this product belongs to (must be a real key)
  const primaryCatKey = prodCategories.find((ck) => typeof ck === 'string' && ck.trim()) || null;
  const primaryCat = primaryCatKey
    ? savedCategories.find((c) => c.categoryKey === primaryCatKey || c.key === primaryCatKey)
    : null;
  const categoryName = primaryCat?.name || primaryCatKey || 'Category';

  // Build products list — only products that strictly belong to the same primary category
  let categoryProducts = primaryCatKey
    ? savedProducts.filter((p) =>
        Array.isArray(p.categories) && p.categories.includes(primaryCatKey)
      )
    : [];

  // Merge or add current product into the list (deduplicate by productKey)
  if (prodName) {
    const idx = prodKey ? categoryProducts.findIndex((p) => p.productKey === prodKey) : -1;
    const current = {
      productKey: prodKey || '__current__',
      name: prodName,
      icon: prodIcon,
      categories: prodCategories,
      descriptions,
      features,
      faqs,
      linkGroups,
      isCurrent: true,
    };
    if (idx >= 0) {
      categoryProducts = [...categoryProducts];
      categoryProducts[idx] = current;
    } else {
      categoryProducts = [...categoryProducts, current];
    }
  }

  // Current product object for detail view
  const currentForDetail = {
    name: prodName || 'Product',
    icon: prodIcon || '',
    descriptions,
    features,
    faqs,
    linkGroups,
  };

  const tealShade = (str) => {
    let h = 0;
    for (let i = 0; i < (str || '').length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    const hue = 160 + (Math.abs(h) % 30);
    return `hsl(${hue}, 45%, 88%)`;
  };

  const iconInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const renderIcon = (item) => {
    if (item.icon) {
      if (item.icon.startsWith('http')) {
        return <img src={item.icon} alt="" className="ph-card-icon-img" />;
      }
      return <span className="ph-card-icon-ref">{item.icon}</span>;
    }
    return <span className="ph-card-icon-letter">{iconInitial(item.name)}</span>;
  };

  // ── VIEW 2: Product detail ──
  if (showDetail) {
    const p = currentForDetail;
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
              onClick={() => { setShowDetail(false); setOpenFaqIdx(null); }}
            >
              <path d="M10.5 1.5L2 10l8.5 8.5" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ph-nav-title">Open {categoryName.toLowerCase()}</span>
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

  // ── VIEW 1: Product card in category ──
  return (
    <div className="category-preview">
      <div className="phone-frame">
        <PhoneStatusBar />

        <div className="ph-navbar">
          <svg className="ph-back-arrow" width="12" height="20" viewBox="0 0 12 20" fill="none">
            <path d="M10.5 1.5L2 10l8.5 8.5" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="ph-nav-title">Open {categoryName.toLowerCase()}</span>
        </div>

        <div className="ph-page-title ph-page-title-sm">
          Select the product you are interested in
        </div>

        <div className="ph-section-header">
          <span className="ph-section-title">{categoryName}</span>
          <span className="ph-section-subtitle">Choose between these products</span>
        </div>

        <div className="ph-list ph-product-list">
          {categoryProducts.length === 0 && (
            <div className="ph-empty-products">
              <p>Fill in the product details to see a preview.</p>
              <p className="ph-empty-hint">The product will appear here as you type.</p>
            </div>
          )}
          {categoryProducts.map((product, idx) => (
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
                onClick={() => {
                  if (product.isCurrent) setShowDetail(true);
                }}
                style={{ cursor: product.isCurrent ? 'pointer' : 'default' }}
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
