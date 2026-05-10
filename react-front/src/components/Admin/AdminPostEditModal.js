import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { getRandomNickname } from '../../api';
import './AdminPostEditModal.css';

function AdminPostEditModal({ post, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('edit');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [username, setUsername] = useState('');
  const [createTime, setCreateTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [genNicknameLoading, setGenNicknameLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setDesc(post.desc || '');
      setUsername(post.username || '');
      setCreateTime(post.create_time || '');
      setActiveTab('edit');
    }
  }, [post]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('标题不能为空');
      return;
    }
    try {
      setSaving(true);
      await onSave(post.id, {
        title: title.trim(),
        desc: desc.trim(),
        username: username.trim(),
        create_time: createTime
      });
    } catch (err) {
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleRandomNickname = async () => {
    try {
      setGenNicknameLoading(true);
      const response = await getRandomNickname();
      if (response.data.code === 0) {
        setUsername(response.data.nickname);
      }
    } catch (err) {
      const backupNames = ['吃瓜群众', '热心网友', '匿名用户', '神秘人', '路过打酱油'];
      setUsername(backupNames[Math.floor(Math.random() * backupNames.length)]);
    } finally {
      setGenNicknameLoading(false);
    }
  };

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('帖子 URL 已复制');
    }).catch(() => {
      prompt('复制以下 URL：', url);
    });
  };

  const toolbarButtons = [
    { label: 'B', title: '粗体', insert: '**', after: '**' },
    { label: 'I', title: '斜体', insert: '_', after: '_' },
    { label: 'H1', title: '一级标题', insert: '# ', after: '' },
    { label: 'H2', title: '二级标题', insert: '## ', after: '' },
    { label: 'H3', title: '三级标题', insert: '### ', after: '' },
    { label: '[ ]', title: '链接', insert: '[', after: '](url)' },
    { label: 'Img', title: '图片', insert: '![alt](', after: ')' },
    { label: '`', title: '行内代码', insert: '`', after: '`' },
    { label: '```', title: '代码块', insert: '\n```\n', after: '\n```\n' },
    { label: 'Quote', title: '引用', insert: '> ', after: '' },
    { label: 'List', title: '无序列表', insert: '- ', after: '' },
    { label: '1.', title: '有序列表', insert: '1. ', after: '' },
    { label: '---', title: '分割线', insert: '\n---\n', after: '' },
  ];

  const insertText = (btn) => {
    const textarea = document.querySelector('.editor-textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    let newValue, cursorPos;
    if (selected) {
      newValue = before + btn.insert + selected + btn.after + after;
      cursorPos = start + btn.insert.length + selected.length;
    } else {
      newValue = before + btn.insert + btn.after + after;
      cursorPos = start + btn.insert.length;
    }

    setDesc(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  if (!post) return null;

  const postUrl = `${window.location.origin}/post/${post.id}`;

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-modal-header">
          <h3>编辑帖子</h3>
          <button className="edit-modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="edit-modal-body">
          {/* 标题输入 */}
          <div className="edit-field">
            <label>标题</label>
            <input
              type="text"
              className="edit-field-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={80}
              placeholder="输入标题..."
            />
          </div>

          {/* 作者 + 随机昵称 */}
          <div className="edit-field">
            <label>作者</label>
            <div className="edit-field-row">
              <input
                type="text"
                className="edit-field-input edit-field-input-expand"
                value={username}
                onChange={e => setUsername(e.target.value)}
                maxLength={30}
                placeholder="输入作者昵称..."
              />
              <button
                className="random-nickname-btn"
                onClick={handleRandomNickname}
                disabled={genNicknameLoading}
              >
                {genNicknameLoading ? '...' : '🎲 随机'}
              </button>
            </div>
          </div>

          {/* 创建时间 */}
          <div className="edit-field">
            <label>发布时间</label>
            <input
              type="datetime-local"
              className="edit-field-input"
              value={createTime ? createTime.replace(' ', 'T').substring(0, 16) : ''}
              onChange={e => {
                const val = e.target.value;
                setCreateTime(val ? val.replace('T', ' ') + ':00' : '');
              }}
            />
          </div>

          {/* 帖子 URL */}
          <div className="edit-field">
            <label>帖子 URL</label>
            <div className="edit-field-row">
              <a
                href={postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="edit-field-url"
              >
                {postUrl}
              </a>
              <button className="copy-url-btn" onClick={handleCopyUrl}>
                📋 复制
              </button>
            </div>
          </div>

          {/* 描述 / Markdown 编辑器 */}
          <div className="edit-field edit-field-desc">
            <label>描述（支持 Markdown）</label>
            <div className="editor-wrapper">
              {/* Tab 切换 */}
              <div className="editor-tabs">
                <button
                  className={`editor-tab ${activeTab === 'edit' ? 'active' : ''}`}
                  onClick={() => setActiveTab('edit')}
                >
                  编辑
                </button>
                <button
                  className={`editor-tab ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  预览
                </button>
              </div>

              {/* 工具栏 - 仅编辑模式显示 */}
              {activeTab === 'edit' && (
                <div className="editor-toolbar">
                  {toolbarButtons.map((btn, i) => (
                    <button
                      key={i}
                      className="toolbar-btn"
                      title={btn.title}
                      onClick={() => insertText(btn)}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}

              {/* 编辑区域 */}
              {activeTab === 'edit' && (
                <textarea
                  className="editor-textarea"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="输入描述内容，支持 Markdown 格式..."
                  spellCheck={false}
                />
              )}

              {/* 预览区域 */}
              {activeTab === 'preview' && (
                <div className="editor-preview">
                  {desc.trim() ? (
                    <ReactMarkdown>{desc}</ReactMarkdown>
                  ) : (
                    <div className="preview-empty">暂无内容</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="edit-modal-footer">
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

export default AdminPostEditModal;
