import React, { useState, useRef } from 'react';
import './PublishModal.css';
import { getRandomNickname } from '../api';

function PublishModal({ isOpen, onClose, onPublish }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [username, setUsername] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 15MB 限制
      if (file.size > 15 * 1024 * 1024) {
        setError('图片大小不能超过15MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('只支持 JPG、PNG、GIF、WebP 格式');
        return;
      }
      
      setSelectedImage(file);
      setError('');
      
      // 预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateRandomNickname = async () => {
    try {
      const response = await getRandomNickname();
      if (response.data.code === 0) {
        setUsername(response.data.nickname);
      }
    } catch (err) {
      const backupNames = ['吃瓜群众', '热心网友', '匿名用户', '神秘人'];
      setUsername(backupNames[Math.floor(Math.random() * backupNames.length)]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setError('请选择一张图片');
      return;
    }
    
    if (!title.trim()) {
      setError('请输入标题');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('title', title.trim());
      formData.append('desc', desc.trim() || '高清美女吃瓜日常点评');
      formData.append('username', isAnonymous && username.trim() ? username.trim() : (username.trim() || '匿名用户'));
      
      const result = await onPublish(formData);
      if (result.success) {
        // 重置表单
        setTitle('');
        setDesc('');
        setSelectedImage(null);
        setImagePreview(null);
        setUsername('');
        onClose();
      } else {
        setError(result.message || '发布失败');
      }
    } catch (err) {
      setError('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="publish-modal-overlay" onClick={handleClose}>
      <div className="publish-modal" onClick={(e) => e.stopPropagation()}>
        <div className="publish-modal-header">
          <h2>✨ 发布美图</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="publish-form">
          {/* 图片上传 */}
          <div className="image-upload-section">
            <label className="upload-label">
              {imagePreview ? (
                <div className="image-preview-wrapper">
                  <img src={imagePreview} alt="预览" className="image-preview" />
                  <div className="image-preview-overlay">
                    <span>点击更换图片</span>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <span className="upload-text">点击选择图片</span>
                  <span className="upload-hint">支持 JPG、PNG、GIF、WebP</span>
                  <span className="upload-hint">最大 10MB</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                className="file-input"
              />
            </label>
          </div>
          
          {/* 标题 */}
          <div className="form-group">
            <label>标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给图片起个吸引人的标题"
              maxLength={50}
              required
            />
            <span className="char-count">{title.length}/50</span>
          </div>
          
          {/* 描述 */}
          <div className="form-group">
            <label>描述</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="添加描述（可选）"
              maxLength={200}
              rows={3}
            />
            <span className="char-count">{desc.length}/200</span>
          </div>
          
          {/* 作者信息 */}
          <div className="form-group author-section">
            <div className="anonymous-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <span>匿名发布</span>
              </label>
              {isAnonymous && (
                <button 
                  type="button"
                  className="random-btn"
                  onClick={generateRandomNickname}
                >
                  🎲 随机昵称
                </button>
              )}
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isAnonymous ? "点击随机昵称按钮" : "你的昵称（可选）"}
              className="username-input"
            />
          </div>
          
          {/* 错误提示 */}
          {error && <div className="error-message">{error}</div>}
          
          {/* 提交按钮 */}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleClose} disabled={loading}>
              取消
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '发布中...' : '🚀 立即发布'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PublishModal;
