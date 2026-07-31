// 1. 统一导入axios并创建实例，抽离公共配置
import axios from 'axios';
import { myAlert } from '@/utils/alert.js';
// 创建axios实例，抽离基础配置，便于全局维护


// 创建一个 axios 实例
const request = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:8332' : '/api',
  timeout: 10000,
  withCredentials: true
})

// 登录接口：优化参数校验、响应解构、变量命名
export const login = async ({ username, password }) => {
  // 新增：入参非空校验，提前拦截无效请求
  if (!username || !password) {
    throw new Error('用户名和密码不能为空');
  }
  const { data } = await request.post('/user/login', { username, password });

  if (data.code !== '200' || !data.success) {
    throw new Error(data.msg || '登录失败，请稍后重试');
  }

  const { token, ...userInfo } = data.data || {}; // 解构赋值，分离token和用户信息，更语义化
  // 新增：token非空判断，避免存入空值
  if (token) {
    localStorage.setItem('token', token);
  }
  // 新增：userInfo非空判断，避免存入空JSON
  if (userInfo) {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  }

  return data;
};

// 3. 注册接口：统一请求实例、优化入参校验、错误提示
export const register = async (user) => {
  // 新增：入参校验，确保传入有效用户对象
  if (!user || typeof user !== 'object') {
    throw new Error('请传入有效的用户注册信息');
  }
  const { data } = await request.post('/register', user);

  // 修复原逻辑：&& 改为 ||（业务语义：码非200 或 未成功，均抛出错误）
  if (data.code !== '200' || !data.success) {
    throw new Error(data.msg || '注册失败，请稍后重试');
  }

  return data;
};

// 4. 获取用户信息：优化异常捕获、增加类型校验
export const getUserInfo = () => {
  try {
    const str = localStorage.getItem('userInfo');
    // 新增：空值+非字符串校验，避免无效解析
    if (!str || typeof str !== 'string') {
      return null;
    }
    const userInfo = JSON.parse(str);
    // 新增：解析结果校验，确保是对象
    return typeof userInfo === 'object' && userInfo !== null ? userInfo : null;
  } catch (error) {
    // 新增：错误日志，便于问题排查
    console.error('解析用户信息失败：', error);
    return null;
  }
};

// 是否登录
export const isLogin = () => {
  const userInfo = getUserInfo();
  return !!userInfo; // 有用户信息 = 登录
};

// 6. 退出登录：优化逻辑，清空localStorage指定键，避免误删其他数据
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  // 可选：如果需要清空所有用户相关数据，可使用 localStorage.clear()，但不推荐
};

// 7. 新增：请求拦截器（统一设置请求头，如token认证）
request.interceptors.request.use(
  (config) => {
    // 每次请求自动携带token，无需手动在每个接口设置
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // 主流JWT认证格式，可根据后端调整
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 8. 新增：响应拦截器（统一处理全局响应错误，如401未授权）
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (window.location.pathname === '/login') {
        return Promise.reject(error)
      }

      if (status === 401) {
        logout();
        window.location.href = '/login';
        alert('登录状态已过期，请重新登录');
      }
      // 可扩展：403禁止访问、500服务器错误等统一处理
    }
    // 网络错误/超时等无响应状态处理
    if (!error.response) {
      console.error('网络异常，请检查网络连接');
    }
    return Promise.reject(error);
  }
);



// 新增：检查功能点是否需要登录
export function checkAuth() {
  if (!isLogin()) {
    myAlert('请先登录哦-----------前端身份校验');

    return false
  }
  return true
}


// 导出封装的axios实例，供其他自定义接口使用

export default request