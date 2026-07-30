<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-visual">
        <div class="visual-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
        </div>
        <h2>{{ isLoginTab ? '欢迎回来' : '创建账号' }}</h2>
        <p>
          {{
            isLoginTab
              ? '登录后即可享受海量高品质音乐，同步收藏与播放记录，开启专属音乐之旅。'
              : '注册新账号，立即解锁音乐专属权益，同步你的音乐世界。'
          }}
        </p>
      </div>
      <div class="login-form-container">
        <div class="login-header">
          <h3>{{ isLoginTab ? '账号登录' : '账号注册' }}</h3>
          <p>{{ isLoginTab ? '使用手机号或邮箱登录' : '填写信息创建新账号' }}</p>
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- 注册专属：昵称输入框 -->
          <div v-if="!isLoginTab" class="form-group">
            <label class="form-label">昵称</label>
            <input type="text" class="form-input" placeholder="请输入你的昵称" v-model="registerForm.nickname"
              :disabled="isLoading">
          </div>

          <!-- 手机号/邮箱：计算属性双向绑定（修复核心） -->
          <div class="form-group">
            <label class="form-label">手机号 / 邮箱</label>
            <input type="text" class="form-input" placeholder="请输入手机号或邮箱" v-model="account" :disabled="isLoading">
          </div>

          <!-- 密码：计算属性双向绑定（修复核心） -->
          <div class="form-group">
            <label class="form-label">密码</label>
            <input type="password" class="form-input" :placeholder="isLoginTab ? '请输入密码' : '请设置6-16位密码'"
              v-model="password" :disabled="isLoading">
          </div>

          <!-- 注册专属：确认密码 -->
          <div v-if="!isLoginTab" class="form-group">
            <label class="form-label">确认密码</label>
            <input type="password" class="form-input" placeholder="请再次输入密码" v-model="registerForm.confirmPwd"
              :disabled="isLoading">
          </div>
  
<!-- 只在注册时显示验证码 -->
<div v-if="!isLoginTab" class="form-group">
  <label class="form-label">验证码</label>
  <div class="captcha-container">
    <img 
      :src="`/api/captcha/generate?_t=${captchaKey}`" 
      @click="refreshCaptcha"
      class="captcha-image"
    />
    <input 
      type="text" 
      class="form-input captcha-input" 
      placeholder="请输入验证码"
      v-model="captchaInput"
      :disabled="isLoading"
    />
  </div>
</div>
          <!-- 错误提示：共用 -->
          <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>

          <!-- 登录专属：记住我 + 忘记密码 -->
          <div v-if="isLoginTab" class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="loginForm.remember" :disabled="isLoading">
              记住我
            </label>
            <a href="#" class="forgot-link">忘记密码？</a>
          </div>

          <!-- 提交按钮：动态文字 -->
          <button type="submit" class="btn btn-primary btn-login" :disabled="isLoading">
            <span v-if="isLoading">{{ isLoginTab ? '登录中...' : '注册中...' }}</span>
            <span v-else>{{ isLoginTab ? '登录' : '立即注册' }}</span>
          </button>
        </form>

  <!-- 登录专属：第三方登录 -->
<div class="wechat-login-box">
  <h3>微信扫码登录</h3>

  <!-- 显示二维码按钮：默认显示，点击后隐藏 -->
  <button 
    v-if="!showQrCode && !loginSuccess" 
    @click="showQrCodeAndInit" 
    class="show-qr-btn"
  >
    点击显示微信登录二维码
  </button>

  <!-- 二维码区域：点击按钮后才显示 -->
  <div class="qr-container" v-if="showQrCode && !loginSuccess">
    <!-- 加载状态 -->
    <div v-if="qrLoading" class="loading-qr">正在加载二维码...</div>

    <!-- 二维码图片 -->
    <img v-else :src="qrCodeImageUrl" alt="微信扫码登录" class="qr-image" @error="handleQrError" />

    <p class="tips">请使用微信扫描二维码</p>

    <!-- 过期或刷新按钮 -->
    <button @click="initWechatLogin" class="refresh-btn" v-if="showRefresh || qrExpired">
      {{ qrExpired ? '二维码已过期，点击刷新' : '刷新二维码' }}
    </button>
  </div>

  <!-- 登录成功提示 -->
  <div class="success-container" v-else-if="loginSuccess">
    <div class="success-icon">✅</div>
    <p>登录成功！正在跳转...</p>
  </div>
</div>

        <!-- 切换提示：登录/注册互转 -->
        <div class="signup-prompt">
          {{ isLoginTab ? '还没有账号？' : '已有账号？' }}
          <a href="#" @click.prevent="switchTab">{{ isLoginTab ? '立即注册' : '立即登录' }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import request from '@/utils/request'
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue' 
// 新增：导入 useRoute
import { useRouter, useRoute } from 'vue-router' 

// 路由实例
const router = useRouter()
const showQrCode = ref(false)
// ========== 核心状态：登录/注册Tab切换 ==========
const isLoginTab = ref(true) // true=登录页，false=注册页
// ========== 微信登录相关状态 ==========
const qrCodeImageUrl = ref('')       // 二维码图片的 URL
const currentState = ref('')         // 当前生成的 state
const loginSuccess = ref(false)      // 是否登录成功
const qrLoading = ref(false)         // 二维码加载中
const qrExpired = ref(false)         // 二维码是否过期
const showRefresh = ref(false)       // 是否显示刷新按钮
const pollTimer = ref(null)
// ========== 表单数据：分开管理，避免混淆 ==========
// 登录表单
const loginForm = ref({
  account: '',
  password: '',
  remember: false
})
const captchaInput = ref('') // 用户输入的验证码
// 注册表单
const registerForm = ref({
  nickname: '',
  account: '',
  password: '',
  confirmPwd: ''
})

// ========== 公共状态 ==========
const isLoading = ref(false)
const errorMsg = ref('')


const captchaKey = ref(Date.now())

const refreshCaptcha = () => {
  captchaKey.value = Date.now() // 触发图片 src 变化，重新加载
}

// ========== 微信登录核心流程 ==========

/**
 * 初始化微信登录：生成 State 并获取二维码
 */
const initWechatLogin = async () => {
  // 重置状态
  loginSuccess.value = false
  qrExpired.value = false
  showRefresh.value = false
  qrLoading.value = true
  qrCodeImageUrl.value = ''

  // 停止旧的轮询
  if (pollTimer.value) clearInterval(pollTimer.value)

  try {
    // A. 生成唯一 State (前端生成 UUID)
    const state = generateUUID()
    currentState.value = state

    const res = await request.get('/user/wxLogin', {
      responseType: 'blob',
      params: { state: state }
    })

    // 假设后端返回结构：{ code: '200', data: 'http://.../qrcode.png' }

    qrCodeImageUrl.value = URL.createObjectURL(res.data)
    qrLoading.value = false

    startPolling(state)


  } catch (error) {
    console.error('初始化微信登录失败', error)
    qrLoading.value = false
    qrExpired.value = true
    showRefresh.value = true
    alert('获取二维码失败，请刷新重试')
  }
}

/**
 * 2. 开始轮询检查登录状态
 */
const startPolling = (state) => {
  let retryCount = 0
  const maxRetries = 150 // 轮询 150 次 * 2秒 = 300秒 (5分钟)，对应二维码过期时间

  pollTimer.value = setInterval(async () => {
    try {
      // 调用你之前写的 check 接口
      const res = await request.get('/wxLogin/check', {
        params: { key: state }
      })
      console.log("res的状态", res.data.code)
      if (res.data.code === '200') {
        const token = res.data.data
        console.log("token", token)
        if (token) {
          // === 登录成功！ ===
          clearInterval(pollTimer.value)
          handleLoginSuccess(token)
        } else {
          retryCount++
          if (retryCount >= maxRetries) {
            clearInterval(pollTimer.value)
            qrExpired.value = true
            showRefresh.value = true
            console.log('二维码已过期')
          }
        }
      }
    } catch (error) {
      console.error('轮询出错', error)
      // 网络错误时不立即停止，尝试下一次
    }
  }, 5000) // 每 2 秒查一次
}

/**
 * 3. 处理登录成功
 */

const handleLoginSuccess = async (token) => {

  loginSuccess.value = true

  // A. 保存 Token
  localStorage.setItem('auth_token', token);
  console.log('💾 [存储] Token 已存入 localStorage');

  // 【调试关键】手动检查 request 拦截器是否能读到
  // 可以在浏览器控制台输入: localStorage.getItem('auth_token') 验证

  // B. 获取用户信息
  console.log('🔄 [请求] 开始调用 /user/playInfo 获取用户信息...');
  try {
    const res = await request.get('/user/playInfo');
    console.log('📥 [响应] /user/playInfo 返回数据:', res.data);

    if (res.data.code === '200' && (res.data.success === true || res.data.success === undefined)) {
      // 兼容 success 字段可能存在也可能不存在的情况
      const playInfo = res.data.data;

      if (!playInfo) {
        console.warn('⚠️ [警告] 接口成功但 data 为空');
      } else {
        // 移除 playInfo 存储，只存储 userInfo
        const { uid, username, avatar } = playInfo;
        localStorage.setItem('userInfo', JSON.stringify({ uid, username, avatar }));
        window.dispatchEvent(new Event('user-info-updated'));
        console.log('✅ [成功] 用户信息获取并存储完毕');
      }

      // === 执行跳转 ===
      console.log('🚀 [跳转] 1秒后跳转首页...');
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } else {
  
      console.error('❌ [失败] 接口返回业务错误:', res.data.msg);
      alert(`登录成功但获取信息失败：${res.data.msg || '未知错误'}`);

      // 调试用：即使失败也强制跳转看看（可选）
      // setTimeout(() => router.push('/'), 2000); 

      loginSuccess.value = false;
      initWechatLogin();
    }
  } catch (err) {
    console.error('💥 [异常] 获取用户信息网络错误或代码报错:', err);
    alert('网络异常，获取用户信息失败');
    loginSuccess.value = false;
    // 可以选择重试或显示刷新按钮
  }
}

/**
 * 4. 工具函数：生成 UUID
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 5. 图片加载失败处理
 */
const handleQrError = () => {
  qrLoading.value = false
  qrExpired.value = true
  showRefresh.value = true
}

// ========== 组件卸载时清理定时器 ==========
onBeforeUnmount(() => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
  }
})


const showQrCodeAndInit = () => {
  showQrCode.value = true
  initWechatLogin()
}

// ========== 计算属性：双向绑定 ==========
const account = computed({
  get() {
    return isLoginTab.value
      ? loginForm.value.account
      : registerForm.value.account
  },
  set(val) {
    if (isLoginTab.value) {
      loginForm.value.account = val
    } else {
      registerForm.value.account = val
    }
  }
})

const password = computed({
  get() {
    return isLoginTab.value
      ? loginForm.value.password
      : registerForm.value.password
  },
  set(val) {
    if (isLoginTab.value) {
      loginForm.value.password = val
    } else {
      registerForm.value.password = val
    }
  }
})

// ========== 切换登录/注册 ==========
const switchTab = () => {
  isLoginTab.value = !isLoginTab.value
  errorMsg.value = ''
}

// ========== 获取用户播放 + 基本信息 ==========
const fetchPlayInfo = async () => {
  try {
    const res = await request.get('/user/playInfo')
    if (res.data.code === '200' && res.data.success) {
      const playInfo = res.data.data
      // 移除 playInfo 存储，只存储 userInfo
      const { uid, username, avatar } = playInfo
      localStorage.setItem('userInfo', JSON.stringify({ uid, username, avatar }))
      window.dispatchEvent(new Event('user-info-updated'))
      return true
    } else {
      console.warn('获取播放信息失败：', res.data.msg)
      return false
    }
  } catch (err) {
    console.error('获取播放信息异常：', err)
    return false
  }
}


const route = useRoute() // 新增：获取路由参数

// ========== 核心状态：登录/注册Tab切换 ==========


// ========== 新增：监听路由参数，自动切换表单 ==========
onMounted(() => {
  // 页面加载时，根据 URL 参数切换表单
  if (route.query.tab === 'register') {
    isLoginTab.value = false
  }
})

// 监听路由变化（处理浏览器前进/后退）
watch(
  () => route.query.tab,
  (newTab) => {
    // tab=register → 注册页，否则 → 登录页
    isLoginTab.value = newTab !== 'register'
  }
)




// ========== 提交处理（登录 / 注册） ==========
const handleSubmit = async () => {
  errorMsg.value = ''

  // ---------- 表单校验 ----------
  if (isLoginTab.value) {
    if (!loginForm.value.account) {
      errorMsg.value = '请输入手机号或邮箱'
      return
    }
    if (!loginForm.value.password) {
      errorMsg.value = '请输入密码'
      return
    }
  } else {
    if (!registerForm.value.nickname) {
      errorMsg.value = '请输入你的昵称'
      return
    }
    if (!registerForm.value.account) {
      errorMsg.value = '请输入手机号或邮箱'
      return
    }
    if (!registerForm.value.password) {
      errorMsg.value = '请设置密码'
      return
    }
    if (registerForm.value.password.length < 6 || registerForm.value.password.length > 16) {
      errorMsg.value = '密码长度请设置为6-16位'
      return
    }
    if (registerForm.value.password !== registerForm.value.confirmPwd) {
      errorMsg.value = '两次输入的密码不一致'
      return
    }

    if (!captchaInput.value) {
  errorMsg.value = '请输入验证码'
  return
}

  }

  try {
    isLoading.value = true


if (!isLoginTab.value) {
    if (!captchaInput.value) {
      errorMsg.value = '请输入验证码'
      return
    }

    try {
      const checkRes = await request.get('/captcha/check', {
        params: { userCode: captchaInput.value }
      })

      // 后端返回的是纯文本！不是 JSON！
      if (checkRes.data !== '校验成功') {
        errorMsg.value = checkRes.data // 显示“验证码错误”或“已过期”
        refreshCaptcha() // 刷新验证码
        return
      }
    } catch (err) {
      console.error('验证码校验失败', err)
      errorMsg.value = '验证码校验异常，请重试'
      return
    }
  }



    // ========== 登录（核心修复） ==========
    if (isLoginTab.value) {
      const res = await request.post(
        '/user/login', // 改为相对路径
        {
          username: loginForm.value.account,
          password: loginForm.value.password,
          remember: loginForm.value.remember
        }
      )

      const data = res.data

      if (data.code === '200' && data.success) {
        // 1. 先同步获取用户信息，确保存储成功
        const fetchSuccess = await fetchPlayInfo()
        if (!fetchSuccess) {
          errorMsg.value = '登录成功，但获取用户信息失败，请刷新页面'
          return
        }

        // 2. 确认数据存储成功后，再跳转首页
        myAlert(data.msg || '登录成功！')
        router.push('/')
      } else {
        errorMsg.value = data.msg || '登录失败，请检查账号密码'
      }
      // ========== 注册 ==========
    } else {


      const res = await request.post(
        '/user/register', // 相对路径
        {
          username: registerForm.value.nickname,
          email: registerForm.value.account,
          password: registerForm.value.password
        },
      )

      const data = res.data

      if (data.code === '200' && data.success) {
        alert(data.msg || '注册成功！即将跳转到登录页')
        switchTab()
        registerForm.value = { nickname: '', account: '', password: '', confirmPwd: '' }
      } else {
        errorMsg.value = data.msg || '注册失败，请稍后重试'
      }
    }

  } catch (error) {
    console.error(isLoginTab.value ? '登录异常' : '注册异常', error)
    if (error.response) {
      errorMsg.value = error.response.data?.msg || '服务器错误，请稍后重试'
    } else if (error.request) {
      errorMsg.value = '网络异常，请检查网络连接'
    } else {
      errorMsg.value = '请求异常，请重试'
    }
  } finally {
    isLoading.value = false
  }
}

</script>


<style scoped>
/* 显示二维码按钮 */
.show-qr-btn {
  padding: 10px 20px;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin: 10px 0;
}
.show-qr-btn:hover {
  background: #06ad56;
}

/* 原有样式保留 */
.qr-container {
  margin-top: 15px;
}
.loading-qr {
  padding: 40px 0;
  color: #666;
}
.qr-image {
  width: 200px;
  height: 200px;
}
.tips {
  color: #666;
  margin: 10px 0;
}
.refresh-btn {
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
.success-container {
  padding: 30px 0;
  color: #07c160;
}
/* 错误提示样式 */
.error-message {
  color: #f56c6c;
  font-size: 12px;
  margin-bottom: 10px;
  padding: 4px 8px;
  background-color: #fef0f0;
  border-radius: 4px;
}

/* 禁用状态样式优化 */
.form-input:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 表单间距统一 */
.form-group {
  margin-bottom: 16px;
}
.captcha-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.captcha-image {
  width: 130px;
  height: 50px;
  cursor: pointer;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.captcha-input {
  flex: 1;
  max-width: 140px;
  margin-left: 30px;
}
</style>