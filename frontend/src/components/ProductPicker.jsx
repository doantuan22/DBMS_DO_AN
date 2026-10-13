import { MAX_PRODUCT_QUANTITY } from '../constants/bookingLimits';
import MediaFrame from '../features/customer/MediaFrame';

const money = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductPicker({
  products,
  quantities,
  onQuantityChange,
  disabled = false,
}) {
  return (
    <section className="booking-section" aria-labelledby="products-heading">
      <h2 id="products-heading">Đồ ăn và thức uống</h2>
      {products.length === 0 && <p className="catalog-muted">Hiện chưa có sản phẩm đang bán.</p>}
      <div className="cp-product-list">
        {products.map((product) => (
          <div className="booking-product" key={product.id}>
            {product.imageUrl ? (
              <MediaFrame
                src={product.imageUrl}
                title={product.name}
                alt={`Ảnh ${product.name}`}
                kind="product"
              />
            ) : (
              <span className="cp-product-no-image" aria-hidden="true">
                —
              </span>
            )}
            <div className="cp-product-copy">
              <strong>{product.name}</strong>
              <span>{money(product.price)}</span>
            </div>
            <div className="cp-quantity-stepper">
              <button
                type="button"
                aria-label={`Giảm số lượng ${product.name}`}
                disabled={disabled || !(quantities[product.id] > 0)}
                onClick={() =>
                  onQuantityChange(
                    product.id,
                    String(Math.max(0, (quantities[product.id] ?? 0) - 1)),
                  )
                }
              >
                −
              </button>
              <input
                aria-label={`Số lượng ${product.name}`}
                type="number"
                min="0"
                max={MAX_PRODUCT_QUANTITY}
                step="1"
                disabled={disabled}
                value={quantities[product.id] ?? 0}
                onChange={(event) => onQuantityChange(product.id, event.target.value)}
              />
              <button
                type="button"
                aria-label={`Tăng số lượng ${product.name}`}
                disabled={disabled || (quantities[product.id] ?? 0) >= MAX_PRODUCT_QUANTITY}
                onClick={() =>
                  onQuantityChange(
                    product.id,
                    String(Math.min(MAX_PRODUCT_QUANTITY, Number(quantities[product.id] ?? 0) + 1)),
                  )
                }
              >
                +
              </button>
            </div>
            {(quantities[product.id] ?? 0) >= MAX_PRODUCT_QUANTITY && (
              <span className="catalog-muted" role="status">
                Đã đạt tối đa {MAX_PRODUCT_QUANTITY} mỗi sản phẩm.
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
