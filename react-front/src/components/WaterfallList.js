import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './WaterfallList.css';
import { getPosts, likePost, sharePost, getPostStats, getSiteStats, getYulu } from '../api';

const PAGE_SIZE = 12;

function WaterfallList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postStats, setPostStats] = useState({});
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [siteStats, setSiteStats] = useState({ posts: 0, comments: 0, totalUsers: 0, todayUsers: 0 });
  const [displayStats, setDisplayStats] = useState({ posts: 0, comments: 0, totalUsers: 0, todayUsers: 0 });
  const [allQuotes, setAllQuotes] = useState([]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [quoteAnimating, setQuoteAnimating] = useState(false);
  const contentRef = useRef(null);

  // 获取所有语录
  useEffect(() => {
    getYulu().then(res => {
      if (res.data.code === 0 && res.data.quotes.length > 0) {
        setAllQuotes(res.data.quotes);
      }
    }).catch(err => console.error('获取语录失败:', err));
  }, []);

  // 打字效果 + 每10秒切换
  useEffect(() => {
    if (allQuotes.length === 0) return;

    const currentQuote = allQuotes[quoteIndex % allQuotes.length];
    setTypedText('');
    let charIndex = 0;

    // 打字动画
    const typeTimer = setInterval(() => {
      charIndex++;
      setTypedText(currentQuote.slice(0, charIndex));
      if (charIndex >= currentQuote.length) {
        clearInterval(typeTimer);
      }
    }, 60);

    // 10秒后切换下一条
    const switchTimer = setTimeout(() => {
      setQuoteIndex(prev => prev + 1);
    }, 10000);

    return () => {
      clearInterval(typeTimer);
      clearTimeout(switchTimer);
    };
  }, [allQuotes, quoteIndex]);

  // 语录切换时触发按钮旋转动画
  useEffect(() => {
    setQuoteAnimating(true);
    const timer = setTimeout(() => setQuoteAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [quoteIndex]);

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

  useEffect(() => {
    fetchSiteStats();
  }, []);

  const fetchSiteStats = async () => {
    try {
      const response = await getSiteStats();
      if (response.data.code === 0) {
        setSiteStats({
          posts: response.data.total_posts,
          comments: response.data.total_comments,
          totalUsers: response.data.total_users,
          todayUsers: response.data.today_users
        });
      }
    } catch (err) {
      console.error('获取统计数据失败:', err);
    }
  };

  // 数字滚动动画
  useEffect(() => {
    const targets = {
      posts: siteStats.posts,
      comments: siteStats.comments,
      totalUsers: siteStats.totalUsers,
      todayUsers: siteStats.todayUsers
    };
    const duration = 1200;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayStats({
        posts: Math.round(targets.posts * eased),
        comments: Math.round(targets.comments * eased),
        totalUsers: Math.round(targets.totalUsers * eased),
        todayUsers: Math.round(targets.todayUsers * eased)
      });
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [siteStats.posts, siteStats.comments, siteStats.totalUsers, siteStats.todayUsers]);

  // 计算热度分数
  const calculateHotScore = (post) => {
    const stats = postStats[post.id] || { likeCount: 0, shareCount: 0, commentCount: 0 };
    return stats.likeCount * 1 + stats.commentCount * 2 + stats.shareCount * 3;
  };

  // 排序后的帖子列表
  const sortedPosts = React.useMemo(() => {
    let sorted = [...posts];

    switch (activeTab) {
      case 'hot':
        sorted.sort((a, b) => calculateHotScore(b) - calculateHotScore(a));
        break;
      case 'latest':
        sorted.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
        break;
      case 'all':
      default:
        sorted.sort((a, b) => new Date(b.create_time) - new Date(a.create_time));
        break;
    }

    return sorted;
  }, [posts, activeTab, postStats]);

  // 分页数据
  const totalPages = Math.ceil(sortedPosts.length / PAGE_SIZE);
  const paginatedPosts = sortedPosts.slice(0, page * PAGE_SIZE);

  // 获取当前页帖子的统计数据（增量加载）
  useEffect(() => {
    if (paginatedPosts.length === 0) return;

    const toFetch = paginatedPosts.filter(p => !postStats[p.id]);
    if (toFetch.length === 0) return;

    const fetchStats = async () => {
      const results = await Promise.allSettled(
        toFetch.map(post => getPostStats(post.id))
      );

      const newStats = { ...postStats };
      const newLiked = new Set(likedPosts);
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.data.code === 0) {
          const { post_id, like_count, share_count, comment_count, is_liked } = result.value.data;
          newStats[post_id] = {
            likeCount: like_count,
            shareCount: share_count,
            commentCount: comment_count
          };
          if (is_liked) {
            newLiked.add(post_id);
          }
        }
      });

      setPostStats(newStats);
      setLikedPosts(newLiked);
    };

    fetchStats();
  }, [paginatedPosts]);

  // 切换tab时重置页码并滚动到内容区
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

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
    setPage(1);
    if (tab === 'hot') {
      navigate('/hot');
    } else {
      navigate('/');
    }
  };

  const loadMore = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
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
        {/* 浮动粒子 */}
        <div className="hero-particles">
          <span className="particle p1" />
          <span className="particle p2" />
          <span className="particle p3" />
          <span className="particle p4" />
          <span className="particle p5" />
          <span className="particle p6" />
          <span className="particle p7" />
          <span className="particle p8" />
        </div>
        <div className="hero-content">
          <h1 className="hero-title">发现精彩美图</h1>
          <p className="hero-subtitle">浏览、点评、分享你的看法</p>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">{displayStats.posts}</span>
              <span className="stat-label">精选图片</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{displayStats.comments}</span>
              <span className="stat-label">精彩点评</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{displayStats.totalUsers}</span>
              <span className="stat-label">总用户</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{displayStats.todayUsers}</span>
              <span className="stat-label">今日活跃</span>
            </div>
          </div>
          {/* 每日语录 */}
          {typedText && (
            <div className="daily-quote">
              <p className="quote-text">{typedText}</p>
              <button
                className={`quote-refresh-btn${quoteAnimating ? ' rotating' : ''}`}
                onClick={() => setQuoteIndex(prev => prev + 1)}
                title="换一条语录"
              >
                &#x21bb;
              </button>
            </div>
          )}
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
          {paginatedPosts.map((post, index) => {
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
                    <span className="card-author">{post.username || '管理员'}</span>
                    <span className="card-time">{post.create_time.split(' ')[0]}</span>
                    <span className="card-index">#{(page - 1) * PAGE_SIZE + index + 1}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 分页控制 */}
        {sortedPosts.length > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              {paginatedPosts.length} / {sortedPosts.length} 条
              {page < totalPages && ` · 第 ${page}/${totalPages} 页`}
            </span>
            {page < totalPages && (
              <button className="load-more-btn" onClick={loadMore}>
                加载更多 ({(totalPages - page) * PAGE_SIZE} 条剩余)
              </button>
            )}
          </div>
        )}

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
