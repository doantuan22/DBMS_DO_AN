import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="system-state" role="alert">
          <h1>Đã có lỗi khi hiển thị trang</h1>
          <p>Hãy tải lại trang để tiếp tục.</p>
          <button type="button" onClick={() => window.location.reload()}>Tải lại</button>
        </main>
      );
    }
    return this.props.children;
  }
}
