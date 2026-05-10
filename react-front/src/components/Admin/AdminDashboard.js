import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetPosts, adminDeletePost, adminUpdatePost, adminGetComments, adminUpdateComment, adminDeleteComment } from '../../api';
import AdminPostEditModal from './AdminPostEditModal';
import AdminCommentEditModal from './AdminCommentEditModal';
import './AdminDashboard.css';

const PAGE_SIZE = 20;

const getPageNumbers = (currentPage, totalPages) => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
};

const PaginationBar = React.memo(({ currentPage, totalPages, total, onPageChange, label }) => {
  if (totalPages <= 1) return null;
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="pagination-bar">
      <span className="pagination-info">
        共 {total} 条{label}，第 {currentPage}/{totalPages} 页
      </span>
      <div className="pagination-controls">
        <button
          className="page-btn"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          ««
        </button>
        <button
          className="page-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ‹
        </button>
        {pageNumbers.map(p => (
          <button
            key={p}
            className={`page-btn ${p === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className="page-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          ›
        </button>
        <button
          className="page-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          »»
        </button>
      </div>
    </div>
  );
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts'); // posts, comments
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nickname, setNickname] = useState('管理员');

  // 分页状态
  const [postPage, setPostPage] = useState(1);
  const [commentPage, setCommentPage] = useState(1);
  const [postTotal, setPostTotal] = useState(0);
  const [commentTotal, setCommentTotal] = useState(0);
  const [postTotalPages, setPostTotalPages] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);

  // 帖子编辑弹窗
  const [editingPost, setEditingPost] = useState(null);
  const [saving, setSaving] = useState(false);

  // 评论编辑弹窗
  const [editingComment, setEditingComment] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const savedNickname = localStorage.getItem('admin_nickname');
    if (!token) {
      navigate('/admin');
      return;
    }
    if (savedNickname) {
      setNickname(savedNickname);
    }

    fetchPosts();
  }, [navigate]);

  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminGetPosts({ page, page_size: PAGE_SIZE });
      if (response.data.code === 0) {
        setPosts(response.data.list || []);
        setPostTotal(response.data.total || 0);
        setPostPage(response.data.page || page);
        setPostTotalPages(response.data.total_pages || 1);
      } else if (response.data.code === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('获取帖子失败:', err);
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (page = 1) => {
    try {
      setLoading(true);
      const response = await adminGetComments({ page, page_size: PAGE_SIZE });
      if (response.data.code === 0) {
        setComments(response.data.list || []);
        setCommentTotal(response.data.total || 0);
        setCommentPage(response.data.page || page);
        setCommentTotalPages(response.data.total_pages || 1);
      } else if (response.data.code === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error('获取评论失败:', err);
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('确定要删除这个帖子吗？此操作不可恢复！')) {
      return;
    }

    try {
      const response = await adminDeletePost(postId);
      if (response.data.code === 0) {
        if (posts.length === 1 && postPage > 1) {
          fetchPosts(postPage - 1);
        } else {
          fetchPosts(postPage);
        }
      } else {
        alert(response.data.msg || '删除失败');
      }
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
    }
  };

  // 帖子编辑：打开弹窗
  const handleOpenEditModal = (post) => {
    setEditingPost(post);
  };

  const handleSavePost = async (postId, data) => {
    try {
      setSaving(true);
      const response = await adminUpdatePost(postId, data);
      if (response.data.code === 0) {
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, ...data } : p
        ));
        setEditingPost(null);
      } else {
        alert(response.data.msg || '保存失败');
      }
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      const response = await adminDeleteComment(postId, commentId);
      if (response.data.code === 0) {
        if (comments.length === 1 && commentPage > 1) {
          fetchComments(commentPage - 1);
        } else {
          fetchComments(commentPage);
        }
      } else {
        alert(response.data.msg || '删除失败');
      }
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
    }
  };

  const handleSaveCommentEdit = async (postId, commentId, content) => {
    try {
      setSaving(true);
      const response = await adminUpdateComment(postId, commentId, content);
      if (response.data.code === 0) {
        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, content } : c
        ));
        setEditingComment(null);
      } else {
        alert(response.data.msg || '保存失败');
      }
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_nickname');
    navigate('/admin');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setEditingPost(null);
    setEditingComment(null);
    if (tab === 'posts') {
      fetchPosts(postPage);
    } else {
      fetchComments(commentPage);
    }
  };

  const handlePostPageChange = (page) => {
    if (page < 1 || page > postTotalPages || page === postPage) return;
    setPostPage(page);
    fetchPosts(page);
  };

  const handleCommentPageChange = (page) => {
    if (page < 1 || page > commentTotalPages || page === commentPage) return;
    setCommentPage(page);
    fetchComments(page);
  };

  return (
    <div className="admin-dashboard">
      {/* 侧边栏 */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-icon">🔐</span>
          <span className="brand-text">管理后台</span>
        </div>

        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => handleTabChange('posts')}
          >
            <span className="nav-icon">📷</span>
            帖子管理
          </button>
          <button
            className={`nav-item ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => handleTabChange('comments')}
          >
            <span className="nav-icon">💬</span>
            评论管理
          </button>
        </nav>

        <div className="admin-user">
          <div className="user-info">
            <span className="user-avatar">👤</span>
            <span className="user-name">{nickname}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="admin-content">
        <header className="admin-header">
          <h1>{activeTab === 'posts' ? '帖子管理' : '评论管理'}</h1>
          <div className="admin-stats">
            <div className="stat-card">
              <span className="stat-value">{postTotal}</span>
              <span className="stat-label">帖子总数</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{commentTotal}</span>
              <span className="stat-label">评论总数</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="admin-loading">加载中...</div>
        ) : error ? (
          <div className="admin-error">{error}</div>
        ) : activeTab === 'posts' ? (
          <>
            <PaginationBar
              currentPage={postPage}
              totalPages={postTotalPages}
              total={postTotal}
              onPageChange={handlePostPageChange}
              label="帖子"
            />
            <div className="posts-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="col-thumb">图片</th>
                    <th className="col-id">ID</th>
                    <th className="col-title">标题</th>
                    <th className="col-desc">描述</th>
                    <th className="col-author">作者</th>
                    <th className="col-time">发布时间</th>
                    <th className="col-num">点赞</th>
                    <th className="col-num">评论</th>
                    <th className="col-num">分享</th>
                    <th className="col-actions">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post.id}>
                      <td>
                        <img src={`/${post.img}`} alt={post.title} className="table-thumb" />
                      </td>
                      <td className="post-id">{post.id.substring(0, 8)}...</td>
                      <td className="cell-title">{post.title}</td>
                      <td className="cell-desc">{post.desc}</td>
                      <td className="post-author">{post.username || '管理员'}</td>
                      <td className="cell-time">{post.create_time}</td>
                      <td className="cell-num">{post.like_count || 0}</td>
                      <td className="cell-num">{post.comment_count || 0}</td>
                      <td className="cell-num">{post.share_count || 0}</td>
                      <td className="actions">
                        <button
                          className="action-btn edit"
                          onClick={() => handleOpenEditModal(post)}
                        >
                          编辑
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {posts.length === 0 && <div className="no-data">暂无帖子</div>}
            </div>
          </>
        ) : (
          <>
            <PaginationBar
              currentPage={commentPage}
              totalPages={commentTotalPages}
              total={commentTotal}
              onPageChange={handleCommentPageChange}
              label="评论"
            />
            <div className="comments-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="col-id">ID</th>
                    <th className="col-user">用户</th>
                    <th className="col-content">内容</th>
                    <th className="col-time">时间</th>
                    <th className="col-actions">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map(comment => (
                    <tr key={comment.id}>
                      <td className="comment-id">{comment.id.substring(0, 8)}...</td>
                      <td>{comment.username}</td>
                      <td className="comment-content-cell">
                        <div className="comment-text">{comment.content}</div>
                      </td>
                      <td>{comment.time}</td>
                      <td className="actions">
                        <button
                          className="action-btn edit"
                          onClick={() => setEditingComment(comment)}
                        >
                          编辑
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteComment(comment.post_id, comment.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {comments.length === 0 && <div className="no-data">暂无评论</div>}
            </div>
          </>
        )}
      </main>

      {/* 帖子编辑弹窗 */}
      {editingPost && (
        <AdminPostEditModal
          post={editingPost}
          onSave={handleSavePost}
          onClose={() => setEditingPost(null)}
        />
      )}

      {/* 评论编辑弹窗 */}
      {editingComment && (
        <AdminCommentEditModal
          comment={editingComment}
          postTitle={posts.find(p => p.id === editingComment.post_id)?.title}
          onSave={handleSaveCommentEdit}
          onClose={() => setEditingComment(null)}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
