<template>
  <div class="admin-page">
    <!-- 管理页面头部 -->
    <header class="admin-header">
      <div class="admin-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V8h10v2z" />
        </svg>
        <h1>后台管理系统</h1>
      </div>
      <div class="admin-user">
        <span>当前登录：{{ adminInfo.username }}</span>
        <button class="btn-logout" @click="handleLogout">退出登录</button>
      </div>
    </header>

    <!-- 管理页面导航 -->
    <nav class="admin-nav">
      <div class="nav-item" :class="{ active: activeTab === 'site' }" @click="activeTab = 'site'">
        站点概览
      </div>
      <div class="nav-item" :class="{ active: activeTab === 'home' }" @click="activeTab = 'home'">
        主页管理
      </div>
      <div class="nav-item" :class="{ active: activeTab === 'user' }" @click="activeTab = 'user'">
        用户管理
      </div>
      <div class="nav-item" :class="{ active: activeTab === 'song' }" @click="activeTab = 'song'">
        歌曲管理
      </div>
      <div class="nav-item" :class="{ active: activeTab === 'playlist' }" @click="activeTab = 'playlist'">
        歌单管理
      </div>
      <div class="nav-item" :class="{ active: activeTab === 'singer' }" @click="activeTab = 'singer'">
        歌手管理
      </div>
      <div class="nav-item" :class="{ active: activeTab === 'audit' }" @click="activeTab = 'audit'">
        审核管理
      </div>
    </nav>

    <!-- 管理页面内容区 -->
    <main class="admin-content">
      <AdminSite v-if="activeTab === 'site'" :auditCount="auditCount" @switchTab="switchTab" />
      <AdminHome v-if="activeTab === 'home'" />
      <AdminUser v-if="activeTab === 'user'" />
      <AdminSong v-if="activeTab === 'song'" />
      <AdminPlaylist v-if="activeTab === 'playlist'" />
      <div v-if="activeTab === 'singer'" class="content-panel">
        <SingerManage />
      </div>
      <AdminAudit v-if="activeTab === 'audit'" ref="auditRef" />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import SingerManage from '@/components/SingerManage.vue'
import AdminSite from '@/components/admin/AdminSite.vue'
import AdminHome from '@/components/admin/AdminHome.vue'
import AdminUser from '@/components/admin/AdminUser.vue'
import AdminSong from '@/components/admin/AdminSong.vue'
import AdminPlaylist from '@/components/admin/AdminPlaylist.vue'
import AdminAudit from '@/components/admin/AdminAudit.vue'

const router = useRouter()
const activeTab = ref('site')
const adminInfo = ref({
  id: '',
  username: ''
})
const auditCount = ref(0)
const auditRef = ref(null)

const initAdminInfo = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  adminInfo.value = {
    id: userInfo.id,
    username: userInfo.username
  }
}

const handleLogout = () => {
  localStorage.removeItem('userInfo')
  router.push('/login')
}

const switchTab = (tabName) => {
  activeTab.value = tabName
}

// 监听审核列表数量变化
const updateAuditCount = () => {
  if (auditRef.value) {
    auditCount.value = auditRef.value.auditList?.length || 0
  }
}

onMounted(() => {
  console.log('🚀 Admin 页面已挂载')
  initAdminInfo()

  // 延迟更新审核计数
  setTimeout(() => {
    updateAuditCount()
  }, 500)
})
</script>

<style scoped>
.admin-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: "Microsoft Yahei", sans-serif;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #2c3e50;
  color: #fff;
  border-radius: 8px;
  margin-bottom: 20px;
}

.admin-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-title h1 {
  font-size: 20px;
  margin: 0;
  font-weight: 600;
}

.admin-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-logout {
  padding: 6px 12px;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-logout:hover {
  background: #c0392b;
}

.admin-nav {
  display: flex;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.nav-item {
  padding: 16px 28px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.nav-item.active {
  color: #0288d1;
  border-color: #0288d1;
  background: #fff;
}

.nav-item:hover {
  background: #e9ecef;
}

.admin-content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.content-panel {
  width: 100%;
}
</style>
