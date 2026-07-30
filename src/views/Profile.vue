<template>
  <div class="profile-page">
    <!-- 账户信息区域（普通用户/管理员都显示，仅管理员多一个按钮） -->
<section class="profile-header">
  <div class="profile-avatar">
    <img :src="formatAvatar(userInfo.avatar)" alt="用户头像" @error="handleAvatarError">
   
  </div>
  <div class="profile-info">
    <h2 class="username">{{ userInfo.username }}</h2>
    <p class="user-desc">{{ userInfo.desc || '暂无个性签名' }}</p>

    <!-- ✅ 新增：编辑资料按钮（所有用户可见） -->
    <div class="edit-profile-btn" @click="handleEditProfile">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
        <path
          d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      </svg>
      编辑资料
    </div>

    <div class="user-stats">
      <div class="stat-item">
        <span class="stat-value">{{ userInfo.playlistCount }}</span>
        <span class="stat-label">创建歌单</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ userInfo.collectCount }}</span>
        <span class="stat-label">收藏歌曲</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ userInfo.followCount }}</span>
        <span class="stat-label">关注</span>
      </div>
    </div>

    <!-- 管理员专属按钮 -->
    <div v-if="isAdmin" class="admin-btn-wrap">
      <router-link to="/admin" class="btn-admin">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V8h10v2z" />
        </svg>
        管理页面
      </router-link>
    </div>
  </div>
</section>

    <!-- 我的歌单区域（管理员/普通用户完全一致，无任何区别） -->
    <section class="profile-section">
      <div class="section-header">
        <h2 class="section-title">🎵 我的歌单</h2>
        <button class="btn btn-sm btn-outline" @click="handleCreatePlaylist">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          创建歌单
        </button>
      </div>

      <div v-if="playlistLoading" class="loading">正在加载我的歌单...</div>
      <div v-else-if="myPlaylists.length === 0" class="empty-data">
        你还没有创建任何歌单，快去创建吧～
      </div>
      <div v-else class="playlist-grid">
        <div class="playlist-card" v-for="(playlist, index) in myPlaylists" :key="playlist.id"
          @click="handlePlaylistClick(playlist)">
          <div class="playlist-cover">
            <img :src="playlist.coverUrl || `https://picsum.photos/seed/playlist${index}/400`" :alt="playlist.name"
              @error="handleCoverError($event)">
            <div class="playlist-play">
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div class="playlist-info">
            <h4>{{ playlist.name }}</h4>
            <p>{{ playlist.playlistCount || 0 }} 首歌曲</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
const goAdmin = () => {
  console.log('准备跳转')
  router.push('/admin')
}
const router = useRouter()
const defaultAvatar = '/images/default-avatar.png'


// 在现有代码基础上增加：
const userRole = ref(null) // 存储从后端获取的真实角色
const roleLoading = ref(true)

// 新增：获取真实用户角色（安全！）
const fetchUserRole = async () => {
  try {
    const res = await request.get('/user/role')
    if (res.data.code === '200' && res.data.success) {
      userRole.value = res.data.data.role // 从后端取 role
      // 可选：同时更新 userInfo 中的 uid
      userInfo.value.id = res.data.data.uid
    }
  } catch (error) {
    console.warn('获取用户角色失败，可能未登录', error)
    userRole.value = null
  } finally {
    roleLoading.value = false
  }
}




// 1. 用户信息（管理员/普通用户共用）
const userInfo = ref({
  id: '',
  username: '游客',
  avatar: '',
  desc: '',
  playlistCount: 0,
  collectCount: 0,
  followCount: 0
})


const isAdmin = computed(() => {
  return userRole.value === 'admin'
})

// 2. 通用方法（和普通用户一致）
const formatAvatar = (url) => {
  return url || defaultAvatar
}

const getLocalUserInfo = () => {
  try {
    const raw = localStorage.getItem('userInfo')
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    console.warn('解析 userInfo 失败', e)
    return null
  }
}

const updateUserInfo = () => {
  const localUser = getLocalUserInfo()
  if (localUser) {
    userInfo.value = {
      ...userInfo.value,
      id: localUser.id,
      username: localUser.username,
      avatar: localUser.avatar,
      desc: localUser.desc || '享受音乐的美好时光'
    }
  }
}

// 3. 我的歌单数据（管理员/普通用户逻辑完全一致）
const myPlaylists = ref([])
const playlistLoading = ref(true)

onMounted(async () => {

  // 先获取角色
  await fetchUserRole()
  updateUserInfo()

  try {
    const res = await request.get(`/playlist/user`)
    if (res.data.code === "200" && res.data.success) {
      myPlaylists.value = res.data.data || []
      userInfo.value.playlistCount = myPlaylists.value.length
    } else {
      // 模拟数据（接口未开发时）
      myPlaylists.value = [
        { id: 1, name: '我的最爱', songCount: 28, coverUrl: 'https://picsum.photos/seed/love/400' },
        { id: 2, name: '通勤必备', songCount: 15, coverUrl: 'https://picsum.photos/seed/work/400' }
      ]
      userInfo.value.playlistCount = myPlaylists.value.length
      userInfo.value.collectCount = 120
      userInfo.value.followCount = 56
    }
  } catch (error) {
    console.error('加载我的歌单失败：', error)
    myPlaylists.value = [
      { id: 1, name: '我的最爱', songCount: 28, coverUrl: 'https://picsum.photos/seed/love/400' }
    ]
    userInfo.value.playlistCount = myPlaylists.value.length
  } finally {
    playlistLoading.value = false
  }
})

// 4. 通用事件处理（管理员/普通用户一致）
const handleAvatarError = (e) => {
  e.target.src = defaultAvatar
}

const handleCoverError = (e) => {
  e.target.src = 'https://picsum.photos/seed/default-playlist/400'
}



const handleCreatePlaylist = async () => {
  const name = prompt('请输入歌单名称：')
  if (!name?.trim()) return // 取消或空名直接退出

  try {
    // 1. 调用后端新增接口
    const response = await request.post('/playlist/add', {
      name: name.trim(),
    })

    // 2. 后端返回完整歌单信息（推荐）或至少返回 id
    const newPlaylist = response.data.data // 假设结构为 { data: { id, name, ... } }

    // 3. 更新本地列表（加到最前面）
    myPlaylists.value.unshift({
      id: newPlaylist.id,
      name: newPlaylist.name,
      songCount: newPlaylist.songCount || 0,
      coverUrl: newPlaylist.coverUrl || `https://picsum.photos/seed/${newPlaylist.id}/400`
    })

    // 4. 更新用户歌单数量
    userInfo.value.playlistCount = myPlaylists.value.length

    // 5. 提示成功
    alert(`歌单「${name}」创建成功！`)
  } catch (error) {
    console.error('创建歌单失败:', error)
    // 根据后端返回的错误信息提示用户
    const msg = error?.response?.data?.message || '创建失败，请稍后重试'
    alert(msg)
  }
}
const handlePlaylistClick = (playlist) => {
  router.push({ path: `/playlist/${playlist.id}`, query: { name: playlist.name } })
}
</script>

<style scoped>
/* 基础样式（管理员/普通用户一致） */
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  margin-bottom: 30px;
}

.profile-avatar {
  position: relative;
  margin-right: 30px;
}

.profile-avatar img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-mask {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.profile-avatar:hover .avatar-mask {
  opacity: 1;
}

.profile-info {
  flex: 1;
}

.username {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

.user-desc {
  color: #666;
  margin: 0 0 16px 0;
  font-size: 14px;
}

.user-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 16px;
  /* 给管理员按钮预留空间 */
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
}

/* 🔴 管理员专属按钮样式（仅管理员可见） */
.admin-btn-wrap {
  margin-top: 8px;
}

.btn-admin {
  background-color: #0288d1;
  color: #fff;
  padding: 8px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-admin:hover {
  background-color: #0277bd;
}

/* 歌单区域样式（完全复用，无区别） */
.profile-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.btn-outline {
  border: 1px solid #3498db;
  background: transparent;
  color: #3498db;
}

.btn-outline:hover {
  background: #3498db;
  color: #fff;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.playlist-card {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.playlist-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.playlist-cover {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.playlist-cover img {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
}

.playlist-play {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.3s;
}

.playlist-card:hover .playlist-play {
  opacity: 1;
}

.playlist-info h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
}

.playlist-info p {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.loading,
.empty-data {
  text-align: center;
  padding: 40px 0;
  color: #666;
  font-size: 16px;
}

.empty-data {
  color: #999;
}
.edit-profile-btn{
  color: #333;
}
</style>