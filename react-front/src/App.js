import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import WaterfallList from './components/WaterfallList';
import PostDetail from './components/PostDetail';
import SearchResults from './components/SearchResults';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';

function HomePage() {
  return <WaterfallList />;
}

function HotPage() {
  return <WaterfallList />;
}

function PostPage() {
  return <PostDetail />;
}

function SearchPage() {
  return <SearchResults />;
}

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePublishSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Router>
      <div className="App">
        {/* 根据路由决定是否显示导航栏 */}
        <Routes>
          <Route path="/admin/*" element={null} />
          <Route path="*" element={<Navbar onPublishSuccess={handlePublishSuccess} />} />
        </Routes>
        
        <div className="page-container" key={refreshTrigger}>
          <Routes>
            {/* 公开路由 */}
            <Route path="/" element={<HomePage />} />
            <Route path="/hot" element={<HotPage />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/search" element={<SearchPage />} />
            
            {/* 管理路由 */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            {/* 404 重定向 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
