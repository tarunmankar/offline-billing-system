import React from 'react';
import { ConfigProvider } from './context/ConfigContext';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <ConfigProvider>
      <Dashboard />
    </ConfigProvider>
  );
};

export default App;
