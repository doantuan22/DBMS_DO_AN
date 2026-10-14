import { formatDateTime } from '../utils/dateTime';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getComplaint, getComplaintMessages, sendComplaintMessage } from '../api/feedbackApi';
import { LoadingState } from '../components/CatalogStates';
import StatusBadge from '../components/primitives/StatusBadge';
import { PageHeader, AsyncState, Button } from '../components/ui';
import AccountNavigation from '../features/customer/AccountNavigation';
import '../features/customer/customer-account.css';
import '../features/support/support-chat.css';
import { useAuth } from '../context/AuthContext';

export default function ComplaintDetail() {
  const { complaintId } = useParams();
  const { user } = useAuth();
  const scope = `${complaintId}:${user?.userId}:${user?.permissions
    ?.map((item) => item.code)
    .sort()
    .join(',')}`;
  return <ComplaintContext key={scope} complaintId={complaintId} />;
}

function ComplaintContext({ complaintId }) {
  const [resource, setResource] = useState({ status: 'loading' });
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const request = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const generation = request;
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, []);

  const loadComplaint = useCallback(async () => {
    const generation = ++request.current;
    setResource({ status: 'loading' });
    try {
      const result = await getComplaint(complaintId);
      if (mounted.current && generation === request.current)
        setResource({ status: 'success', data: result.complaint });
    } catch (error) {
      if (mounted.current && generation === request.current)
        setResource({ status: 'error', error });
    }
  }, [complaintId]);

  const loadMessages = useCallback(async () => {
    try {
      const res = await getComplaintMessages(complaintId);
      if (mounted.current && res.messages) {
        setMessages(res.messages);
      }
    } catch {
      // Background polling ignores network glitches
    } finally {
      if (mounted.current) setMessagesLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    void Promise.resolve().then(loadComplaint);
    void Promise.resolve().then(loadMessages);

    // Setup polling every 4 seconds for new messages
    const timer = setInterval(() => {
      loadMessages();
    }, 4000);
    return () => clearInterval(timer);
  }, [loadComplaint, loadMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || sending) return;

    setSending(true);
    setSendError(null);
    try {
      await sendComplaintMessage(complaintId, content);
      setInputText('');
      await loadMessages();
    } catch (err) {
      setSendError(err.message || 'Không thể gửi tin nhắn.');
    } finally {
      if (mounted.current) setSending(false);
    }
  };

  if (resource.status === 'loading') return <LoadingState>Đang tải khiếu nại…</LoadingState>;
  if (resource.status === 'error')
    return (
      <section className="catalog-page">
        <PageHeader
          title="Chi tiết khiếu nại"
          breadcrumbs={[{ label: 'Khiếu nại', to: '/complaints' }]}
        />
        <AsyncState status="error" error={resource.error} onRetry={loadComplaint} />
      </section>
    );

  const complaint = resource.data;
  return (
    <section className="catalog-page customer-journey">
      <AccountNavigation />
      <p className="catalog-eyebrow">KHIẾU NẠI #{complaint.id}</p>
      <PageHeader
        title={complaint.title}
        breadcrumbs={[{ label: 'Khiếu nại của tôi', to: '/complaints' }, { label: 'Chi tiết' }]}
      />
      <article className="customer-panel">
        <p className="complaint-meta">
          <span className="catalog-chip">{complaint.type}</span>
          <StatusBadge status={complaint.status} />
          <span className="catalog-muted">Gửi lúc: {formatDateTime(complaint.createdAt)}</span>
          <span
            className={`support-chat__staff-badge ${
              complaint.assignedStaffName ? '' : 'support-chat__staff-badge--unassigned'
            }`}
          >
            {complaint.assignedStaffName
              ? `Nhân viên phụ trách: ${complaint.assignedStaffName}`
              : 'Đang chờ CSKH tiếp nhận'}
          </span>
        </p>
        <p className="customer-content">{complaint.content}</p>
        <p>
          Đơn liên quan:{' '}
          {complaint.orderId ? (
            <Link to={`/orders/${complaint.orderId}`}>Đơn #{complaint.orderId}</Link>
          ) : (
            'Không có'
          )}
        </p>
      </article>

      {/* 2-Way Chat Section */}
      <section className="catalog-section" aria-label="Trao đổi với CSKH">
        <h2>Trao đổi với CSKH</h2>
        <div className="support-chat">
          <div className="support-chat__header">
            <strong>Hội thoại hỗ trợ</strong>
            <span className="catalog-muted">
              {messages.length} tin nhắn
            </span>
          </div>

          <div className="support-chat__messages" role="log" aria-live="polite">
            {messagesLoading && messages.length === 0 ? (
              <p className="catalog-muted">Đang tải cuộc trao đổi…</p>
            ) : messages.length === 0 ? (
              <p className="catalog-muted">Chưa có tin nhắn nào. Bạn có thể gửi câu hỏi tại đây.</p>
            ) : (
              messages.map((msg) => {
                const isCustomer = msg.senderRole === 'KHACH_HANG' || msg.senderRole === 'Khách hàng';
                return (
                  <div
                    key={msg.id}
                    className={`support-chat__msg ${
                      isCustomer ? 'support-chat__msg--customer' : 'support-chat__msg--staff'
                    }`}
                  >
                    <div className="support-chat__bubble">
                      <p style={{ margin: 0 }}>{msg.content}</p>
                    </div>
                    <span className="support-chat__meta">
                      <strong>{isCustomer ? 'Tôi' : (msg.senderName || 'CSKH')}</strong>
                      <span>•</span>
                      <span>{formatDateTime(msg.createdAt)}</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <form className="support-chat__form" onSubmit={handleSendMessage}>
            {sendError && (
              <p className="form-error" role="alert">
                {sendError}
              </p>
            )}
            <div className="support-chat__input-row">
              <input
                type="text"
                className="support-chat__input"
                placeholder="Nhập tin nhắn phản hồi CSKH…"
                value={inputText}
                disabled={sending}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={2000}
                aria-label="Nội dung tin nhắn gửi CSKH"
              />
              <Button type="submit" disabled={sending || !inputText.trim()} loading={sending}>
                Gửi
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Complaint Processing History */}
      <section className="catalog-section">
        <h2>Lịch sử xử lý</h2>
        {complaint.processingHistory && complaint.processingHistory.length ? (
          <ol className="customer-timeline">
            {complaint.processingHistory.map((item) => (
              <li key={item.id}>
                <p className="complaint-meta">
                  <StatusBadge status={item.status} />
                  <span className="catalog-muted">{formatDateTime(item.processedAt)}</span>
                </p>
                <p>{item.content}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="catalog-muted">Chưa có lịch sử xử lý.</p>
        )}
      </section>
      <Link className="catalog-button catalog-button--secondary" to="/complaints">
        Quay lại
      </Link>
    </section>
  );
}
