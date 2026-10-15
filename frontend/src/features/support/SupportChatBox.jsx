import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSupportComplaintMessages,
  sendSupportComplaintMessage,
  addSupportInternalNote,
} from '../../api/supportApi';
import { formatDateTime } from '../../utils/dateTime';
import { Button } from '../../components/ui';
import './support-chat.css';

export default function SupportChatBox(props) {
  return <SupportChatSession key={String(props.complaintId ?? '')} {...props} />;
}

function SupportChatSession({ complaintId, canChat = true }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(complaintId));
  const [loadError, setLoadError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const mounted = useRef(true);
  const requestGeneration = useRef(0);

  const loadMessages = useCallback(async () => {
    if (!complaintId) return;
    const generation = ++requestGeneration.current;
    const requestedComplaintId = String(complaintId);
    try {
      const res = await getSupportComplaintMessages(complaintId);
      if (
        mounted.current &&
        generation === requestGeneration.current &&
        String(complaintId) === requestedComplaintId
      ) {
        setMessages(Array.isArray(res.messages) ? res.messages : []);
        setLoadError(null);
      }
    } catch (error) {
      if (mounted.current && generation === requestGeneration.current) setLoadError(error);
    } finally {
      if (mounted.current && generation === requestGeneration.current) setLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    mounted.current = true;
    requestGeneration.current += 1;
    const initialLoad = setTimeout(() => void loadMessages(), 0);
    const timer = setInterval(() => {
      void loadMessages();
    }, 4000);
    return () => {
      mounted.current = false;
      requestGeneration.current += 1;
      clearTimeout(initialLoad);
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
        <span className="support-chat__polling">Tự động cập nhật</span>
      </div>

      {loadError && (
        <div className="support-chat__load-error" role="alert">
          <p>
            {messages.length
              ? 'Không thể làm mới tin nhắn lúc này.'
              : 'Không thể tải tin nhắn lúc này.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              void loadMessages();
            }}
          >
            Tải lại tin nhắn
          </Button>
        </div>
      )}

      <div
        className="support-chat__messages"
        role="log"
        aria-live="polite"
        aria-label="Tin nhắn trong hội thoại"
        tabIndex={0}
      >
        {loading && messages.length === 0 ? (
          <p className="support-chat__state" role="status">
            Đang tải tin nhắn…
          </p>
        ) : loadError && messages.length === 0 ? null : messages.length === 0 ? (
          <p className="support-chat__state" role="status">
            Chưa có tin nhắn hoặc ghi chú nào.
          </p>
        ) : (
          messages.map((msg) => {
            if (msg.isInternal) {
              return (
                <div key={msg.id} className="support-chat__msg support-chat__msg--internal">
                  <div className="support-chat__bubble">
                    <span className="support-chat__internal-label">
                      🔒 Ghi chú nội bộ
                    </span>
                    <p>{msg.content}</p>
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
                  <p>{msg.content}</p>
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
            <p className="form-error" role="alert">
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
        <p className="support-chat__notice">
          Chỉ nhân viên được phân công mới có thể gửi tin nhắn cho khách hàng.
        </p>
      )}
    </div>
  );
}
