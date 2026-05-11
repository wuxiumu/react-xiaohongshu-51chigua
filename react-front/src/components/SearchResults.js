import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SearchResults.css';
import { getPosts, likePost, sharePost, getPostStats, getHotKeywords } from '../api';

// 可配置的外部搜索引擎
const EXTERNAL_SEARCH_ENGINES = [
  { name: '百度搜索', url: (q) => `https://www.baidu.com/s?wd=${q}` },
  { name: '谷歌搜索', url: (q) => `https://www.google.com/search?q=${q}` },
  { name: '必应搜索', url: (q) => `https://www.bing.com/search?q=${q}` },
  { name: '搜狗搜索', url: (q) => `https://www.sogou.com/web?query=${q}` },
  { name: 'Yandex搜索', url: (q) => `https://yandex.com/search/?text=${q}` },
];

function SearchResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postStats, setPostStats] = useState({});
  const [likedPosts, setLikedPosts] = useState(new Set());

  // 从 URL 查询参数中获取搜索关键词
  const queryParams = new URLSearchParams(location.search);
  const keyword = decodeURIComponent(queryParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(keyword);
  const [hotKeywords, setHotKeywords] = useState({});
  const [hotKeywordsExpanded, setHotKeywordsExpanded] = useState(false);

  // 当 URL 参数变化时同步搜索输入框
  useEffect(() => {
    setSearchInput(keyword);
  }, [keyword]);

  // 获取热门关键词
  useEffect(() => {
    getHotKeywords().then(res => {
      if (res.data.code === 0) {
        setHotKeywords(res.data.categories || {});
      }
    }).catch(err => {
      console.error('获取热门关键词失败:', err);
    });
  }, []);

  useEffect(() => {
    setPostStats({});
    setLikedPosts(new Set());
    fetchPosts();
  }, [keyword]);

  // 点击关键词搜索
  const handleKeywordClick = (kw) => {
    setSearchInput(kw);
    navigate(`/search?q=${encodeURIComponent(kw)}`);
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await getPosts();
      if (response.data.code === 0) {
        const allPosts = response.data.list;
        setPosts(allPosts);

        // 根据关键词筛选
        if (keyword.trim()) {
          const filtered = allPosts.filter(post => {
            const q = keyword.toLowerCase();
            return (
              (post.title && post.title.toLowerCase().includes(q)) ||
              (post.desc && post.desc.toLowerCase().includes(q)) ||
              (post.username && post.username.toLowerCase().includes(q))
            );
          });
          setFilteredPosts(filtered);
        } else {
          setFilteredPosts(allPosts);
        }
      }
    } catch (err) {
      console.error('获取搜索结果失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  useEffect(() => {
    if (filteredPosts.length > 0) {
      fetchStats();
    }
  }, [filteredPosts]);

  const fetchStats = async () => {
    const stats = {};
    const liked = new Set();

    const results = await Promise.allSettled(
      filteredPosts.slice(0, 30).map(post => getPostStats(post.id))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.data.code === 0) {
        const { post_id, like_count, share_count, comment_count, is_liked } = result.value.data;
        stats[post_id] = {
          likeCount: like_count,
          shareCount: share_count,
          commentCount: comment_count
        };
        if (is_liked) {
          liked.add(post_id);
        }
      }
    });

    setPostStats(stats);
    setLikedPosts(liked);
  };

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

  // 高亮关键词
  const highlightText = (text) => {
    if (!text || !keyword.trim()) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <span key={i} className="highlight">{part}</span> : part
    );
  };

  if (loading) {
    return (
      <div className="search-page-wrapper">
        <div className="search-loading">搜索中...</div>
      </div>
    );
  }

  return (
    <div className="search-page-wrapper">
      <main className="search-main-content">
        {/* 搜索栏 */}
        <div className="search-header">
          <form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchInput;
              if (q.trim()) {
                navigate(`/search?q=${encodeURIComponent(q.trim())}`);
              }
            }}
          >
            <input
              name="search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索美图..."
              className="search-page-input"
            />
            {searchInput && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchInput('')}
                title="清空"
              >
                ×
              </button>
            )}
            <button type="submit" className="search-page-btn">搜索</button>
          </form>
        </div>

        {/* 热门推荐 */}
        {Object.keys(hotKeywords).length > 0 && (
          <div className="hot-keywords-section">
            <h3
              className="hot-keywords-title"
              onClick={keyword.trim() ? () => setHotKeywordsExpanded(!hotKeywordsExpanded) : undefined}
              style={{ cursor: keyword.trim() ? 'pointer' : 'default' }}
            >
              {keyword.trim() && !hotKeywordsExpanded ? (
                <>
                  <span className="hot-keywords-expand-icon">🔥</span>
                  热门关键词（{Object.values(hotKeywords).flat().length}）
                </>
              ) : (
                <>
                  <span className="hot-keywords-title-bar"></span>
                  热门搜索
                </>
              )}
              {keyword.trim() && (
                <span className="hot-keywords-toggle">{hotKeywordsExpanded ? '收起' : '展开'}</span>
              )}
            </h3>
            {(!keyword.trim() || hotKeywordsExpanded) && (
              <>
                {Object.entries(hotKeywords).map(([category, keywords]) => (
                  <div key={category} className="hot-keywords-group">
                    <span className="hot-keywords-label">{category}</span>
                    <div className="hot-keywords-list">
                      {keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="hot-keyword-tag"
                          onClick={() => handleKeywordClick(kw)}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* 搜索结果 */}
        <div className="search-results-info">
          {keyword.trim() && (
            <h2 className="results-title">
              搜索 "<span className="highlight-keyword">{keyword}</span>"
            </h2>
          )}
          <p className="results-count">共找到 {filteredPosts.length} 条结果</p>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="waterfall-grid">
            {filteredPosts.map((post) => {
              const stats = postStats[post.id] || { likeCount: 0, shareCount: 0, commentCount: 0 };
              const isLiked = likedPosts.has(post.id);

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
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{highlightText(post.title)}</h3>
                    <p className="card-desc">{highlightText(post.desc)}</p>

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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <p>未找到与 "<strong>{keyword}</strong>" 相关的内容</p>
            <p className="no-results-hint">试试在其他搜索引擎查找：</p>
            <div className="external-search-links">
              {EXTERNAL_SEARCH_ENGINES.map((engine) => (
                <a
                  key={engine.name}
                  className="external-search-link"
                  href={engine.url(keyword)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {engine.name}
                </a>
              ))}
            </div>
            <button className="back-btn" onClick={() => navigate('/')}>返回首页</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default SearchResults;
