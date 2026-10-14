import { useEffect, useRef, useState } from 'react';
import { PRODUCT_TYPES, RESOURCE_STATUSES } from '../../../../shared/resourceContract.mjs';
import { Button, FormField, Input, Select } from '../../components/ui';
import AdminIcon from '../../components/ui/AdminIcon';
import './product-filters.css';

export default function ProductFilters({ state, controller }) {
  const { filters, applied, pending } = state;
  const priceRef = useRef(null);
  const minimumRef = useRef(null);
  const maximumRef = useRef(null);
  const [priceError, setPriceError] = useState(null);
  const hasValue = (value) => value !== '' && value != null;
  const priceActive = hasValue(applied.minPrice) || hasValue(applied.maxPrice);
  const changed = Object.keys(filters).some((key) => filters[key] !== applied[key]);
  const hasFilters = Object.values(filters).some(hasValue) || Object.values(applied).some(hasValue);
  useEffect(() => {
    const closeOutside = (event) => {
      if (priceRef.current?.open && !priceRef.current.contains(event.target))
        priceRef.current.open = false;
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  const changePrice = (key, value) => {
    setPriceError(null);
    controller.setFilters({ [key]: value });
  };
  const apply = (event) => {
    event.preventDefault();
    if (pending) return;
    const invalidKey = ['minPrice', 'maxPrice'].find(
      (key) =>
        hasValue(filters[key]) &&
        (!Number.isFinite(Number(filters[key])) || Number(filters[key]) < 0),
    );
    const reversed =
      hasValue(filters.minPrice) &&
      hasValue(filters.maxPrice) &&
      Number(filters.minPrice) > Number(filters.maxPrice);
    if (invalidKey || reversed) {
      setPriceError({
        key: invalidKey || 'maxPrice',
        message: invalidKey
          ? 'Giá phải là số lớn hơn hoặc bằng 0.'
          : 'Giá từ không được lớn hơn giá đến.',
      });
      priceRef.current.open = true;
      (invalidKey === 'maxPrice' || reversed ? maximumRef : minimumRef).current?.focus();
      return;
    }
    controller.applyFilters();
    priceRef.current.open = false;
  };

  return (
    <form
      className="product-filters"
      aria-label="Bộ lọc sản phẩm"
      aria-busy={pending || undefined}
      noValidate
      onSubmit={apply}
    >
      <div className="product-filters__toolbar">
        <label className="product-filters__search">
          <span className="ui-visually-hidden">Tìm sản phẩm</span>
          <AdminIcon name="search" />
          <Input
            type="search"
            placeholder="Tìm tên hoặc mô tả sản phẩm…"
            maxLength={100}
            value={filters.search}
            disabled={pending}
            onChange={(event) => controller.setFilters({ search: event.target.value })}
          />
        </label>
        <label className="product-filters__select">
          <span className="ui-visually-hidden">Loại sản phẩm</span>
          <Select
            value={filters.type}
            disabled={pending}
            onChange={(event) => controller.setFilters({ type: event.target.value })}
          >
            <option value="">Tất cả loại</option>
            {PRODUCT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </Select>
        </label>
        <label className="product-filters__select">
          <span className="ui-visually-hidden">Trạng thái sản phẩm</span>
          <Select
            value={filters.status}
            disabled={pending}
            onChange={(event) => controller.setFilters({ status: event.target.value })}
          >
            <option value="">Mọi trạng thái</option>
            {RESOURCE_STATUSES.products.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </label>
        <details
          className="product-filters__price"
          ref={priceRef}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              priceRef.current.open = false;
              priceRef.current.querySelector('summary').focus();
            }
          }}
        >
          <summary
            aria-disabled={pending || undefined}
            onClick={(event) => {
              if (pending) event.preventDefault();
            }}
          >
            <AdminIcon name="dollar-line" />
            <span>Khoảng giá</span>
            {priceActive && (
              <span className="product-filters__dot" aria-label="Đang lọc theo giá" />
            )}
            <AdminIcon name="chevron-down" />
          </summary>
          <div className="product-filters__price-panel">
            <div className="product-filters__price-heading">
              <strong>Khoảng giá bán</strong>
              <span>Đơn vị: đồng</span>
            </div>
            <div className="product-filters__price-fields">
              <FormField
                label="Giá từ"
                error={priceError?.key === 'minPrice' ? priceError.message : undefined}
              >
                <Input
                  ref={minimumRef}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Không giới hạn"
                  value={filters.minPrice}
                  disabled={pending}
                  onChange={(event) => changePrice('minPrice', event.target.value)}
                />
              </FormField>
              <FormField
                label="Giá đến"
                error={priceError?.key === 'maxPrice' ? priceError.message : undefined}
              >
                <Input
                  ref={maximumRef}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Không giới hạn"
                  value={filters.maxPrice}
                  disabled={pending}
                  onChange={(event) => changePrice('maxPrice', event.target.value)}
                />
              </FormField>
            </div>
            <div className="product-filters__price-actions">
              <Button
                variant="quiet"
                disabled={pending}
                onClick={() => {
                  setPriceError(null);
                  controller.setFilters({ minPrice: '', maxPrice: '' });
                }}
              >
                Bỏ giới hạn
              </Button>
              <Button onClick={apply} disabled={pending}>
                Áp dụng khoảng giá
              </Button>
            </div>
          </div>
        </details>
        <div className="product-filters__actions">
          <Button type="submit" disabled={pending}>
            Lọc
          </Button>
          <Button
            variant="quiet"
            disabled={pending || !hasFilters}
            onClick={() => {
              setPriceError(null);
              controller.resetFilters();
              priceRef.current.open = false;
            }}
          >
            <AdminIcon name="regenerate" />
            Xóa lọc
          </Button>
        </div>
      </div>
      {changed && (
        <div className="product-filters__feedback">
          <span className="product-filters__pending" role="status">
            Nhấn Enter hoặc Lọc để áp dụng.
          </span>
        </div>
      )}
    </form>
  );
}
