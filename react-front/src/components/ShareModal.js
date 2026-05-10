import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { ReactComponent as WechatIcon } from '../icons/wechat.svg';
import { ReactComponent as WeiboIcon } from '../icons/sinaweibo.svg';
import { ReactComponent as QQIcon } from '../icons/qq.svg';
import './ShareModal.css';

const SHARE_URL = `${window.location.origin}/post/`;

function ShareModal({ post, onClose }) {
  const [qrCanvas, setQrCanvas] = useState(null);
  const [posterLoading, setPosterLoading] = useState(false);
  const [posterUrl, setPosterUrl] = useState(null);
  const [systemShareSupported, setSystemShareSupported] = useState(false);
  const [shareTab, setShareTab] = useState('qr'); // 'qr' | 'poster'
  const posterRef = useRef(null);
  const posterQrRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    setSystemShareSupported(!!navigator.share);
  }, []);

  // Auto-generate poster when switching to poster tab
  useEffect(() => {
    if (shareTab === 'poster' && !posterUrl && !posterLoading && post) {
      generatePoster();
    }
  }, [shareTab]);

  // Generate QR code on mount
  useEffect(() => {
    if (!post) return;
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, `${SHARE_URL}${post.id}`, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }, (err) => {
      if (err) console.error('QR code generation failed:', err);
    });
    setQrCanvas(canvas);
  }, [post]);

  // Generate poster QR code into the hidden poster element
  useEffect(() => {
    if (!post || !posterRef.current) return;
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, `${SHARE_URL}${post.id}`, {
      width: 120,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }, (err) => {
      if (err) console.error('Poster QR generation failed:', err);
    });
    const container = posterQrRef.current;
    if (container) {
      container.innerHTML = '';
      canvas.style.width = '80px';
      canvas.style.height = '80px';
      container.appendChild(canvas);
    }
  }, [post, posterLoading]);

  const generatePoster = useCallback(async () => {
    if (!posterRef.current || !post) return;
    setPosterLoading(true);
    try {
      // Wait for poster QR to render
      await new Promise(resolve => setTimeout(resolve, 500));
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#f8f8f8',
        logging: false,
      });
      const url = canvas.toDataURL('image/png', 1.0);
      setPosterUrl(url);
      return url;
    } catch (err) {
      console.error('Poster generation failed:', err);
    } finally {
      setPosterLoading(false);
    }
  }, [post]);

  const downloadImage = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const handleSaveQr = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      downloadImage(dataUrl, `qrcode-${post.id}.png`);
    }
  };

  const handleSavePoster = async () => {
    let url = posterUrl;
    if (!url) {
      url = await generatePoster();
    }
    if (url) {
      downloadImage(url, `poster-${post.id}.png`);
    }
  };

  const handleSystemShare = async () => {
    if (!navigator.share || !post) return;
    try {
      await navigator.share({
        title: post.title,
        text: post.desc,
        url: `${SHARE_URL}${post.id}`,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };

  const handleWeiboShare = () => {
    const url = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(`${SHARE_URL}${post.id}`)}&title=${encodeURIComponent(post.title + ' ' + post.desc)}`;
    window.open(url, '_blank', 'width=600,height=500');
  };

  const handleQQShare = () => {
    const url = `https://connect.qq.com/widgets/share.html?url=${encodeURIComponent(`${SHARE_URL}${post.id}`)}&title=${encodeURIComponent(post.title)}&desc=${encodeURIComponent(post.desc)}`;
    window.open(url, '_blank', 'width=600,height=500');
  };

  const handleWechatShare = () => {
    setShareTab('qr');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${SHARE_URL}${post.id}`);
      showToast('链接已复制到剪贴板');
    } catch {
      showToast('复制失败，请手动复制');
    }
  };

  const [toast, setToast] = useState('');
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  if (!post) return null;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3>分享此内容</h3>
          <button className="share-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="share-modal-body">
          {/* System Share */}
          {systemShareSupported && (
            <section className="share-section">
              <p className="share-section-label">系统分享</p>
              <div className="share-grid">
                <button className="share-item" onClick={handleSystemShare}>
                  <div className="share-icon system-icon">
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </div>
                  <span>系统分享</span>
                </button>
              </div>
            </section>
          )}

          {/* Social Media */}
          <section className="share-section">
            <p className="share-section-label">社交平台</p>
            <div className="share-grid">
              <button className="share-item" onClick={handleWechatShare}>
                <div className="share-icon wechat-icon">
                  <WechatIcon className="icon-svg" />
                </div>
                <span>微信</span>
              </button>

              <button className="share-item" onClick={handleWeiboShare}>
                <div className="share-icon weibo-icon">
                  <WeiboIcon className="icon-svg" />
                </div>
                <span>微博</span>
              </button>

              <button className="share-item" onClick={handleQQShare}>
                <div className="share-icon qq-icon">
                  <QQIcon className="icon-svg" />
                </div>
                <span>QQ</span>
              </button>

              <button className="share-item" onClick={handleCopyLink}>
                <div className="share-icon copy-icon">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                </div>
                <span>复制链接</span>
              </button>
            </div>
          </section>

          {/* QR Code / Poster 切换 */}
          <section className="share-section" id="qr-share-section">
            <div className="share-tabs">
              <button
                className={`share-tab ${shareTab === 'qr' ? 'active' : ''}`}
                onClick={() => setShareTab('qr')}
              >
                二维码
              </button>
              <button
                className={`share-tab ${shareTab === 'poster' ? 'active' : ''}`}
                onClick={() => setShareTab('poster')}
              >
                海报
              </button>
            </div>

            {/* QR Code */}
            {shareTab === 'qr' && (
              <div className="qr-share-box">
                <div className="qr-canvas-wrapper">
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  {qrCanvas && (
                    <img
                      src={qrCanvas.toDataURL('image/png')}
                      alt="二维码"
                      className="qr-image"
                    />
                  )}
                </div>
                <p className="qr-hint">截图后使用微信/手机浏览器扫码</p>
                <button className="share-save-btn" onClick={handleSaveQr}>
                  保存二维码
                </button>
              </div>
            )}

            {/* Poster */}
            {shareTab === 'poster' && (
              <div className="poster-share-box">
                <div className="poster-preview-box">
                  {/* Hidden poster DOM for html2canvas */}
                  <div
                    ref={posterRef}
                    className="share-poster"
                    style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}
                  >
                    <div className="poster-bg">
                      <img
                        src={`/${post.img}`}
                        alt={post.title}
                        className="poster-image"
                        crossOrigin="anonymous"
                      />
                      <div className="poster-text">
                        <h4 className="poster-title">{post.title}</h4>
                        <p className="poster-desc">{post.desc}</p>
                      </div>
                      <div className="poster-footer">
                        <div className="poster-qr" ref={posterQrRef} />
                        <div className="poster-footer-text">
                          <span className="poster-footer-hint">长按识别</span>
                          <span className="poster-footer-brand">吃瓜点评</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {posterLoading && (
                    <div className="poster-loading">
                      <div className="poster-spinner" />
                      <span>海报生成中...</span>
                    </div>
                  )}
                  {posterUrl && !posterLoading && (
                    <img src={posterUrl} alt="海报预览" className="poster-preview-img" />
                  )}
                  {!posterLoading && !posterUrl && (
                    <div className="poster-placeholder">
                      <span className="poster-placeholder-icon">🖼️</span>
                      <span className="poster-placeholder-text">海报生成中...</span>
                    </div>
                  )}
                </div>
                <div className="poster-actions">
                  <button
                    className="share-save-btn"
                    onClick={handleSavePoster}
                    disabled={posterLoading}
                  >
                    {posterLoading ? '生成中...' : '保存海报'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="share-toast">{toast}</div>}
    </div>
  );
}

export default ShareModal;
