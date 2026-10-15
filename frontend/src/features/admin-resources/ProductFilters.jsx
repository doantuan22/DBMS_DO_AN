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
  const money = (value) =>
    new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(value));
  const activeFilters = [
    ...(applied.search.trim() ? [{ key: 'search', label: 'Tìm kiếm', value: applied.search }] : []),
    ...(applied.type ? [{ key: 'type', label: 'Loại', value: applied.type }] : []),
    ...(applied.status ? [{ key: 'status', label: 'Trạng thái', value: applied.status }] : []),
    ...(hasValue(applied.minPrice)
      ? [{ key: 'minPrice', label: 'Giá từ', value: `${money(applied.minPrice)} đ` }]
      : []),
    ...(hasValue(applied.maxPrice)
      ? [{ key: 'maxPrice', label: 'Giá đến', value: `${money(applied.maxPrice)} đ` }]
      : []),
  ];
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
        (!Number.isFinite(Number(filters[key])) ||
          Number(filters[key]) < 0 ||
          Number(filters[key]) >= 1e16 ||
          !/^\d+(?:\.\d{1,2})?$/.test(String(filters[key]))),
    );
    const reversed =
      hasValue(filters.minPrice) &&
      hasValue(filters.maxPrice) &&
      Number(filters.minPrice) > Number(filters.maxPrice);
    if (invalidKey || reversed) {
      setPriceError({
        key: invalidKey || 'maxPrice',
        message: invalidKey
          ? 'Giá phải không âm, tối đa 2 chữ số thập phân và nằm trong giới hạn cho phép.'
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
            aria-label={priceActive ? 'Khoảng giá, đang áp dụng' : 'Khoảng giá'}
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
            <p className="product-filters__price-hint">
              Chỉnh khoảng giá tại đây, sau đó chọn “Lọc” để cập nhật danh sách.
            </p>
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
                type="button"
                variant="quiet"
                disabled={pending}
                onClick={() => {
                  setPriceError(null);
                  controller.setFilters({ minPrice: '', maxPrice: '' });
                }}
              >
                Bỏ giới hạn
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => {
                  priceRef.current.open = false;
                  priceRef.current.querySelector('summary').focus();
                }}
              >
                Xong
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
      {(activeFilters.length > 0 || changed) && (
        <div className="product-filters__feedback">
          {activeFilters.length > 0 && (
            <ul className="product-filters__chips" aria-label="Bộ lọc đang áp dụng">
              {activeFilters.map((filter) => (
                <li key={filter.key}>
                  <button
                    className="product-filters__chip"
                    type="button"
                    disabled={pending}
                    aria-label={`Xóa bộ lọc ${filter.label}`}
                    onClick={() => controller.removeFilter(filter.key)}
                  >
                    <span>{filter.label}:</span> {filter.value}
                    <span aria-hidden="true"> ×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {changed && (
            <span className="product-filters__pending" role="status">
              Thay đổi chưa áp dụng. Chọn “Lọc” để cập nhật danh sách.
            </span>
          )}
        </div>
      )}
    </form>
  );
}
