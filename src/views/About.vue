<template>
  <div class="about-page">
    <!-- 顶部装饰栏 -->
    <div class="about-header">
      <div class="header-bg"></div>
      <div class="header-content">
        <h1 class="header-title">音乐空间站</h1>
        <p class="header-subtitle">用心聆听 · 用代码创造</p>
      </div>
    </div>

    <div class="about-container">
      <!-- 网站介绍（卡片式） -->
      <section class="about-section card">
        <div class="section-icon">🎵</div>
        <h1 class="section-title">关于我们</h1>
        <div class="section-content">
          <p>
            本网站致力于打造一个简洁、高效、沉浸式的音乐平台，
            为用户提供流畅的播放体验与个性化推荐服务。
            我们坚持前后端分离架构，注重性能优化与用户体验，
            让每一次聆听都成为享受。
          </p>
        </div>
      </section>

      <!-- 网站目标（带图标） -->
      <section class="about-section card">
        <div class="section-icon">🚀</div>
        <h2 class="section-title">我们的目标</h2>
        <div class="section-content">
          <ul class="goal-list">
            <li class="goal-item">
              <span class="goal-icon">🎶</span>
              <span>打造高性能音乐播放系统</span>
            </li>
            <li class="goal-item">
              <span class="goal-icon">📊</span>
              <span>提供智能推荐与排行榜功能</span>
            </li>
            <li class="goal-item">
              <span class="goal-icon">💬</span>
              <span>实现用户互动评论与社区氛围</span>
            </li>
            <li class="goal-item">
              <span class="goal-icon">🔗</span>
              <span>构建完整前后端分离架构</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- 留言板（样式升级） -->
      <section class="about-section card">
        <div class="section-icon">💬</div>
        <h2 class="section-title">留言互动   🐀🐂🐅🐇🐉🐍🐎🐏🐒🐥🐕🐖 </h2>
        <div class="section-content">
          <!-- 留言输入区域 -->
          <div class="message-input-wrapper">
            <!-- 匿名切换开关（仅当有用户信息时显示） -->
            <div v-if="hasUserInfo" class="anonymous-toggle">
              <label>
                <input 
                  type="checkbox" 
                  v-model="isAnonymous"
                />
                <span>匿名留言</span>
              </label>
            </div>

            <!-- 留言输入框 + 提交按钮 -->
            <div class="message-input">
              <textarea 
                v-model="messageContent"
                placeholder="写下你对网站的建议、想法或体验反馈..."
                class="message-textarea"
                @keyup.enter.exact="handleEnterSubmit"
                @keydown.enter.exact.prevent=""
              />
              <button 
                class="message-submit-btn"
                @click="submitMessage"
                :disabled="!messageContent.trim() || isSubmitting"
              >
                {{ isSubmitting ? '提交中...' : '提交留言' }}
              </button>
            </div>
          </div>

          <!-- 留言列表（带加载/空状态） -->
          <div class="message-list">
            <!-- 加载状态 -->
            <div v-if="isLoading" class="message-loading">
              <div class="loading-spinner"></div>
              <p>加载留言中...</p>
            </div>
            
            <!-- 空状态 -->
            <div v-else-if="messageList.length === 0" class="message-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#e0e0e0">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
              </svg>
              <p>暂无留言，快来成为第一个留言的人吧～</p>
            </div>
            
            <!-- 留言列表 -->
            <div 
              class="message-item"
              v-for="msg in messageList"
              :key="msg.id"
            >
              <div class="message-header">
                <div class="message-avatar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div class="message-user-info">
                  <span class="msg-user">{{ msg.username || '匿名用户' }}</span>
                  <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
                </div>
              </div>
              <div class="msg-content">{{ msg.content }}</div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 提交成功提示 -->
    <div v-if="showToast" class="message-toast" :class="toastType">
      {{ toastText }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue' // 修复：导入computed
import request from '@/utils/request'

// 核心状态
const isAnonymous = ref(true) // 默认匿名
const messageContent = ref('')
const messageList = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const showToast = ref(false)
const toastText = ref('')
const toastType = ref('toast-success') // 提示框类型
const currentPage = ref(1) // 修复：定义缺失的currentPage

// 检查是否有用户信息（计算属性）
const hasUserInfo = computed(() => {
  const stored = localStorage.getItem('userInfo')
  if (!stored) return false
  try {
    const user = JSON.parse(stored)
    return !!user?.username
  } catch {
    return false
  }
})

// 格式化时间（兼容后端返回的时间格式）
const formatTime = (timeStr) => {
  if (!timeStr) return '未知时间'
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 加载留言列表
const loadMessages = async (reset = false) => {
  if (reset) currentPage.value = 1 // 重置分页
  isLoading.value = true
  try {
    const res = await request.get('/about/message/list', {
      params: { page: currentPage.value } // 分页参数（后端如有）
    })
    messageList.value = res.data || res
  } catch (err) {
    console.error('加载留言失败:', err)
    showToastFn('加载留言失败，请稍后重试', 'error')
  } finally {
    isLoading.value = false
  }
}

// 提交留言
const submitMessage = async () => {
  const content = messageContent.value.trim()
  if (!content) {
    showToastFn('留言内容不能为空', 'warning')
    return
  }

  isSubmitting.value = true
  try {
    // 获取用户信息（如果有）
    const storedUser = localStorage.getItem('userInfo')
    let userInfo = null
    if (storedUser) {
      try {
        userInfo = JSON.parse(storedUser)
      } catch (e) {
        console.error('解析用户信息失败', e)
      }
    }

    // 构建请求体
    const payload = { content }
    // 非匿名且有用户信息时传递用户名，否则后端默认存匿名
    if (!isAnonymous.value && userInfo && userInfo.username) {
      payload.username = userInfo.username
    }

    await request.post('/about/message/add', payload)
    
    // 提交成功后重置
    messageContent.value = ''
    isAnonymous.value = true // 重置为默认匿名
    showToastFn('留言提交成功！')
    
    // 重新加载留言列表
    await loadMessages(true)
  } catch (err) {
    console.error('提交留言失败:', err)
    showToastFn('提交失败，请稍后重试', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Enter键提交
const handleEnterSubmit = () => {
  if (!isSubmitting.value) submitMessage()
}

// 提示框函数
const showToastFn = (text, type = 'success') => {
  toastText.value = text
  toastType.value = `toast-${type}`
  showToast.value = true
  
  // 2秒后关闭
  setTimeout(() => {
    showToast.value = false
  }, 2000)
}

// 页面加载时获取留言
onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
/* 顶部装饰栏 */
.about-header {
  position: relative;
  height: 200px;
  overflow: hidden;
}
.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  
  opacity: 0.9;
}
.header-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  z-index: 1;
}
.header-title {
  font-size: 36px;
  margin-bottom: 12px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.header-subtitle {
  font-size: 16px;
  opacity: 0.9;
}

/* 内容容器 */
.about-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 通用区块样式 */
.about-section {
  margin-bottom: 40px;
}
.card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  transition: transform 0.3s ease;
}
.card:hover {
  transform: translateY(-2px);
}
.section-icon {
  font-size: 24px;
  margin-bottom: 12px;
  display: inline-block;
}
.section-title {
  font-size: 24px;
  color: #222;
  margin-bottom: 20px;
  position: relative;
  padding-bottom: 12px;
}
.section-title::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #1db954, #1ed760);
  border-radius: 3px;
}
.section-content {
  color: #555;
  line-height: 1.8;
  font-size: 15px;
}

/* 目标列表样式 */
.goal-list {
  list-style: none;
  padding-left: 0;
}
.goal-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
}
.goal-icon {
  font-size: 18px;
  margin-right: 12px;
  color: #1db954;
  width: 24px;
  text-align: center;
}

/* 留言输入区域（修复布局） */
.message-input-wrapper {
  margin-bottom: 30px;
}
.anonymous-toggle {
  margin-bottom: 12px;
}
.anonymous-toggle label {
  
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #555;
  cursor: pointer;
}
.anonymous-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #1db954; /* 主题色 */
}

/* 留言输入框 */
.message-input {
  display: flex;
  gap: 12px;
}
.message-textarea {
  flex: 1;
  padding: 16px;
  border: 2px solid #eee;
  border-radius: 12px;
  resize: none;
  min-height: 100px;
  font-size: 15px;
  color: #333;
  transition: all 0.3s ease;
  background: #fafafa;
}
.message-textarea:focus {
  outline: none;
  border-color: #1db954;
  box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.1);
  background: #fff;
}
.message-textarea::placeholder {
  color: #999;
  font-size: 14px;
}
.message-submit-btn {
  white-space: nowrap;
  padding: 0 24px;
  background: linear-gradient(90deg, #1db954, #1ed760);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  height: 100px;
  font-weight: 500;
  transition: all 0.3s ease;
  align-self: flex-end; /* 按钮底部对齐 */
}
.message-submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}
.message-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(29, 185, 84, 0.2);
}

/* 留言列表 */
.message-list {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.message-item {
  padding: 20px;
  border-radius: 12px;
  background: #f8f9fa;
  border-left: 4px solid #1db954;
  transition: all 0.3s ease;
}
.message-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
}
.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1db954;
}
.message-user-info {
  flex: 1;
}
.msg-user {
  color: #222;
  font-weight: 500;
  font-size: 15px;
  display: block;
}
.msg-time {
  color: #999;
  font-size: 12px;
  margin-top: 2px;
}
.msg-content {
  color: #555;
  line-height: 1.7;
  font-size: 14px;
}

/* 加载状态 */
.message-loading {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #eee;
  border-top-color: #1db954;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.message-empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

/* 提示框 */
.message-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: toastFade 2s ease forwards;
  color: white;
}
.toast-success {
  background: rgba(29, 185, 84, 0.9);
}
.toast-error {
  background: rgba(255, 71, 87, 0.9);
}
.toast-warning {
  background: rgba(255, 193, 7, 0.9);
}
@keyframes toastFade {
  0% { opacity: 0; top: 10px; }
  10% { opacity: 1; top: 20px; }
  90% { opacity: 1; top: 20px; }
  100% { opacity: 0; top: 10px; }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .about-header {
    height: 150px;
  }
  .header-title {
    font-size: 28px;
  }
  .card {
    padding: 24px;
  }
  .message-input {
    flex-direction: column;
  }
  .message-submit-btn {
    padding: 12px 24px;
    width: 100%;
    align-self: auto;
  }
}
</style>