import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './WaterfallList.css';
import { getPosts, likePost, sharePost, getPostStats } from '../api';

function WaterfallList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postStats, setPostStats] = useState({});
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all'); // all, hot, latest

  // 根据路由设置默认tab
  useEffect(() => {
    if (location.pathname === '/hot') {
      setActiveTab('hot');
    } else {
      setActiveTab('all');
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchPosts();
  }, []);

  // 获取所有帖子的统计数据
  useEffect(() => {
    if (posts.length > 0) {
      fetchAllPostStats();
    }
  }, [posts]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await getPosts();
      if (response.data.code === 0) {
        setPosts(response.data.list);
      }
    } catch (err) {
      console.error('获取图片列表失败:', err);
      setError('获取图片列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPostStats = async () => {
    const stats = {};
    const liked = new Set();
    
    for (const post of posts.slice(0, 30)) { // 加载前30个的统计数据
      try {
        const response = await getPostStats(post.id);
        if (response.data.code === 0) {
          stats[post.id] = {
            likeCount: response.data.like_count,
            shareCount: response.data.share_count,
            commentCount: response.data.comment_count
          };
          if (response.data.is_liked) {
            liked.add(post.id);
          }
        }
      } catch (err) {
        console.error(`获取帖子${post.id}统计数据失败:`, err);
      }
    }
    
    setPostStats(stats);
    setLikedPosts(liked);
  };

  // 计算热度分数
  const calculateHotScore = (post) => {
    const stats = postStats[post.id] || { likeCount: 0, shareCount: 0, commentCount: 0 };
    // 热度算法：点赞*1 + 评论*2 + 分享*3
    return stats.likeCount * 1 + stats.commentCount * 2 + stats.shareCount * 3;
  };

  // 排序后的帖子列表
  const sortedPosts = React.useMemo(() => {
    let sorted = [...posts];
    
    switch (activeTab) {
      case 'hot':
        // 按热度排序
        sorted.sort((a, b) => calculateHotScore(b) - calculateHotScore(a));
        break;
      case 'latest':
        // 按时间排序（最新的在前）
        sorted.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
        break;
      case 'all':
      default:
        // 默认按创建时间排序
        sorted.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
        break;
    }
    
    return sorted;
  }, [posts, activeTab, postStats]);

  const handleLike = async (e, postId) => {
    e.stopPropagation();
    try {
      const isLiked = likedPosts.has(postId);
      const action = isLiked ? 'unlike' : 'like';
      const response = await likePost(postId, action);
      
      if (response.data.code === 0) {
        setPostStats(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            likeCount: response.data.count
          }
        }));
        
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (isLiked) {
            newSet.delete(postId);
          } else {
            newSet.add(postId);
          }
          return newSet;
        });
      }
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  const handleShare = async (e, postId) => {
    e.stopPropagation();
    try {
      const response = await sharePost(postId);
      if (response.data.code === 0) {
        setPostStats(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            shareCount: response.data.count
          }
        }));
        
        const url = `${window.location.origin}/post/${postId}`;
        navigator.clipboard.writeText(url).then(() => {
          alert('链接已复制到剪贴板！');
        }).catch(() => {
          alert('转发成功！');
        });
      }
    } catch (err) {
      console.error('转发失败:', err);
      alert('转发失败，请重试');
    }
  };

  const handlePostClick = (post) => {
    navigate(`/post/${post.id}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'hot') {
      navigate('/hot');
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="loading-container">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="error-container">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* 全宽 Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h1 className="hero-title">发现精彩美图</h1>
          <p className="hero-subtitle">浏览、点评、分享你的看法</p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">{posts.length}+</span>
              <span className="stat-label">精选图片</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1.2k+</span>
              <span className="stat-label">精彩点评</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">活跃用户</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 - 全宽布局 */}
      <main className="main-content">
        <div className="content-header">
          <h2 className="section-title">
            {activeTab === 'hot' ? '🔥 热门推荐' : 
             activeTab === 'latest' ? '🆕 最新发布' : '🌟 精选推荐'}
          </h2>
          <div className="filter-tabs">
            <button 
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              全部
            </button>
            <button 
              className={`tab ${activeTab === 'hot' ? 'active' : ''}`}
              onClick={() => handleTabChange('hot')}
            >
              热门
            </button>
            <button 
              className={`tab ${activeTab === 'latest' ? 'active' : ''}`}
              onClick={() => handleTabChange('latest')}
            >
              最新
            </button>
          </div>
        </div>

        <div className="waterfall-grid">
          {sortedPosts.map((post, index) => {
            const stats = postStats[post.id] || { likeCount: 0, shareCount: 0, commentCount: 0 };
            const isLiked = likedPosts.has(post.id);
            const hotScore = calculateHotScore(post);
            
            return (
              <div 
                key={post.id} 
                className="waterfall-item"
                onClick={() => handlePostClick(post)}
              >
                <div className="card-image-wrapper">
                  <img 
                    src={`/${post.img}`} 
                    alt={post.title}
                    className="card-image"
                    loading="lazy"
                  />
                  <div className="card-overlay">
                    <span className="view-btn">查看详情</span>
                  </div>
                  {/* 热门标签 */}
                  {hotScore > 10 && (
                    <div className="hot-badge">
                      <span className="hot-icon">🔥</span>
                      <span className="hot-text">热门</span>
                    </div>
                  )}
                </div>
                <div className="card-content">
                  <h3 className="card-title">{post.title}</h3>
                  <p className="card-desc">{post.desc}</p>
                  
                  {/* 互动按钮 */}
                  <div className="card-actions">
                    <button 
                      className={`action-btn ${isLiked ? 'liked' : ''}`}
                      onClick={(e) => handleLike(e, post.id)}
                    >
                      <span className="action-icon">{isLiked ? '❤️' : '🤍'}</span>
                      <span className="action-count">{stats.likeCount || 0}</span>
                    </button>
                    <button 
                      className="action-btn"
                      onClick={(e) => handleShare(e, post.id)}
                    >
                      <span className="action-icon">📤</span>
                      <span className="action-count">{stats.shareCount || 0}</span>
                    </button>
                    <button className="action-btn">
                      <span className="action-icon">💬</span>
                      <span className="action-count">{stats.commentCount || 0}</span>
                    </button>
                  </div>
                  
                  <div className="card-footer">
                    <span className="card-time">{post.create_time.split(' ')[0]}</span>
                    <span className="card-index">#{index + 1}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {sortedPosts.length === 0 && (
          <div className="no-results">
            <p>没有找到相关内容</p>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="site-footer">
        <p>© 2026 吃瓜美女点评 - 发现美好生活</p>
      </footer>
    </div>
  );
}

export default WaterfallList;
