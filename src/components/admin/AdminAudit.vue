<template>
  <div class="content-panel">
    <div class="panel-header">
      <h2>审核中心</h2>
      <div class="header-actions">
        <span style="color: #666; font-size: 14px;">待处理任务：{{ auditList.length }}</span>
        <button class="btn-refresh" @click="fetchAuditList">刷新列表</button>
      </div>
    </div>

    <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
      <button :class="auditType === 'all' ? 'active-type' : ''" @click="auditType = 'all'"
        style="padding: 5px 10px; margin-right: 10px; border: none; background: none; cursor: pointer; color: #666;">全部</button>
      <button :class="auditType === 'song' ? 'active-type' : ''" @click="auditType = 'song'"
        style="padding: 5px 10px; margin-right: 10px; border: none; background: none; cursor: pointer; color: #666;">歌曲审核</button>
      <button :class="auditType === 'playlist' ? 'active-type' : ''" @click="auditType = 'playlist'"
        style="padding: 5px 10px; border: none; background: none; cursor: pointer; color: #666;">歌单审核</button>
    </div>

    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>类型</th>
            <th>名称</th>
            <th>申请人ID</th>
            <th>当前状态</th>
            <th>申请操作</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredAuditList" :key="item.id">
            <td>{{ item.id }}</td>
            <td>
              <span :style="{ color: item.type === 'song' ? '#0288d1' : '#9c27b0', fontWeight: 'bold' }">
                {{ item.type === 'song' ? '🎵 歌曲' : '📋 歌单' }}
              </span>
            </td>
            <td>{{ item.name }}</td>
            <td>{{ item.creatorId || item.userId }}</td>
            <td>
              <span style="color: #e6a23c; font-weight: bold;">⏳ 待处理</span>
            </td>
            <td>
              <span v-if="item.status === 3" style="color: #67c23a;">申请上架</span>
              <span v-else-if="item.status === 4" style="color: #f56c6c;">申请下架</span>
              <span v-else>状态变更</span>
            </td>
            <td class="operate">
              <button class="btn-audit-pass" @click="handleAudit(item.id, 1, item.type)">
                通过
              </button>
              <button class="btn-audit-reject" @click="handleAudit(item.id, 0, item.type)">
                拒绝
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="filteredAuditList.length === 0" class="empty-data">
      🎉 暂无待审核内容
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'

const auditType = ref('all')
const auditList = ref([])

const filteredAuditList = computed(() => {
  if (auditType.value === 'all') return auditList.value
  return auditList.value.filter(i => i.type === auditType.value)
})

const fetchAuditList = async () => {
  try {
    const requestBody = {
      status: [3, 4],
      pageNum: 1,
      pageSize: 100
    }

    const [songRes, playlistRes] = await Promise.all([
      request.post('/song/wait-audit', requestBody),
      request.post('/playlist/wait-audit', requestBody)
    ])

    const songs = songRes.data.code === '200' ? (songRes.data.data.records || []) : []
    const playlists = playlistRes.data.code === '200' ? (playlistRes.data.data.records || []) : []

    auditList.value = [
      ...songs.map(s => ({
        ...s,
        type: 'song',
        name: s.name || s.title,
        creatorId: s.userId || s.creatorId
      })),
      ...playlists.map(p => ({
        ...p,
        type: 'playlist',
        name: p.name,
        creatorId: p.creatorId || p.userId
      }))
    ]
    auditList.value.sort((a, b) => {
      const timeA = new Date(a.createTime || 0).getTime()
      const timeB = new Date(b.createTime || 0).getTime()
      return timeB - timeA
    })
  } catch (e) {
    console.error('Fetch audit list error:', e)
    const msg = e.response?.data?.msg || e.message || '获取审核列表失败'
    alert(msg)
  }
}

const handleAudit = async (id, status, type) => {
  try {
    await request.post('/music/confirm-audit', {
      id,
      status,
      type
    })
    alert(status === 1 ? '审核通过' : '审核拒绝')
    fetchAuditList()
  } catch (e) {
    alert('操作失败')
  }
}

onMounted(() => {
  fetchAuditList()
})
</script>

<style scoped>
.content-panel {
  width: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
}

.btn-refresh {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh:hover {
  background: #e5e5e5;
}

.active-type {
  color: #0288d1 !important;
  border-bottom: 2px solid #0288d1 !important;
  font-weight: bold;
}

.table-wrap {
  margin-bottom: 20px;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 14px;
}

.admin-table thead {
  background: #f5f5f5;
}

.admin-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e5e7eb;
}

.admin-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #666;
}

.admin-table tbody tr:hover {
  background: #f9f9f9;
}

.operate {
  display: flex;
  gap: 8px;
}

.btn-audit-pass,
.btn-audit-reject {
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.btn-audit-pass {
  background: #67c23a;
  color: white;
}

.btn-audit-pass:hover {
  background: #55a634;
}

.btn-audit-reject {
  background: #f56c6c;
  color: white;
}

.btn-audit-reject:hover {
  background: #dd5a5a;
}

.empty-data {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
