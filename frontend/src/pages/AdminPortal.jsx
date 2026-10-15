import { useAuth } from '../context/AuthContext';
import { userCanAct, ADMIN_SECTION_PERMISSIONS } from '../utils/authorization';
import { formatApiValue } from '../utils/dateTime';
import { adminForms as forms, formFields, inputValue, toBody } from '../utils/adminForms';
import { DAY_TYPES, RESOURCE_STATUSES } from '../../../shared/resourceContract.mjs';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';
import CinemaImageManager from '../components/CinemaImageManager';
import { bookingErrorMessage } from '../utils/bookingLimits';
import { OrderReferenceDetails } from '../components/ComplaintOrderReference';
import AdminRevenue from '../components/AdminRevenue';
import {
  ManagerAssignmentSelect,
  ManagerAssignmentsContext,
} from '../components/ManagerAssignmentFields';
import { assignmentTransferMessage } from '../utils/managerAssignments';
import { useStaffShell } from '../layouts/StaffShellContext';
import PageHeader from '../components/ui/PageHeader';
import Select from '../components/ui/Select';
import AdminEscalationModule from '../features/admin/AdminEscalationModule';
import AdminComplaintAssignment from '../features/admin/AdminComplaintAssignment';

const adminDraftCache = new Map();
const adminDraftKey = (userId, section, context = '') =>
  `${userId ?? 'anonymous'}:${section}${context ? `:${context}` : ''}`;
const DEFAULT_PROCESSING_FORM = { content: '', nextStatus: 'Đang xử lý' };
const DEFAULT_REPORT_INPUT = { fromDate: '', toDate: '' };
const hasCachedAdminDraft = (draft) =>
  Boolean(
    draft.selected ||
    Object.keys(draft.values).length > 0 ||
    JSON.stringify(draft.processingForm) !== JSON.stringify(draft.initialProcessingForm) ||
    Object.values(draft.reportInput ?? {}).some(Boolean) ||
    Object.keys(draft.reportRange ?? {}).length > 0,
  );

const sections = [
  ['users', 'Tài khoản'],
  ['assignments', 'Phân công'],
  ['cinemas', 'Rạp'],
  ['cinemaImages', 'Ảnh rạp'],
  ['rooms', 'Phòng'],
  ['seats', 'Ghế'],
  ['movies', 'Phim'],
  ['genres', 'Thể loại'],
  ['actors', 'Diễn viên'],
  ['products', 'Sản phẩm'],
  ['promotions', 'Khuyến mãi'],
  ['pricing', 'Bảng giá'],
  ['showtimes', 'Suất chiếu'],
  ['complaints', 'Khiếu nại'],
  ['escalations', 'Yêu cầu CSKH'],
  ['revenue', 'Doanh thu'],
];
const loaders = {
  users: (api) => api.users(),
  assignments: async (api) => {
    const [data, users, cinemas] = await Promise.all([
      api.assignments(),
      api.users(),
      api.cinemas(),
    ]);
    return {
      ...data,
      managerChoices: users.users.filter((row) => row.MaVaiTro === 'QUAN_LY_RAP'),
      cinemaChoices: cinemas.cinemas,
    };
  },
  cinemas: (api) => api.cinemas(),
  rooms: (api) => api.rooms(),
  seats: (api, _range, seatContext) =>
    api.seats(seatContext ? { roomId: seatContext.roomId } : undefined),
  movies: (api) => api.movies(),
  genres: (api) => api.genres(),
  actors: (api) => api.actors(),
  products: (api) => api.products(),
  promotions: (api) => api.promotions(),
  pricing: (api) => api.pricing(),
  showtimes: (api) => api.showtimes(),
  complaints: (api) => api.complaints(),
  escalations: (api) => api.escalations(),
  cinemaImages: async () => ({ images: [] }),
  revenue: (api, range) => api.revenue(range),
};

// API fields, database row identifiers, and read-only status are explicit per resource.

const idColumns = { users: 'NguoiDungID', revenue: '', complaints: 'KhieuNaiID', escalations: 'id' };
const dataRows = (value, key) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value[key])) return value[key];
  const collection = Object.values(value).find(Array.isArray);
  if (collection) return collection;
  return Object.entries(value).map(([label, count]) => ({ label, value: count }));
};

function ComplaintReferenceState({ resource, onRetry }) {
  if (!resource) return null;
  if (resource.status === 'loading') return <LoadingState>Đang tải tham chiếu đơn…</LoadingState>;
  if (resource.status === 'error') return <ErrorState error={resource.error} onRetry={onRetry} />;
  if (resource.status === 'denied') return <p>Bạn chưa được cấp quyền tra cứu đơn.</p>;
  return resource.order ? (
    <OrderReferenceDetails order={resource.order} />
  ) : (
    <EmptyState>{resource.message ?? 'Không có đơn hàng liên kết.'}</EmptyState>
  );
}

export default function AdminPortal({ routeSection, seatContext }) {
  const { user } = useAuth();
  const scope = `${user?.userId}:${user?.permissions
    ?.map((item) => item.code)
    .sort()
    .join(',')}`;
  return (
    <AdminWorkspace
      key={`${scope}:${seatContext?.cinemaId ?? ''}:${seatContext?.roomId ?? ''}`}
      routeSection={routeSection}
      seatContext={seatContext}
    />
  );
}

function AdminWorkspace({ routeSection, seatContext }) {
  const seatDraftScope = seatContext ? `${seatContext.cinemaId}:${seatContext.roomId}` : '';
  const defaultValues = useMemo(
    () => (seatContext ? { roomId: seatContext.roomId } : {}),
    [seatContext],
  );
  const { user } = useAuth();
  const shell = useStaffShell();
  const allowedSections = sections.filter(([key]) =>
    userCanAct(user, 'ADMIN', ADMIN_SECTION_PERMISSIONS[key]),
  );
  const [standaloneSection, setStandaloneSection] = useState('');
  const selectedSection = routeSection ?? standaloneSection;
  const active = String(
    allowedSections.some(([key]) => key === selectedSection)
      ? selectedSection
      : (allowedSections[0]?.[0] ?? ''),
  );
  const canProcess = userCanAct(user, 'ADMIN', 'QL_KHIEUNAI', 'XULY_KHIEUNAI');
  const canReference = userCanAct(user, 'ADMIN', 'QL_KHIEUNAI', 'TRA_CUU_DON');
  const [restoredDraft] = useState(() =>
    adminDraftCache.get(
      adminDraftKey(user?.userId, active, active === 'seats' ? seatDraftScope : ''),
    ),
  );
  const [state, setState] = useState({ status: 'loading' });
  const [selected, setSelected] = useState(() => restoredDraft?.selected ?? null);
  const [values, setValues] = useState(() => restoredDraft?.values ?? defaultValues);
  const [initialValues, setInitialValues] = useState(
    () => restoredDraft?.initialValues ?? defaultValues,
  );
  const [complaint, setComplaint] = useState(() => restoredDraft?.complaint ?? null);
  const [orderReference, setOrderReference] = useState(() => restoredDraft?.orderReference ?? null);
  const [processingForm, setProcessingForm] = useState(
    () => restoredDraft?.processingForm ?? DEFAULT_PROCESSING_FORM,
  );
  const [initialProcessingForm, setInitialProcessingForm] = useState(
    () => restoredDraft?.initialProcessingForm ?? DEFAULT_PROCESSING_FORM,
  );
  const [reportInput, setReportInput] = useState(
    () => restoredDraft?.reportInput ?? DEFAULT_REPORT_INPUT,
  );
  const [reportAppliedInput, setReportAppliedInput] = useState(
    () => restoredDraft?.reportAppliedInput ?? DEFAULT_REPORT_INPUT,
  );
  const [reportRange, setReportRange] = useState(() => restoredDraft?.reportRange ?? {});
  const loadRequest = useRef(0);
  const activeSection = useRef(active);
  const draftValues = useRef({
    selected,
    values,
    initialValues,
    complaint,
    orderReference,
    processingForm,
    initialProcessingForm,
    reportInput,
    reportAppliedInput,
    reportRange,
  });
  const [notice, setNotice] = useState(null);
  const editorGeneration = useRef(0);
  const editorWritePending = useRef(false);
  const [editorBusy, setEditorBusy] = useState(false);
  const complaintRequest = useRef(0);
  const complaintSelection = useRef(restoredDraft?.selected?.id ?? null);
  const currentModule = useRef(active);
  const mounted = useRef(true);
  const complaintWritePending = useRef(false);
  const [complaintBusy, setComplaintBusy] = useState(false);
  useLayoutEffect(() => {
    draftValues.current = {
      selected,
      values,
      initialValues,
      complaint,
      orderReference,
      processingForm,
      initialProcessingForm,
      reportInput,
      reportAppliedInput,
      reportRange,
    };
  }, [
    selected,
    values,
    initialValues,
    complaint,
    orderReference,
    processingForm,
    initialProcessingForm,
    reportInput,
    reportAppliedInput,
    reportRange,
  ]);
  useLayoutEffect(() => {
    const previous = activeSection.current;
    if (previous !== active) {
      loadRequest.current++;
      complaintRequest.current++;
      editorGeneration.current++;
      complaintSelection.current = null;
      const previousDraft = draftValues.current;
      const previousKey = adminDraftKey(
        user?.userId,
        previous,
        previous === 'seats' ? seatDraftScope : '',
      );
      if (hasCachedAdminDraft(previousDraft)) {
        adminDraftCache.set(previousKey, previousDraft);
      } else {
        adminDraftCache.delete(previousKey);
      }
      const nextDraft = adminDraftCache.get(
        adminDraftKey(user?.userId, active, active === 'seats' ? seatDraftScope : ''),
      );
      setSelected(nextDraft?.selected ?? null);
      setValues(nextDraft?.values ?? defaultValues);
      setInitialValues(nextDraft?.initialValues ?? defaultValues);
      setComplaint(nextDraft?.complaint ?? null);
      setOrderReference(nextDraft?.orderReference ?? null);
      setProcessingForm(nextDraft?.processingForm ?? DEFAULT_PROCESSING_FORM);
      setInitialProcessingForm(nextDraft?.initialProcessingForm ?? DEFAULT_PROCESSING_FORM);
      setReportInput(nextDraft?.reportInput ?? DEFAULT_REPORT_INPUT);
      setReportAppliedInput(nextDraft?.reportAppliedInput ?? DEFAULT_REPORT_INPUT);
      setReportRange(nextDraft?.reportRange ?? {});
      complaintSelection.current = nextDraft?.selected?.id ?? null;
      activeSection.current = active;
    }
  }, [active, user?.userId, seatDraftScope, defaultValues]);
  useLayoutEffect(() => {
    currentModule.current = active;
  }, [active]);
  useEffect(() => {
    mounted.current = true;
    const requests = [complaintRequest, loadRequest];
    return () => {
      mounted.current = false;
      requests.forEach((request) => {
        request.current++;
      });
      const snapshot = draftValues.current;
      const key = adminDraftKey(
        user?.userId,
        activeSection.current,
        activeSection.current === 'seats' ? seatDraftScope : '',
      );
      if (hasCachedAdminDraft(snapshot)) {
        adminDraftCache.set(key, snapshot);
      } else {
        adminDraftCache.delete(key);
      }
    };
  }, [user?.userId, seatDraftScope]);
  const hasUnsavedChanges =
    JSON.stringify(values) !== JSON.stringify(initialValues) ||
    JSON.stringify(processingForm) !== JSON.stringify(initialProcessingForm) ||
    JSON.stringify(reportInput) !== JSON.stringify(reportAppliedInput);
  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [hasUnsavedChanges]);
  const load = useCallback(async () => {
    if (!active) {
      setState({ status: 'idle' });
      return;
    }
    const requestId = ++loadRequest.current;
    setState({ status: 'loading' });
    try {
      const data = await loaders[active](adminApi, reportRange, seatContext);
      if (
        active === 'seats' &&
        seatContext &&
        data.seats.some(
          (row) =>
            String(row.PhongID) !== seatContext.roomId ||
            String(row.RapID) !== seatContext.cinemaId,
        )
      )
        throw new Error('Dữ liệu ghế không khớp phòng đang chọn.');
      if (active === 'users' && userCanAct(user, 'ADMIN', 'QL_NGUOIDUNG')) {
        try {
          data.roleChoices = (await adminApi.roles()).roles;
        } catch {
          /* Authorized user-list mappings remain usable if optional role lookup fails. */
        }
      }
      if (requestId === loadRequest.current)
        setState({ status: 'success', data, resource: active });
    } catch (error) {
      if (requestId === loadRequest.current) setState({ status: 'error', error });
    }
  }, [active, reportRange, user, seatContext]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  const rows =
    state.status === 'success' && state.resource === active
      ? dataRows(state.data?.[active] ?? state.data, active)
      : [];
  const definition = forms[active];
  const accountRoles = [
    ...new Map(
      (state.resource === 'users' ? (state.data?.roleChoices ?? rows) : [])
        .filter((row) => ['QUAN_LY_RAP', 'CSKH', 'ADMIN'].includes(row.MaVaiTro))
        .map((row) => [row.VaiTroID, { id: row.VaiTroID, name: row.TenVaiTro }]),
    ).values(),
  ];
  const managerChoices = state.resource === 'assignments' ? (state.data?.managerChoices ?? []) : [];
  const cinemaChoices = state.resource === 'assignments' ? (state.data?.cinemaChoices ?? []) : [];
  const assignmentReady =
    managerChoices.some((row) => row.NguoiDungID === Number(values.userId)) &&
    cinemaChoices.some((row) => row.RapID === Number(values.cinemaId));
  const editableFields = definition ? formFields(definition, Boolean(selected)) : [];
  const onSelect = (row) => {
    editorGeneration.current++;
    setSelected(row);
    const rowValues = Object.fromEntries(
      formFields(definition, true).map(([name, , kind, column]) => [
        name,
        inputValue(row[column], kind),
      ]),
    );
    if (active === 'movies') {
      rowValues.genreIds = inputValue(row.TheLoaiIdList, 'csv');
      rowValues.castJson = row.DanhSachDienVienJson || '[]';
    }
    setValues(rowValues);
    setInitialValues(rowValues);
  };
  const clearForm = useCallback(() => {
    editorGeneration.current++;
    setSelected(null);
    setValues(defaultValues);
    setInitialValues(defaultValues);
    adminDraftCache.delete(
      adminDraftKey(user?.userId, active, active === 'seats' ? seatDraftScope : ''),
    );
  }, [active, user?.userId, seatDraftScope, defaultValues]);
  const switchSection = useCallback(
    (key) => {
      if (key !== active) loadRequest.current += 1;
      complaintRequest.current++;
      setState({ status: 'loading' });
      setStandaloneSection(key);
      setNotice(null);
    },
    [active],
  );
  const submit = async (event) => {
    event.preventDefault();
    if (editorWritePending.current || !definition) return;
    if (
      active === 'users' &&
      !selected &&
      !accountRoles.some((role) => role.id === Number(values.roleId))
    )
      return;
    if (active === 'assignments') {
      if (!assignmentReady) return;
      const transfer = assignmentTransferMessage(selected, values, managerChoices, cinemaChoices);
      if (transfer && !window.confirm(transfer)) return;
    }
    editorWritePending.current = true;
    setEditorBusy(true);
    setNotice(null);
    const requestId = loadRequest.current;
    const editor = editorGeneration.current;
    try {
      const payload = toBody(values, editableFields);
      await (selected
        ? adminApi.update(
            `${definition.path}/${selected[definition.id]}${active === 'users' ? '/status' : ''}`,
            payload,
          )
        : adminApi.create(definition.path, payload));
      if (requestId !== loadRequest.current) return;
      if (editor === editorGeneration.current) {
        setNotice({ ok: true, text: 'Đã lưu thay đổi.' });
        clearForm();
      }
      await load();
    } catch (error) {
      if (requestId === loadRequest.current)
        setNotice({ ok: false, text: bookingErrorMessage(error) ?? error.message });
    } finally {
      editorWritePending.current = false;
      if (mounted.current) setEditorBusy(false);
    }
  };
  const remove = async (row) => {
    if (
      !definition ||
      editorWritePending.current ||
      !window.confirm(
        'Xác nhận xóa mục này? Ràng buộc nghiệp vụ sẽ từ chối xóa dữ liệu đang được sử dụng.',
      )
    )
      return;
    editorWritePending.current = true;
    setEditorBusy(true);
    setNotice(null);
    const request = loadRequest.current,
      resource = active,
      target = `${definition.path}/${row[definition.id]}`;
    try {
      const response = await adminApi.remove(target);
      if (!mounted.current || request !== loadRequest.current || resource !== currentModule.current)
        return;
      setNotice({ ok: true, text: resource === 'rooms' ? response.result.Message : 'Đã xóa.' });
      await load();
    } catch (error) {
      if (mounted.current && request === loadRequest.current && resource === currentModule.current)
        setNotice({ ok: false, text: error.message });
    } finally {
      editorWritePending.current = false;
      if (mounted.current) setEditorBusy(false);
    }
  };
  const changeUserStatus = async (row) => {
    const activeStatus = 'Hoạt động';
    const lockedStatus = 'Bị khóa';
    if (editorWritePending.current || ![activeStatus, lockedStatus].includes(row.TrangThai)) return;
    const next = row.TrangThai === activeStatus ? lockedStatus : activeStatus;
    if (!window.confirm(`Xác nhận ${next === lockedStatus ? 'khóa' : 'mở khóa'} tài khoản này?`))
      return;
    editorWritePending.current = true;
    setEditorBusy(true);
    setNotice(null);
    const request = loadRequest.current,
      target = row.NguoiDungID;
    try {
      await adminApi.update(`users/${target}/status`, { status: next });
      if (!mounted.current || request !== loadRequest.current || currentModule.current !== 'users')
        return;
      setNotice({ ok: true, text: 'Đã cập nhật tài khoản.' });
      await load();
    } catch (error) {
      if (mounted.current && request === loadRequest.current && currentModule.current === 'users')
        setNotice({ ok: false, text: error.message });
    } finally {
      editorWritePending.current = false;
      if (mounted.current) setEditorBusy(false);
    }
  };
  const cancelShowtime = async (row) => {
    if (
      editorWritePending.current ||
      !window.confirm('Xác nhận hủy suất chiếu? Đơn đang giữ ghế sẽ khiến thao tác bị từ chối.')
    )
      return;
    editorWritePending.current = true;
    setEditorBusy(true);
    setNotice(null);
    const request = loadRequest.current,
      target = row.SuatChieuID;
    try {
      await adminApi.create(`showtimes/${target}/cancel`, {});
      if (
        !mounted.current ||
        request !== loadRequest.current ||
        currentModule.current !== 'showtimes'
      )
        return;
      setNotice({ ok: true, text: 'Đã hủy suất chiếu.' });
      await load();
    } catch (error) {
      if (
        mounted.current &&
        request === loadRequest.current &&
        currentModule.current === 'showtimes'
      )
        setNotice({ ok: false, text: bookingErrorMessage(error) ?? error.message });
    } finally {
      editorWritePending.current = false;
      if (mounted.current) setEditorBusy(false);
    }
  };
  const loadComplaintReference = async (id, request) => {
    if (!canReference) {
      setOrderReference({ status: 'denied' });
      return;
    }
    setOrderReference({ status: 'loading' });
    try {
      const reference = await adminApi.complaintOrderReference(id);
      if (mounted.current && request === complaintRequest.current)
        setOrderReference({ status: 'success', ...reference });
    } catch (error) {
      if (mounted.current && request === complaintRequest.current)
        setOrderReference({ status: 'error', error });
    }
  };
  const openComplaint = async (row) => {
    const request = ++complaintRequest.current;
    complaintSelection.current = row.id;
    setSelected(row);
    setComplaint({ status: 'loading' });
    setOrderReference(null);
    setNotice(null);
    setProcessingForm(DEFAULT_PROCESSING_FORM);
    setInitialProcessingForm(DEFAULT_PROCESSING_FORM);
    try {
      const detail = await adminApi.complaint(row.id);
      if (!mounted.current || request !== complaintRequest.current) return;
      setComplaint({ status: 'success', data: detail.complaint });
      const status = detail.complaint.status === 'Mới' ? 'Đang xử lý' : detail.complaint.status;
      const nextForm = {
        ...DEFAULT_PROCESSING_FORM,
        nextStatus: status || DEFAULT_PROCESSING_FORM.nextStatus,
      };
      setProcessingForm(nextForm);
      setInitialProcessingForm(nextForm);
      await loadComplaintReference(row.id, request);
    } catch (error) {
      if (mounted.current && request === complaintRequest.current)
        setComplaint({ status: 'error', error });
    }
  };
  const writeComplaint = async (event, action) => {
    event.preventDefault();
    if (
      !canProcess ||
      complaintWritePending.current ||
      complaint?.status !== 'success' ||
      complaint.data.id !== selected?.id
    )
      return;
    const target = selected,
      request = complaintRequest.current,
      payload = { ...processingForm };
    complaintWritePending.current = true;
    setComplaintBusy(true);
    setNotice(null);
    try {
      if (action === 'processing') await adminApi.addComplaintProcessing(target.id, payload);
      else await adminApi.updateComplaintStatus(target.id, { status: payload.nextStatus });
      if (!mounted.current || currentModule.current !== 'complaints') return;
      await load();
      if (request !== complaintRequest.current || complaintSelection.current !== target.id) return;
      await openComplaint(target);
      if (complaintSelection.current !== target.id || complaintRequest.current !== request + 1)
        return;
      setNotice({ ok: true, text: 'Đã cập nhật khiếu nại và ghi lịch sử.' });
    } catch (error) {
      if (mounted.current && request === complaintRequest.current)
        setNotice({ ok: false, text: error.message });
    } finally {
      complaintWritePending.current = false;
      if (mounted.current) setComplaintBusy(false);
    }
  };
  const writeCast = async (event) => {
    event.preventDefault();
    if (editorWritePending.current || !selected) return;
    editorWritePending.current = true;
    setEditorBusy(true);
    setNotice(null);
    const requestId = loadRequest.current,
      editor = editorGeneration.current,
      target = selected.PhimID;
    try {
      await adminApi.update(`movies/${target}/actors`, { cast: JSON.parse(values.castJson ?? '') });
      if (
        !mounted.current ||
        requestId !== loadRequest.current ||
        editor !== editorGeneration.current
      )
        return;
      setNotice({ ok: true, text: 'Đã cập nhật danh sách diễn viên.' });
      await load();
    } catch {
      if (
        mounted.current &&
        requestId === loadRequest.current &&
        editor === editorGeneration.current
      )
        setNotice({
          ok: false,
          text: 'Không thể lưu danh sách diễn viên. Kiểm tra JSON và mã diễn viên.',
        });
    } finally {
      editorWritePending.current = false;
      if (mounted.current) setEditorBusy(false);
    }
  };

  if (!active) return <EmptyState>Bạn chưa được cấp quyền quản trị chức năng nào.</EmptyState>;
  const sectionLabel = sections.find(([key]) => key === active)?.[1];
  if (active === 'cinemaImages')
    return (
      <section className="catalog-section" aria-label="Quản lý ảnh rạp">
        {routeSection ? (
          <PageHeader
            title={sectionLabel}
            breadcrumbs={[{ label: 'Quản trị' }, { label: sectionLabel }]}
          />
        ) : (
          <h1>Quản trị hệ thống</h1>
        )}
        {!shell && !routeSection && (
          <nav className="catalog-actions" aria-label="Phân hệ quản trị">
            {allowedSections.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={active === key}
                className="catalog-button"
                onClick={() => switchSection(key)}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
        {!routeSection && <h2>Ảnh rạp</h2>}
        <CinemaImageManager />
      </section>
    );

  if (active === 'escalations')
    return (
      <section className="catalog-section" aria-label="Yêu cầu hỗ trợ từ CSKH">
        {routeSection ? (
          <PageHeader
            title="Yêu cầu CSKH"
            breadcrumbs={[{ label: 'Quản trị' }, { label: 'Yêu cầu CSKH' }]}
          />
        ) : (
          <>
            <h1>Quản trị hệ thống</h1>
            {!shell && (
              <nav className="catalog-actions" aria-label="Phân hệ quản trị">
                {allowedSections.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active === key}
                    className="catalog-button"
                    onClick={() => switchSection(key)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            )}
          </>
        )}
        <AdminEscalationModule currentUser={user} />
      </section>
    );

  return (
    <section className="catalog-section" aria-label="Cổng quản trị hệ thống">
      {routeSection ? (
        <PageHeader
          title={sectionLabel}
          description={
            active === 'seats' && seatContext
              ? `${seatContext.cinemaName} · ${seatContext.roomName}`
              : undefined
          }
          breadcrumbs={[{ label: 'Quản trị' }, { label: sectionLabel }]}
        />
      ) : (
        <>
          <h1>Quản trị hệ thống</h1>
          {!shell && (
            <nav className="catalog-actions" aria-label="Phân hệ quản trị">
              {allowedSections.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active === key}
                  className="catalog-button"
                  onClick={() => switchSection(key)}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}
          <h2>{sectionLabel}</h2>
        </>
      )}
      {active === 'revenue' && (
        <form
          className="catalog-actions"
          onSubmit={(event) => {
            event.preventDefault();
            setReportRange(reportInput);
            setReportAppliedInput(reportInput);
          }}
        >
          <label>
            Từ ngày
            <input
              type="date"
              value={reportInput.fromDate}
              onChange={(event) => setReportInput((v) => ({ ...v, fromDate: event.target.value }))}
            />
          </label>
          <label>
            Đến ngày
            <input
              type="date"
              value={reportInput.toDate}
              onChange={(event) => setReportInput((v) => ({ ...v, toDate: event.target.value }))}
            />
          </label>
          <button className="catalog-button" disabled={editorBusy}>
            Lọc doanh thu
          </button>
        </form>
      )}
      {active === 'movies' && selected && (
        <form className="catalog-form" onSubmit={writeCast}>
          <h3>Diễn viên phim #{selected.PhimID}</h3>
          <label>
            Danh sách JSON (actorId, role)
            <textarea
              aria-label="Danh sách diễn viên phim"
              value={values.castJson ?? '[]'}
              onChange={(event) =>
                setValues((current) => ({ ...current, castJson: event.target.value }))
              }
            />
          </label>
          <button className="catalog-button" disabled={editorBusy}>
            Lưu diễn viên
          </button>
        </form>
      )}
      {active === 'complaints' && (
        <ul className="catalog-list">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="catalog-button catalog-button--secondary"
                onClick={() => void openComplaint(row)}
              >
                Mở khiếu nại #{row.id} · {row.title}
              </button>
            </li>
          ))}
        </ul>
      )}
      {active === 'complaints' && complaint?.status === 'loading' && (
        <LoadingState>Đang tải hồ sơ khiếu nại…</LoadingState>
      )}
      {active === 'complaints' && complaint?.status === 'error' && (
        <ErrorState
          error={complaint.error}
          onRetry={() => selected && void openComplaint(selected)}
        />
      )}
      {active === 'complaints' && complaint?.status === 'success' && (
        <section className="catalog-section">
          <h3>
            #{complaint.data.id} · {complaint.data.title}
          </h3>
          <p>
            {complaint.data.senderName} · {complaint.data.type} · {complaint.data.status}
          </p>
          <p>{complaint.data.content}</p>
          <AdminComplaintAssignment
            complaintId={complaint.data.id}
            currentStaffId={complaint.data.assignedStaffId}
            onAssigned={() => selected && void openComplaint(selected)}
          />
          <h4>Đơn hàng liên quan</h4>
          <ComplaintReferenceState
            resource={orderReference}
            onRetry={() => void loadComplaintReference(selected.id, complaintRequest.current)}
          />
          <h4>Lịch sử xử lý</h4>
          <ol>
            {complaint.data.processings.map((item) => (
              <li key={item.id}>
                {item.processorName} · {item.status} · {item.content}
              </li>
            ))}
          </ol>
          {canProcess && (
            <>
              <form
                className="catalog-form"
                onSubmit={(event) => void writeComplaint(event, 'processing')}
              >
                <label>
                  Nội dung xử lý
                  <textarea
                    required
                    value={processingForm.content}
                    onChange={(event) =>
                      setProcessingForm((v) => ({ ...v, content: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Trạng thái sau xử lý
                  <input
                    required
                    value={processingForm.nextStatus}
                    onChange={(event) =>
                      setProcessingForm((v) => ({ ...v, nextStatus: event.target.value }))
                    }
                  />
                </label>
                <button className="catalog-button" disabled={complaintBusy}>
                  Ghi diễn biến
                </button>
              </form>
              <form
                className="catalog-form"
                onSubmit={(event) => void writeComplaint(event, 'status')}
              >
                <label>
                  Trạng thái khiếu nại
                  <input
                    required
                    value={processingForm.nextStatus}
                    onChange={(event) =>
                      setProcessingForm((v) => ({ ...v, nextStatus: event.target.value }))
                    }
                  />
                </label>
                <button className="catalog-button" disabled={complaintBusy}>
                  Cập nhật trạng thái
                </button>
              </form>
            </>
          )}
        </section>
      )}
      {notice && <p role={notice.ok ? 'status' : 'alert'}>{notice.text}</p>}
      {definition && (
        <form className="catalog-form" onSubmit={submit}>
          <h3>{selected ? 'Cập nhật' : 'Tạo mới'}</h3>
          {selected && <p>#{selected[definition.id]}</p>}
          {active === 'users' && selected && (
            <p>Vai trò: {selected.TenVaiTro ?? selected.MaVaiTro} (cố định)</p>
          )}
          {active === 'assignments' && (
            <ManagerAssignmentsContext managerId={values.userId} assignments={rows} />
          )}
          {editableFields.map(([name, label, kind]) => (
            <label key={name}>
              {active === 'seats' && name === 'roomId' && seatContext ? 'Phòng' : label}
              {active === 'seats' && name === 'roomId' && seatContext ? (
                <input aria-label="Phòng" readOnly value={seatContext.roomName} />
              ) : active === 'users' && name === 'roleId' ? (
                <Select
                  aria-label={label}
                  required
                  value={values[name] ?? ''}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [name]: event.target.value }))
                  }
                >
                  <option value="" />
                  {accountRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              ) : active === 'assignments' && ['userId', 'cinemaId'].includes(name) ? (
                <ManagerAssignmentSelect
                  field={name}
                  label={label}
                  value={values[name] ?? ''}
                  managers={managerChoices}
                  cinemas={cinemaChoices}
                  disabled={editorBusy || state.status !== 'success'}
                  editing={Boolean(selected)}
                  onChange={(value) => setValues((current) => ({ ...current, [name]: value }))}
                />
              ) : name === 'status' && RESOURCE_STATUSES[active] ? (
                <Select
                  aria-label={label}
                  required
                  value={values[name] ?? ''}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [name]: event.target.value }))
                  }
                >
                  <option value="">Chọn trạng thái</option>
                  {RESOURCE_STATUSES[active]
                    .filter(
                      (status) => active !== 'assignments' || selected || status === 'Hiệu lực',
                    )
                    .map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                </Select>
              ) : active === 'pricing' && name === 'dayType' ? (
                <Select
                  aria-label={label}
                  required
                  value={values[name] ?? ''}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [name]: event.target.value }))
                  }
                >
                  <option value="">Chọn loại ngày</option>
                  {DAY_TYPES.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </Select>
              ) : (
                <input
                  aria-label={label}
                  type={kind === 'csv' ? 'text' : kind}
                  step={
                    kind === 'datetime-local'
                      ? '0.001'
                      : [
                            'price',
                            'discountValue',
                            'minimumOrder',
                            'maximumDiscount',
                            'surcharge',
                            'basePrice',
                          ].includes(name)
                        ? '0.01'
                        : undefined
                  }
                  value={values[name] ?? ''}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [name]: event.target.value }))
                  }
                  required={
                    ![
                      'description',
                      'phone',
                      'image',
                      'endsOn',
                      'endDate',
                      'maximumDiscount',
                      'minimumOrder',
                      'operatingSince',
                      'birthDate',
                      'language',
                      'subtitle',
                      'ageRating',
                      'director',
                      'posterUrl',
                      'trailerUrl',
                      'status',
                      'genreIds',
                      'nationality',
                    ].includes(name)
                  }
                />
              )}
            </label>
          ))}
          <div className="catalog-actions">
            <button
              className="catalog-button"
              disabled={editorBusy || (active === 'assignments' && !assignmentReady)}
            >
              Lưu
            </button>
            {selected && (
              <button
                className="catalog-button catalog-button--secondary"
                type="button"
                onClick={clearForm}
              >
                Bỏ chọn
              </button>
            )}
          </div>
        </form>
      )}
      {active === 'showtimes' && (
        <p>
          Chọn suất chiếu trong bảng để sửa hoặc dùng nút Hủy; thời gian chồng lấp được kiểm tra
          trong SQL.
        </p>
      )}
      {state.status === 'loading' && <LoadingState>Đang tải dữ liệu…</LoadingState>}
      {state.status === 'error' && <ErrorState error={state.error} onRetry={load} />}
      {state.status === 'success' && state.resource === active && active === 'revenue' && (
        <AdminRevenue report={state.data} />
      )}
      {state.status === 'success' &&
        state.resource === active &&
        active !== 'revenue' &&
        (rows.length === 0 ? (
          <EmptyState>Không có dữ liệu để hiển thị.</EmptyState>
        ) : (
          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead>
                <tr>
                  {Object.keys(rows[0]).map((key) => (
                    <th key={key}>
                      {key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ')}
                    </th>
                  ))}
                  {(definition || active === 'users' || active === 'showtimes') && (
                    <th>Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row[definition?.id ?? idColumns[active]] ?? row.id ?? index}>
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key}>{formatApiValue(value)}</td>
                    ))}
                    {(definition || active === 'users' || active === 'showtimes') && (
                      <td className="catalog-actions">
                        <button
                          type="button"
                          className="catalog-button catalog-button--secondary"
                          disabled={editorBusy}
                          onClick={() => onSelect(row)}
                        >
                          {active === 'users' ? 'Trạng thái' : 'Sửa'}
                        </button>
                        {definition &&
                          !['assignments', 'pricing', 'showtimes', 'users'].includes(active) && (
                            <button
                              type="button"
                              className="catalog-button"
                              disabled={editorBusy}
                              onClick={() => void remove(row)}
                            >
                              Xóa
                            </button>
                          )}
                        {active === 'users' && (
                          <button
                            type="button"
                            className="catalog-button"
                            disabled={editorBusy}
                            onClick={() => void changeUserStatus(row)}
                          >
                            {row.TrangThai === 'Hoạt động' ? 'Khóa' : 'Mở khóa'}
                          </button>
                        )}
                        {active === 'showtimes' && (
                          <button
                            type="button"
                            className="catalog-button"
                            disabled={editorBusy}
                            onClick={() => void cancelShowtime(row)}
                          >
                            Hủy
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </section>
  );
}
