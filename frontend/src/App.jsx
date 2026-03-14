import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MobileBank from './pages/MobileBank';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mobile" element={<MobileBank />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
