import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetPosts, adminDeletePost, adminGetComments, adminUpdateComment, adminDeleteComment } from '../../api';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts'); // posts, comments
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nickname, setNickname] = useState('管理员');
  
  // 编辑状态
  const [editingPost, setEditingPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    // 检查登录状态
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

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await adminGetPosts();
      if (response.data.code === 0) {
        setPosts(response.data.list || []);
      } else if (response.data.code === 401) {
        // Token 过期
        handleLogout();
      }
    } catch (err) {
      console.error('获取帖子失败:', err);
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await adminGetComments();
      if (response.data.code === 0) {
        setComments(response.data.list || []);
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
        setPosts(posts.filter(p => p.id !== postId));
        alert('删除成功');
      } else {
        alert(response.data.msg || '删除失败');
      }
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }
    
    try {
      const response = await adminDeleteComment(postId, commentId);
      if (response.data.code === 0) {
        setComments(comments.filter(c => c.id !== commentId));
        alert('删除成功');
      } else {
        alert(response.data.msg || '删除失败');
      }
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
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
    if (tab === 'posts') {
      fetchPosts();
    } else {
      fetchComments();
    }
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
              <span className="stat-value">{posts.length}</span>
              <span className="stat-label">帖子总数</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{comments.length}</span>
              <span className="stat-label">评论总数</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="admin-loading">加载中...</div>
        ) : error ? (
          <div className="admin-error">{error}</div>
        ) : activeTab === 'posts' ? (
          <div className="posts-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>图片</th>
                  <th>ID</th>
                  <th>标题</th>
                  <th>点赞</th>
                  <th>评论</th>
                  <th>分享</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id}>
                    <td>
                      <img src={`/${post.img}`} alt={post.title} className="table-thumb" />
                    </td>
                    <td className="post-id">{post.id.substring(0, 8)}...</td>
                    <td>{post.title}</td>
                    <td>{post.like_count || 0}</td>
                    <td>{post.comment_count || 0}</td>
                    <td>{post.share_count || 0}</td>
                    <td className="actions">
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
        ) : (
          <div className="comments-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户</th>
                  <th>内容</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {comments.map(comment => (
                  <tr key={comment.id}>
                    <td className="comment-id">{comment.id.substring(0, 8)}...</td>
                    <td>{comment.username}</td>
                    <td className="comment-content-cell">
                      {editingComment === comment.id ? (
                        <div className="edit-form">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                          />
                        </div>
                      ) : (
                        <div className="comment-text">{comment.content}</div>
                      )}
                    </td>
                    <td>{comment.time}</td>
                    <td className="actions">
                      {editingComment === comment.id ? (
                        <>
                          <button className="action-btn save">保存</button>
                          <button 
                            className="action-btn cancel"
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent('');
                            }}
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="action-btn edit"
                            onClick={() => {
                              setEditingComment(comment.id);
                              setEditContent(comment.content);
                            }}
                          >
                            编辑
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteComment(comment.post_id, comment.id)}
                          >
                            删除
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {comments.length === 0 && <div className="no-data">暂无评论</div>}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
