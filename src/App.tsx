import React, {ErrorInfo, ReactNode} from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import MainPage from './pages/MainPage';
import Chat from './pages/chatroom';



class ErrorBoundary extends React.Component<{children: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('路由错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>出现了错误。</h1>;
    }

    return this.props.children;
  }
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/chatroom" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;