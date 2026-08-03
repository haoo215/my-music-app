<template>
  <nav class="navbar">
    <!-- Logo -->
    <router-link to="/" class="logo">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21
            0-4 1.79-4 4s1.79 4 4 4 4-1.79
            4-4V7h4V3h-6z" />
        </svg>
      </div>
      半拍时光
    </router-link>

    <!-- 中间导航 -->
    <div class="nav-links">
      <router-link to="/" class="nav-link">发现</router-link>
      <router-link to="/ai-song" class="nav-link">AI比她更懂你</router-link>
      <router-link to="/charts" class="nav-link">排行榜</router-link>
      <router-link to="/search" class="nav-link">搜索</router-link>
      <router-link to="/map" class="nav-link">点亮地图</router-link>
      <router-link to="/singers" class="nav-link">歌手</router-link>
      <router-link to="/player" class="nav-link">播放器</router-link>
    </div>

    <!-- 移动端汉堡按钮 -->
    <button
      class="nav-toggle"
      :class="{ active: mobileOpen }"
      @click="mobileOpen = !mobileOpen"
      :aria-expanded="mobileOpen"
      aria-label="打开导航菜单"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- 右侧操作 -->
    <div class="nav-actions">

      <!-- 未登录 -->
      <template v-if="!loggedIn">
        <router-link to="/login" class="btn btn-ghost">登录</router-link>
        <!-- 核心修改：添加 ?tab=register 参数 -->
        <router-link to="/login?tab=register" class="btn btn-primary">注册</router-link>
      </template>
      <!-- 已登录 -->
      <template v-else>
        <div class="user-dropdown" @click="toggleDropdown">
          <!-- 触发区域 -->
          <div class="user-trigger">
            <img class="avatar" :src="formatAvatar(user.avatar)" alt="avatar" @error="handleAvatarError" />
            <span class="nickname">{{ user.username }}</span>
            <svg class="arrow" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>

          <!-- 下拉菜单 -->
          <div v-if="showDropdown" class="dropdown-menu">
            <router-link to="/profile" class="dropdown-item">个人中心</router-link>
            <a @click="goToCurrentPlaylist" class="dropdown-item">我的收藏</a>


            <div class="dropdown-divider"></div>
            <div class="dropdown-item logout" @click.stop="handleLogout">
              退出登录
            </div>
          </div>
        </div>
      </template>
    </div>
  </nav>

  <!-- 移动端抽屉菜单 -->
  <transition name="mobile-menu">
    <div v-if="mobileOpen" class="mobile-menu-overlay" @click.self="mobileOpen = false">
      <div class="mobile-menu-panel">
        <router-link to="/" class="mobile-link" @click="mobileOpen = false">发现</router-link>
        <router-link to="/ai-song" class="mobile-link" @click="mobileOpen = false">AI比她更懂你</router-link>
        <router-link to="/charts" class="mobile-link" @click="mobileOpen = false">排行榜</router-link>
        <router-link to="/search" class="mobile-link" @click="mobileOpen = false">搜索</router-link>
        <router-link to="/map" class="mobile-link" @click="mobileOpen = false">点亮地图</router-link>
        <router-link to="/singers" class="mobile-link" @click="mobileOpen = false">歌手</router-link>
        <router-link to="/player" class="mobile-link" @click="mobileOpen = false">播放器</router-link>

        <div class="mobile-divider"></div>

        <template v-if="!loggedIn">
          <router-link to="/login" class="mobile-link" @click="mobileOpen = false">登录</router-link>
          <router-link to="/login?tab=register" class="mobile-link accent" @click="mobileOpen = false">注册</router-link>
        </template>
        <template v-else>
          <router-link to="/profile" class="mobile-link" @click="mobileOpen = false">个人中心</router-link>
          <a class="mobile-link" @click="goToCurrentPlaylist(); mobileOpen = false">我的收藏</a>
          <a class="mobile-link logout" @click="handleLogout(); mobileOpen = false">退出登录</a>
        </template>
      </div>
    </div>
  </transition>
</template>

<script setup>
import request from '@/utils/request'
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const loggedIn = ref(false)
const user = ref({})
const defaultAvatar = '/images/default-avatar.png'

const showDropdown = ref(false)

// 移动端菜单开关
const mobileOpen = ref(false)
// 路由切换时自动关闭移动端菜单
watch(() => route.fullPath, () => {
  mobileOpen.value = false
})

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const formatAvatar = (url) => {
  return url || defaultAvatar
}

const handleAvatarError = (event) => {
  const imgElement = event.target;
  // 只有当当前 src 不是默认图时，才替换为默认图
  // 或者添加一个标记，防止反复触发
  if (imgElement.src !== window.location.origin + defaultAvatar) {
    // 注意：这里需要确保路径匹配，简单做法是加个标志位
    imgElement.dataset.errorHandled = "true";
    imgElement.src = defaultAvatar;
  } else {
    // 如果默认图也加载失败了，就彻底停止，或者换成一个 base64 的空占位图
    console.warn('默认头像也加载失败，停止重试');
    // 可选：移除 onerror 监听，防止后续任何操作再次触发
    imgElement.onerror = null;
  }
}

// 从 localStorage 读取用户信息
const getLocalUserInfo = () => {
  try {
    const raw = localStorage.getItem('userInfo')
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    console.warn('解析 userInfo 失败', e)
    return null
  }
}

// ✅ 新增：跳转到当前播放歌单
const goToCurrentPlaylist = () => {
  const data = JSON.parse(localStorage.getItem('playInfo'));

  const currentPlaylistId = data?.playListId
  try {
    // 直接跳转（详情页自己请求数据，避免重复请求）
    router.push({
      path: `/playlist/${currentPlaylistId}`, // 路径保留id
      query: { name: '我的收藏' } // 携带歌单名称，路由自动处理编码
    })
  } catch (error) {
    console.error('跳转歌单详情失败：', error)
  }
}

// 4. 新歌点击事件：跳转详情页（仅修改这部分，传递完整歌曲数据）
const handleSongClick = (song) => {
  try {
    router.push({
      path: `/song/${song.id}`, // 保留id在URL中
      state: { songData: song } // 关键：把从后端获取的完整歌曲数据传递给详情页
    })
  } catch (error) {
    console.error('跳转歌曲详情失败：', error)
    alert(`加载「${song.name}」失败，请稍后重试！`)
  }
}



const updateLoginState = () => {
  const userInfo = getLocalUserInfo()
  loggedIn.value = !!userInfo
  user.value = userInfo || {}
}

onMounted(() => {
  updateLoginState()
  window.addEventListener('storage', updateLoginState)
  window.addEventListener('user-info-updated', updateLoginState)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', updateLoginState)
  window.removeEventListener('user-info-updated', updateLoginState)
})

// 退出登录
const handleLogout = async () => {
  try {
    await request.post('/user/logout'); // 清除后端 Cookie

    localStorage.removeItem('userInfo');
    localStorage.removeItem('playInfo');

    loggedIn.value = false;
    user.value = {};
    showDropdown.value = false; // 关闭下拉菜单

    router.push('/login');

    // 4. 可选：通知其他组件用户已登出（如果你有全局状态管理）
    window.dispatchEvent(new CustomEvent('user-info-updated'));

  } catch (error) {
    console.error('登出失败:', error);
    loggedIn.value = false;
    user.value = {};
    localStorage.removeItem('userInfo');
    localStorage.removeItem('playInfo');
    router.push('/login');
  }
};
</script>

<style scoped>
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background-color: #eee;
  border: 1px solid #ddd;
}

.user-dropdown {
  position: relative;
  cursor: pointer;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 20px;
  transition: background-color 0.2s;
}

.user-trigger:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.nickname {
  font-size: 14px;
  font-weight: 500;
  color: rgb(168, 158, 158);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 36px;
  /* 垂直居中对齐头像 */
}

.arrow {
  width: 16px;
  height: 16px;
  fill: #666;
  margin-left: 4px;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 48px;
  background: white;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
  border-radius: 6px;
  width: 140px;
  z-index: 1000;
}

.dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  color: #333;
  display: block;
  text-decoration: none;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-divider {
  height: 1px;
  background-color: #eee;
  margin: 6px 0;
}

.logout {
  color: #f56c6c;
}

/* ===== 移动端汉堡按钮 ===== */
.nav-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  padding: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 1002;
}

.nav-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  border-radius: 2px;
  background: var(--text-primary, #fff);
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.nav-toggle.active span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.nav-toggle.active span:nth-child(2) {
  opacity: 0;
}

.nav-toggle.active span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* ===== 移动端抽屉菜单 ===== */
.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  top: 80px;
  background: rgba(10, 10, 15, 0.6);
  backdrop-filter: blur(4px);
  z-index: 999;
}

.mobile-menu-panel {
  display: flex;
  flex-direction: column;
  padding: 12px 20px 24px;
  background: rgba(15, 15, 22, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-glass, rgba(255, 255, 255, 0.08));
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.mobile-link {
  padding: 16px 12px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  font-size: 1.05rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.mobile-link:hover,
.mobile-link.router-link-active {
  color: var(--text-primary, #fff);
  background: var(--bg-glass, rgba(255, 255, 255, 0.05));
}

.mobile-link.accent {
  color: var(--accent-purple, #a855f7);
}

.mobile-link.logout {
  color: #f56c6c;
}

.mobile-divider {
  height: 1px;
  background: var(--border-glass, rgba(255, 255, 255, 0.08));
  margin: 8px 0;
}

/* 抽屉动画 */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.25s ease;
}

.mobile-menu-enter-active .mobile-menu-panel,
.mobile-menu-leave-active .mobile-menu-panel {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}

.mobile-menu-enter-from .mobile-menu-panel,
.mobile-menu-leave-to .mobile-menu-panel {
  transform: translateY(-20px);
}

/* 仅在移动端显示汉堡按钮 */
@media (max-width: 768px) {
  .nav-toggle {
    display: flex;
  }

  /* 移动端隐藏右侧登录/注册按钮与用户区，统一收进抽屉 */
  .nav-actions {
    display: none;
  }
}
</style>
