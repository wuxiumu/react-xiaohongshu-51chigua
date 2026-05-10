import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './AdminCommentEditModal.css';

function AdminCommentEditModal({ comment, postTitle, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('edit');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (comment) {
      setContent(comment.content || '');
      setActiveTab('edit');
    }
  }, [comment]);

  const handleSave = async () => {
    if (!content.trim()) {
      alert('评论内容不能为空');
      return;
    }
    try {
      setSaving(true);
      await onSave(comment.post_id, comment.id, content.trim());
    } catch (err) {
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (!comment) return null;

  const postUrl = `${window.location.origin}/post/${comment.post_id}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(postUrl).then(() => {
      alert('帖子 URL 已复制');
    }).catch(() => {
      prompt('复制以下 URL：', postUrl);
    });
  };

  return (
    <div className="comment-modal-overlay" onClick={onClose}>
      <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="comment-modal-header">
          <h3>编辑评论</h3>
          <button className="comment-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="comment-modal-body">
          <div className="comment-meta-row">
            <div className="comment-meta-item">
              <span className="comment-meta-label">评论者：</span>
              <span className="comment-meta-value">{comment.username}</span>
            </div>
            <div className="comment-meta-item">
              <span className="comment-meta-label">时间：</span>
              <span className="comment-meta-value">{comment.time}</span>
            </div>
            {comment.reply_to && (
              <div className="comment-meta-item">
                <span className="comment-meta-label">回复：</span>
                <span className="comment-meta-value">@{comment.reply_to}</span>
              </div>
            )}
          </div>

          {postTitle && (
            <div className="comment-meta-item">
              <span className="comment-meta-label">帖子：</span>
              <span className="comment-meta-value">{postTitle}</span>
            </div>
          )}

          <div className="comment-field">
            <label>评论 URL</label>
            <div className="comment-field-row">
              <input
                type="text"
                className="comment-field-input comment-field-input-expand"
                value={postUrl}
                readOnly
                onClick={e => e.target.select()}
              />
              <button className="copy-url-btn" onClick={handleCopyUrl}>
                📋 复制
              </button>
            </div>
          </div>

          <div className="comment-field comment-field-content">
            <label>评论内容（支持 Markdown）</label>
            <div className="comment-editor-wrapper">
              <div className="comment-editor-tabs">
                <button
                  className={`comment-editor-tab ${activeTab === 'edit' ? 'active' : ''}`}
                  onClick={() => setActiveTab('edit')}
                >
                  编辑
                </button>
                <button
                  className={`comment-editor-tab ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  预览
                </button>
              </div>

              {activeTab === 'edit' && (
                <textarea
                  className="comment-editor-textarea"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="输入评论内容，支持 Markdown 格式..."
                  spellCheck={false}
                />
              )}

              {activeTab === 'preview' && (
                <div className="comment-editor-preview">
                  {content.trim() ? (
                    <ReactMarkdown>{content}</ReactMarkdown>
                  ) : (
                    <div className="preview-empty">暂无内容</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="comment-modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>
            取消
          </button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminCommentEditModal;
