import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSupportComplaintMessages,
  sendSupportComplaintMessage,
  addSupportInternalNote,
} from '../../api/supportApi';
import { formatDateTime } from '../../utils/dateTime';
import { Button } from '../../components/ui';
import './support-chat.css';

export default function SupportChatBox({ complaintId, assignedStaffId, currentUserId, canChat = true }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const mounted = useRef(true);

  const loadMessages = useCallback(async () => {
    if (!complaintId) return;
    try {
      const res = await getSupportComplaintMessages(complaintId);
      if (mounted.current && res.messages) {
        setMessages(res.messages);
      }
    } catch {
      // background polling error ignored
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    void loadMessages();
    const timer = setInterval(() => {
      void loadMessages();
    }, 4000);
    return () => {
      mounted.current = false;
      clearInterval(timer);
    };
  }, [loadMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || sending || !complaintId) return;

    setSending(true);
    setSendError(null);
    try {
      if (isInternal) {
        await addSupportInternalNote(complaintId, content);
      } else {
        await sendSupportComplaintMessage(complaintId, content);
      }
      setInputText('');
      await loadMessages();
    } catch (err) {
      setSendError(err.message || 'Không thể gửi tin nhắn.');
    } finally {
      if (mounted.current) setSending(false);
    }
  };

  return (
    <div className="support-chat" aria-label="Khung hội thoại hỗ trợ và ghi chú nội bộ">
      <div className="support-chat__header">
        <strong>Trao đổi & Ghi chú ({messages.length})</strong>
        <span className="catalog-muted" style={{ fontSize: '0.8rem' }}>
          Tự động cập nhật
        </span>
      </div>

      <div className="support-chat__messages" role="log" aria-live="polite">
        {loading && messages.length === 0 ? (
          <p className="catalog-muted" style={{ fontSize: '0.875rem' }}>Đang tải tin nhắn…</p>
        ) : messages.length === 0 ? (
          <p className="catalog-muted" style={{ fontSize: '0.875rem' }}>Chưa có tin nhắn hoặc ghi chú nào.</p>
        ) : (
          messages.map((msg) => {
            if (msg.isInternal) {
              return (
                <div key={msg.id} className="support-chat__msg support-chat__msg--internal">
                  <div className="support-chat__bubble">
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#b45309',
                        textTransform: 'uppercase',
                        marginBottom: '0.25rem',
                      }}
                    >
                      🔒 Ghi chú nội bộ
                    </span>
                    <p style={{ margin: 0 }}>{msg.content}</p>
                  </div>
                  <span className="support-chat__meta">
                    <strong>{msg.senderName}</strong>
                    <span>•</span>
                    <span>{formatDateTime(msg.createdAt)}</span>
                  </span>
                </div>
              );
            }

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
                  <strong>{msg.senderName || (isCustomer ? 'Khách hàng' : 'CSKH')}</strong>
                  <span>•</span>
                  <span>{formatDateTime(msg.createdAt)}</span>
                </span>
              </div>
            );
          })
        )}
      </div>

      {canChat ? (
        <form className="support-chat__form" onSubmit={handleSend}>
          {sendError && (
            <p className="form-error" role="alert" style={{ fontSize: '0.85rem' }}>
              {sendError}
            </p>
          )}
          <div className="support-chat__actions">
            <label className="support-chat__toggle-label">
              <input
                type="checkbox"
                checked={isInternal}
                disabled={sending}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              <span>🔒 Ghi chú nội bộ (chỉ nhân viên/Admin thấy)</span>
            </label>
          </div>
          <div className="support-chat__input-row">
            <textarea
              className="support-chat__input"
              rows={2}
              placeholder={
                isInternal
                  ? 'Nhập ghi chú xử lý nội bộ…'
                  : 'Nhập tin nhắn phản hồi công khai cho khách hàng…'
              }
              value={inputText}
              disabled={sending}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={2000}
              aria-label="Nội dung tin nhắn hoặc ghi chú"
            />
            <Button
              type="submit"
              disabled={sending || !inputText.trim()}
              loading={sending}
              variant={isInternal ? 'secondary' : 'primary'}
            >
              {isInternal ? 'Lưu ghi chú' : 'Gửi'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="catalog-muted" style={{ fontSize: '0.85rem' }}>
          Chỉ nhân viên được phân công mới có thể gửi tin nhắn cho khách hàng.
        </p>
      )}
    </div>
  );
}
