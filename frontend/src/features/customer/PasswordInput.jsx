import { useState } from 'react';
import { Input } from '../../components/ui';
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return <div className="customer-password"><Input {...props} type={visible ? 'text' : 'password'} /><button type="button" disabled={props.disabled} aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? 'Ẩn' : 'Hiện'}</button></div>;
}
