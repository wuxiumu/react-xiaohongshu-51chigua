import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../api';
import './AdminLogin.css';

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('请输入账号和密码');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await adminLogin({
        username,
        password,
        nickname
      });

      if (response.data.code === 0) {
        // 保存 token
        localStorage.setItem('admin_token', response.data.data.token);
        localStorage.setItem('admin_username', response.data.data.username);
        localStorage.setItem('admin_nickname', response.data.data.nickname);
        
        // 跳转到管理后台
        navigate('/admin/dashboard');
      } else {
        setError(response.data.msg || '登录失败');
      }
    } catch (err) {
      console.error('登录失败:', err);
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-box">
          <div className="admin-login-header">
            <span className="admin-icon">🔐</span>
            <h1>管理员登录</h1>
            <p>请输入管理员账号和密码</p>
          </div>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}
            
            <div className="form-group">
              <label>
                <span className="label-icon">👤</span>
                账号
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入管理员账号"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon">🔑</span>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon">🏷️</span>
                昵称（选填）
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="自定义显示昵称"
                disabled={loading}
              />
            </div>

            <div className="login-hint">
              <p>默认账号: <strong>admin</strong></p>
              <p>默认密码: <strong>admin123</strong></p>
            </div>

            <button
              type="submit"
              className="admin-login-btn"
              disabled={loading}
            >
              {loading ? '登录中...' : '进入管理后台'}
            </button>

            <button
              type="button"
              className="back-home-btn"
              onClick={() => navigate('/')}
            >
              ← 返回首页
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
