<template>
  <div class="content-panel">
    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-icon user">👥</div>
        <div class="stat-info">
          <div class="stat-num">{{ statsLoading ? '...' : stats.usersCount }}</div>
          <div class="stat-label">注册用户</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon song">🎵</div>
        <div class="stat-info">
          <div class="stat-num">{{ statsLoading ? '...' : stats.songCount }}</div>
          <div class="stat-label">收录歌曲</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon playlist">📋</div>
        <div class="stat-info">
          <div class="stat-num">{{ statsLoading ? '...' : stats.playlistCount }}</div>
          <div class="stat-label">创建歌单</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon audit">⏳</div>
        <div class="stat-info">
          <div class="stat-num">{{ auditCount }}</div>
          <div class="stat-label">待审核任务</div>
        </div>
      </div>
    </div>

    <div class="welcome-box">
      <h3>👋 管理员工作台</h3>
      <p>当前系统运行正常。请及时处理 <span style="color:#e6a23c; font-weight:bold;">{{ auditCount }}</span> 个待审核任务，确保内容合规。
      </p>
      <button class="btn-go-audit" @click="$emit('switchTab', 'audit')">立即去处理</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const props = defineProps({
  auditCount: {
    type: Number,
    default: 0
  }
})

const stats = ref({
  songCount: 0,
  usersCount: 0,
  playlistCount: 0,
})
const statsLoading = ref(false)

const fetchDashboardStats = async () => {
  statsLoading.value = true
  try {
    const res = await request.get('/home/config/dashboard/stats')
    if (res.data.code === '200' || res.data.code === 200) {
      const data = res.data.data
      stats.value.songCount = data.songCount || 0
      stats.value.usersCount = data.usersCount || 0
      stats.value.playlistCount = data.playlistCount || 0
    }
  } catch (error) {
    console.error('获取统计数据失败', error)
  } finally {
    statsLoading.value = false
  }
}

const emit = defineEmits(['switchTab'])

onMounted(() => {
  fetchDashboardStats()
})
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-card.warning {
  border-color: #ffe58f;
  background: #fffbe6;
}

.stat-icon {
  font-size: 32px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f5f5;
}

.stat-info .stat-num {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-info .stat-label {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}

.welcome-box {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  padding: 20px;
  border-radius: 8px;
  color: #0050b3;
}

.btn-go-audit {
  margin-top: 10px;
  background: #1890ff;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-go-audit:hover {
  background: #0050b3;
}
</style>
