import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './PostDetail.css';
import { getPosts, getCommentList, addComment, getRandomNickname, likePost, sharePost, getRandomPosts, getPostStats } from '../api';
import ShareModal from './ShareModal';

function PostDetail() {
  const { id: postId } = useParams();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [username, setUsername] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(() => {
    return localStorage.getItem('comment-anonymous') === 'true';
  });
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingNickname, setGeneratingNickname] = useState(false);
  const [postStats, setPostStats] = useState({ likeCount: 0, shareCount: 0, isLiked: false });
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [expandedContent, setExpandedContent] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendOffset, setRecommendOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  const commentsEndRef = useRef(null);

  // 持久化匿名开关状态
  useEffect(() => {
    localStorage.setItem('comment-anonymous', String(isAnonymous));
  }, [isAnonymous]);

  // 匿名模式：自动生成随机昵称；非匿名模式：加载已保存的昵称
  useEffect(() => {
    if (isAnonymous) {
      generateRandomNickname();
    } else {
      const savedName = localStorage.getItem('comment-username');
      if (savedName) setUsername(savedName);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnonymous]);

  // 非匿名模式下保存昵称
  useEffect(() => {
    if (!isAnonymous && username.trim()) {
      localStorage.setItem('comment-username', username.trim());
    }
  }, [username, isAnonymous]);

  useEffect(() => {
    if (postId) {
      fetchPost();
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [postId]);

  useEffect(() => {
    if (post) {
      fetchComments();
      fetchPostStats();
      fetchRecommendations(0);
    }
  }, [post]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !recommendLoading && hasMore) {
          fetchRecommendations(recommendOffset);
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendLoading, hasMore, recommendOffset]);

  const fetchPost = async () => {
    try {
      setPostLoading(true);
      const response = await getPosts();
      if (response.data.code === 0) {
        const foundPost = response.data.list.find(p => p.id === postId);
        if (foundPost) {
          setPost(foundPost);
        } else {
          setError('帖子不存在');
        }
      }
    } catch (err) {
      console.error('获取帖子失败:', err);
      setError('获取帖子失败');
    } finally {
      setPostLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await getCommentList(postId);
      if (response.data.code === 0) {
        setComments(response.data.list || []);
      }
    } catch (err) {
      console.error('获取评论失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostStats = async () => {
    try {
      const response = await getPostStats(postId);
      if (response.data.code === 0) {
        setPostStats({
          likeCount: response.data.like_count || 0,
          shareCount: response.data.share_count || 0,
          isLiked: response.data.is_liked || false
        });
      }
    } catch (err) {
      console.error('获取帖子统计失败:', err);
    }
  };

  const fetchRecommendations = async (offset) => {
    if (recommendLoading || !hasMore) return;
    try {
      setRecommendLoading(true);
      const response = await getRandomPosts({
        offset: offset || 0,
        limit: 8,
        exclude_id: postId
      });
      if (response.data.code === 0) {
        const newPosts = response.data.list || [];
        setRecommendedPosts(prev => [...prev, ...newPosts]);
        setRecommendOffset((offset || 0) + newPosts.length);
        setHasMore(response.data.has_more !== false || newPosts.length > 0);
      }
    } catch (err) {
      console.error('获取推荐失败:', err);
    } finally {
      setRecommendLoading(false);
    }
  };

  const generateRandomNickname = async () => {
    try {
      const response = await getRandomNickname();
      if (response.data.code === 0) {
        setUsername(response.data.nickname);
      }
    } catch (err) {
      console.error('获取随机昵称失败:', err);
      const backupNames = ['吃瓜群众', '热心网友', '匿名用户', '神秘人', '路过打酱油'];
      setUsername(backupNames[Math.floor(Math.random() * backupNames.length)]);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      const name = isAnonymous && username.trim() 
        ? username.trim() 
        : (username.trim() || '匿名用户');
      
      const data = {
        post_id: postId,
        content: commentText.trim(),
        username: name
      };

      if (replyTo) {
        data.parent_id = replyTo.commentId;
        data.reply_to = replyTo.username;
      }
      
      await addComment(data);
      
      setCommentText('');
      if (isAnonymous) {
        generateRandomNickname();
      }
      setReplyTo(null);
      await fetchComments();
    } catch (err) {
      console.error('提交评论失败:', err);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment, parentComment = null) => {
    const level = parentComment ? 2 : 1;
    setReplyTo({
      commentId: parentComment ? parentComment.id : comment.id,
      username: comment.username,
      level: level,
      isReplyToReply: !!parentComment
    });
    document.querySelector('.comment-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const toggleExpandReplies = (commentId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const toggleExpandContent = (commentId) => {
    setExpandedContent(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleLike = async () => {
    try {
      const action = postStats.isLiked ? 'unlike' : 'like';
      const response = await likePost(postId, action);
      if (response.data.code === 0) {
        setPostStats(prev => ({
          ...prev,
          likeCount: response.data.count,
          isLiked: response.data.liked
        }));
      }
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  const handleShare = async () => {
    try {
      const response = await sharePost(postId);
      if (response.data.code === 0) {
        setPostStats(prev => ({
          ...prev,
          shareCount: response.data.count || prev.shareCount + 1
        }));
      }
    } catch (err) {
      console.error('转发计数失败:', err);
    }
    setShowShareModal(true);
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleRecommendClick = (recommendedPost) => {
    navigate(`/post/${recommendedPost.id}`);
  };

  const renderComment = (comment, level = 1, parentComment = null) => {
    const hasChildren = comment.children && comment.children.length > 0;
    const isExpanded = expandedComments.has(comment.id);
    const isReplying = replyTo && replyTo.commentId === (parentComment ? parentComment.id : comment.id);
    
    return (
      <div key={comment.id} className={`comment-item level-${level}`}>
        <div className="comment-header">
          <div className="comment-avatar">
            {comment.username.charAt(0)}
          </div>
          <div className="comment-user-info">
            <span className="comment-username">{comment.username}</span>
            <span className="comment-time">{comment.time}</span>
          </div>
        </div>
        
        <div className="comment-content-wrapper">
          {comment.reply_to && level > 1 && (
            <span className="reply-to-user">回复 <span className="reply-target">@{comment.reply_to}</span>：</span>
          )}
          <div className={`comment-content ${!expandedContent[comment.id] ? 'comment-collapsed' : ''}`}>
            <ReactMarkdown>{comment.content}</ReactMarkdown>
          </div>
          {comment.content.length > 100 && (
            <button
              className="expand-content-btn"
              onClick={() => toggleExpandContent(comment.id)}
            >
              {expandedContent[comment.id] ? '收起' : '展开'}
            </button>
          )}
        </div>

        <div className="comment-actions">
          <button
            className={`action-btn-small ${isReplying ? 'active' : ''}`}
            onClick={() => isReplying ? cancelReply() : handleReply(comment, parentComment)}
          >
            {isReplying ? '取消回复' : '回复'}
          </button>
          <span className="action-divider">·</span>
          <span className="comment-location">{level === 1 ? '热评' : ''}</span>
        </div>

        {hasChildren && (
          <div className="comment-children">
            {level === 1 && comment.children.length > 2 && !isExpanded ? (
              <>
                {comment.children.slice(0, 2).map(child => 
                  renderComment(child, level + 1, comment)
                )}
                <button 
                  className="expand-replies-btn"
                  onClick={() => toggleExpandReplies(comment.id)}
                >
                  展开 {comment.children.length - 2} 条回复
                </button>
              </>
            ) : (
              <>
                {comment.children.map(child => 
                  renderComment(child, level + 1, comment)
                )}
                {level === 1 && isExpanded && (
                  <button 
                    className="collapse-replies-btn"
                    onClick={() => toggleExpandReplies(comment.id)}
                  >
                    收起回复
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (postLoading) {
    return (
      <div className="detail-page-wrapper">
        <div className="detail-sub-header">
          <div className="detail-sub-header-content">
            <button className="detail-back-btn" onClick={handleBack}>← 返回列表</button>
          </div>
        </div>
        <div className="loading-container">加载中...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="detail-page-wrapper">
        <div className="detail-sub-header">
          <div className="detail-sub-header-content">
            <button className="detail-back-btn" onClick={handleBack}>← 返回列表</button>
          </div>
        </div>
        <div className="error-container">{error || '帖子不存在'}</div>
      </div>
    );
  }

  return (
    <div className="detail-page-wrapper">
      {/* 返回按钮区域（在全局导航下方） */}
      <div className="detail-sub-header">
        <div className="detail-sub-header-content">
          <button className="detail-back-btn" onClick={handleBack}>
            ← 返回列表
          </button>
          <span className="detail-breadcrumb">首页 / {post.title}</span>
        </div>
      </div>

      <div className="detail-content-wrapper">
        <div className="detail-image-section">
          <img 
            src={`/${post.img}`} 
            alt={post.title}
            className="detail-image"
          />
          <div className="detail-info">
            <h1 className="detail-image-title">{post.title}</h1>
            <div className="detail-desc"><ReactMarkdown>{post.desc}</ReactMarkdown></div>
            <div className="detail-meta">
              <span className="detail-author">{post.username || '管理员'}</span>
              <span className="detail-time">发布时间: {post.create_time}</span>
            </div>
            
            <div className="detail-actions">
              <button 
                className={`detail-action-btn ${postStats.isLiked ? 'liked' : ''}`}
                onClick={handleLike}
              >
                <span className="action-icon">{postStats.isLiked ? '❤️' : '🤍'}</span>
                <span className="action-text">点赞</span>
                <span className="action-count">{postStats.likeCount || 0}</span>
              </button>
              <button 
                className="detail-action-btn"
                onClick={handleShare}
              >
                <span className="action-icon">📤</span>
                <span className="action-text">转发</span>
                <span className="action-count">{postStats.shareCount || 0}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="comments-section">
          <h3 className="comments-title">
            评论 {comments.length > 0 && <span className="comments-count">({comments.length})</span>}
          </h3>

          <div className="comment-form">
            <div className="anonymous-option">
              <span className="anonymous-label-text">匿名评论</span>
              <div
                className={`anonymous-switch ${isAnonymous ? 'on' : 'off'}`}
                onClick={() => setIsAnonymous(!isAnonymous)}
              >
                <div className="anonymous-switch-thumb" />
              </div>
            </div>

            <div className="nickname-row">
              <input
                type="text"
                placeholder={isAnonymous ? "匿名模式" : "你的昵称（可选）"}
                value={username}
                readOnly={isAnonymous}
                onChange={(e) => setUsername(e.target.value)}
                className={`username-input ${isAnonymous ? 'username-readonly' : ''}`}
              />
              {isAnonymous && (
                <button
                  className="random-nickname-btn"
                  onClick={generateRandomNickname}
                >
                  🎲 换一个
                </button>
              )}
            </div>

            {replyTo && (
              <div className="replying-to">
                <span>回复 <strong>@{replyTo.username}</strong></span>
                <button className="cancel-reply-btn" onClick={cancelReply}>×</button>
              </div>
            )}

            <div className="comment-input-wrapper">
              <textarea
                placeholder={replyTo ? `回复 @${replyTo.username}：` : "写下你的评论... 支持 **加粗**、`代码`、[链接](url) 等 Markdown 格式"}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="comment-textarea"
                rows={3}
              />
              <div className="comment-input-bar">
                <span className="comment-hint">友善评论，理性发言</span>
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submitting}
                  className={`submit-btn ${commentText.trim() ? 'active' : ''}`}
                >
                  {submitting ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
          </div>

          <div className="comments-list">
            {loading ? (
              <div className="loading-text">加载评论中...</div>
            ) : comments.length === 0 ? (
              <div className="empty-text">
                <div className="empty-icon">💬</div>
                <p>暂无评论，快来抢沙发吧！</p>
              </div>
            ) : (
              <div className="comments-tree">
                {comments.map(comment => renderComment(comment))}
              </div>
            )}
            <div ref={commentsEndRef} />
          </div>
        </div>
      </div>

      {/* 相关推荐 */}
      <div className="recommend-section">
        <h3 className="recommend-title">相关推荐</h3>
        <div className="recommend-grid">
          {recommendedPosts.map((item, index) => (
            <div
              key={item.id + '-' + index}
              className="recommend-card"
              onClick={() => handleRecommendClick(item)}
            >
              <div className="recommend-card-img">
                <img src={`/${item.img}`} alt={item.title} loading="lazy" />
              </div>
              <div className="recommend-card-info">
                <h4 className="recommend-card-title">{item.title}</h4>
                <p className="recommend-card-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div ref={sentinelRef} className="recommend-sentinel" />
        {recommendLoading && (
          <div className="recommend-loading">加载中...</div>
        )}
        {!hasMore && recommendedPosts.length > 0 && (
          <div className="recommend-end">没有更多内容了</div>
        )}
      </div>

      {showShareModal && (
        <ShareModal post={post} onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}

export default PostDetail;
