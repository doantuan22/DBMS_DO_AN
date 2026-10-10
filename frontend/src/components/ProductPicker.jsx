import { MAX_PRODUCT_QUANTITY } from '../constants/bookingLimits';

const money = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductPicker({ products, quantities, onQuantityChange }) {
  return (
    <section className="booking-section" aria-labelledby="products-heading">
      <h2 id="products-heading">Đồ ăn và thức uống</h2>
      {products.length === 0 && <p className="catalog-muted">Hiện chưa có sản phẩm đang bán.</p>}
      {products.map((product) => (
        <label className="booking-product" key={product.id}>
          <span>
            {product.name} — {money(product.price)}
          </span>
          <input
            aria-label={`Số lượng ${product.name}`}
            type="number"
            min="0"
            max={MAX_PRODUCT_QUANTITY}
            step="1"
            value={quantities[product.id] ?? 0}
            onChange={(event) => onQuantityChange(product.id, event.target.value)}
          />
          {(quantities[product.id] ?? 0) >= MAX_PRODUCT_QUANTITY && (
            <span className="catalog-muted" role="status">
              Đã đạt tối đa {MAX_PRODUCT_QUANTITY} mỗi sản phẩm.
            </span>
          )}
        </label>
      ))}
    </section>
  );
}
