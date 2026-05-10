import axios from 'axios';

// 根据环境判断使用哪个地址
const isDev = process.env.NODE_ENV === 'development';
const baseUrl = isDev 
  ? 'http://localhost:8000/php-api'  // 开发环境
  : '/php-api';                      // 生产环境 - 使用相对路径

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 获取管理员 Token
const getAdminToken = () => localStorage.getItem('admin_token');

// 创建带认证头的 axios 实例（用于管理接口）
const adminClient = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 添加请求拦截器，自动附加 token
adminClient.interceptors.request.use(
  (config) => {
    const token = getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== 公共接口 ====================

// 获取图文列表
export const getPosts = () => apiClient.get('/get_posts.php');

// 获取单个帖子
export const getPost = (post_id) => {
  return getPosts().then(response => {
    const post = response.data.list.find(p => p.id === post_id);
    if (post) {
      return { data: { code: 0, post: post } };
    }
    throw new Error('Post not found');
  });
};

// 提交评论/回复
export const addComment = (data) => {
  const params = new URLSearchParams();
  Object.keys(data).forEach(key => {
    params.append(key, data[key]);
  });
  return apiClient.post('/add_comment.php', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};

// 获取评论列表（树形结构）
export const getCommentList = (post_id) => apiClient.get('/get_comment.php', {params:{post_id}});

// 获取随机昵称
export const getRandomNickname = () => apiClient.get('/get_random_nickname.php');

// 点赞帖子
export const likePost = (post_id, action = 'like') => {
  const params = new URLSearchParams();
  params.append('post_id', post_id);
  params.append('action', action);
  return apiClient.post('/like_post.php', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};

// 转发帖子
export const sharePost = (post_id) => {
  const params = new URLSearchParams();
  params.append('post_id', post_id);
  return apiClient.post('/share_post.php', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};

// 获取帖子统计（点赞数、分享数、评论数）
export const getPostStats = (post_id) => apiClient.get('/get_post_stats.php', {params:{post_id}});

// 获取随机帖子（相关推荐）
export const getRandomPosts = (params) => apiClient.get('/get_random_posts.php', { params });

// 发布帖子（带图片上传）
export const publishPost = (formData) => {
  return apiClient.post('/publish_post.php', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// ==================== 管理接口 ====================

// 管理员登录
export const adminLogin = (data) => {
  const params = new URLSearchParams();
  Object.keys(data).forEach(key => {
    params.append(key, data[key]);
  });
  return apiClient.post('/admin_login.php', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};

// 获取所有帖子（管理）
export const adminGetPosts = () => adminClient.get('/admin_posts.php');

// 更新帖子（管理）
export const adminUpdatePost = (postId, data) => {
  const params = new URLSearchParams();
  Object.keys(data).forEach(key => {
    params.append(key, data[key]);
  });
  return adminClient.put(`/admin_posts.php?id=${postId}`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};

// 删除帖子（管理）
export const adminDeletePost = (postId) => {
  return adminClient.delete(`/admin_posts.php?id=${postId}`);
};

// 获取所有评论（管理）
export const adminGetComments = (postId) => {
  const params = postId ? { post_id: postId } : {};
  return adminClient.get('/admin_comments.php', { params });
};

// 更新评论（管理）
export const adminUpdateComment = (postId, commentId, content) => {
  const params = new URLSearchParams();
  params.append('content', content);
  return adminClient.put(`/admin_comments.php?post_id=${postId}&comment_id=${commentId}`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};

// 删除评论（管理）
export const adminDeleteComment = (postId, commentId) => {
  return adminClient.delete(`/admin_comments.php?post_id=${postId}&comment_id=${commentId}`);
};

export default apiClient;
