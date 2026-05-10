import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import PublishModal from './PublishModal';
import { publishPost } from '../api';

function Navbar({ onPublishSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  // 监听滚动
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 可以在这里实现搜索跳转逻辑
      console.log('搜索:', searchQuery);
    }
  };

  const handlePublish = async (formData) => {
    try {
      const response = await publishPost(formData);
      if (response.data.code === 0) {
        // 发布成功
        if (onPublishSuccess) {
          onPublishSuccess(response.data.data);
        }
        return { success: true };
      } else {
        return { success: false, message: response.data.msg };
      }
    } catch (err) {
      console.error('发布失败:', err);
      return { success: false, message: '发布失败，请重试' };
    }
  };

  return (
    <>
      <nav className={`global-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-content">
          {/* Logo */}
          <div className="navbar-logo" onClick={() => navigate('/')}>
            <span className="logo-icon">🍉</span>
            <span className="logo-text">吃瓜点评</span>
          </div>

          {/* 搜索框 - 只在首页显示 */}
          {isHome && (
            <form className="navbar-search" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="搜索美图..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">🔍</button>
            </form>
          )}

          {/* 右侧操作区 */}
          <div className="navbar-actions">
            <button 
              className={`nav-action-btn ${isHome ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              首页
            </button>
            <button 
              className={`nav-action-btn ${location.pathname === '/hot' ? 'active' : ''}`}
              onClick={() => navigate('/hot')}
            >
              热门
            </button>
            <button 
              className="nav-action-btn publish-btn"
              onClick={() => setIsPublishOpen(true)}
            >
              <span className="publish-icon">+</span>
              发布
            </button>
          </div>
        </div>
      </nav>

      {/* 发布弹窗 */}
      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        onPublish={handlePublish}
      />
    </>
  );
}

export default Navbar;
