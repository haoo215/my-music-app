<template>
  <div class="content-panel">
    <div class="panel-header">
      <h2>歌单列表</h2>
      <div class="header-actions">
        <div class="search-box">
          <input v-model="playlistPage.keyword" placeholder="搜索歌单..." @keyup.enter="fetchPlaylists(1)" />
          <button @click="fetchPlaylists(1)">搜索</button>
        </div>
        <button class="btn-add" @click="handleAddPlaylist">新增歌单</button>
      </div>
    </div>
    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>歌单名</th>
            <th>封面</th>
            <th>创建人ID</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="playlist in playlistList" :key="playlist.id">
            <td>{{ playlist.id }}</td>
            <td>{{ playlist.name }}</td>
            <td>
              <img :src="playlist.coverUrl" alt="封面" class="table-cover"
                @error="e => e.target.src = 'https://picsum.photos/seed/default/50'">
            </td>
            <td>{{ playlist.creatorId }}</td>
            <td>
              {{
                playlist.status === 1 ? '正常' :
                playlist.status === 0 ? '下架' :
                playlist.status === 3 ? '上架待处理' :
                playlist.status === 4 ? '下架待处理' : '未知状态'
              }}
            </td>
            <td>
              <button class="btn-edit" @click="handleStatusChange(playlist.id, 3, '上传', 'playlist')">上传</button>
              <button class="btn-delete" @click="handleStatusChange(playlist.id, 4, '下架', 'playlist')">下架</button>
              <button class="btn-edit" @click="handleEditPlaylist(playlist)">编辑</button>
              <button class="btn-delete" @click="handleDeletePlaylist(playlist.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pagination" v-if="playlistPage.total > 0">
      <button :disabled="playlistPage.pageNum === 1"
        @click="changePlaylistPage(playlistPage.pageNum - 1)">上一页</button>
      <span>第 {{ playlistPage.pageNum }} 页 / 共 {{ Math.ceil(playlistPage.total / playlistPage.pageSize) }} 页</span>
      <button :disabled="playlistPage.pageNum * playlistPage.pageSize >= playlistPage.total"
        @click="changePlaylistPage(playlistPage.pageNum + 1)">下一页</button>
    </div>
    <div v-if="playlistList.length === 0" class="empty-data">暂无歌单数据</div>

    <!-- 模态框 -->
    <div v-if="showPlaylistModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ isEdit ? '编辑歌单' : '新增歌单' }}</h3>
        <div class="form-row">
          <label>歌单名</label>
          <input v-model="playlistForm.name" class="form-input" />
        </div>
        <div class="form-row">
          <label>封面</label>
          <div class="upload-box">
            <input type="file" @change="(e) => handleUploadImage(e, playlistForm, 'coverUrl')" accept="image/*" />
            <img v-if="playlistForm.coverUrl" :src="playlistForm.coverUrl" class="preview-img" />
          </div>
        </div>
        <div class="form-row">
          <label>创建人ID</label>
          <input v-model="playlistForm.creatorId" class="form-input" />
        </div>
        <div class="modal-actions">
          <button @click="showPlaylistModal = false" class="btn-cancel">取消</button>
          <button @click="submitPlaylist" class="btn-confirm">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const playlistPage = ref({ pageNum: 1, pageSize: 10, total: 0, keyword: '' })
const playlistList = ref([])
const playlistForm = ref({})
const showPlaylistModal = ref(false)
const isEdit = ref(false)

const fetchPlaylists = async (pageNum) => {
  if (pageNum) playlistPage.value.pageNum = pageNum
  try {
    const res = await request.get('/playlist/list', {
      params: {
        pageNum: playlistPage.value.pageNum,
        pageSize: playlistPage.value.pageSize,
        keyword: playlistPage.value.keyword
      }
    })
    if (res.data.code === '200') {
      playlistList.value = res.data.data.records
      playlistPage.value.total = res.data.data.totalRow
    }
  } catch (e) {
    console.error('Fetch playlists error:', e)
  }
}

const changePlaylistPage = (pageNum) => fetchPlaylists(pageNum)

const handleAddPlaylist = () => {
  playlistForm.value = {}
  isEdit.value = false
  showPlaylistModal.value = true
}

const handleEditPlaylist = (playlist) => {
  playlistForm.value = JSON.parse(JSON.stringify(playlist))
  isEdit.value = true
  showPlaylistModal.value = true
}

const submitPlaylist = async () => {
  try {
    if (isEdit.value) {
      await request.put('/playlist/update', playlistForm.value)
    } else {
      await request.post('/playlist/add', playlistForm.value)
    }
    showPlaylistModal.value = false
    fetchPlaylists()
  } catch (e) {
    alert('操作失败')
  }
}

const handleDeletePlaylist = async (id) => {
  if (confirm('确定删除？')) {
    try {
      await request.delete(`/playlist/delete/${id}`)
      fetchPlaylists()
    } catch (e) {
      alert('删除失败')
    }
  }
}

const handleStatusChange = async (id, newStatus, actionName, type) => {
  const statusText = newStatus === 2 ? '待审核' : newStatus
  if (!confirm(`确定要进行【${actionName}】操作吗？\n操作后状态将变为 [${statusText}]，需要管理员审核通过后方可生效。`)) {
    return
  }
  try {
    const payload = {
      id: id,
      status: newStatus,
      type: type
    }
    await request.post('/music/upload-audit', payload)
    alert(`${actionName}成功！已提交至审核队列。`)
    fetchPlaylists()
  } catch (e) {
    console.error('Status update error:', e)
    const msg = e.response?.data?.msg || e.message || '操作失败'
    alert(`${actionName}失败：${msg}`)
  }
}

const handleUploadImage = async (event, targetForm, fieldName) => {
  const file = event.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await request.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data.code === '200') {
      targetForm[fieldName] = res.data.data
    } else {
      alert('上传失败: ' + res.data.msg)
    }
  } catch (e) {
    console.error(e)
    alert('上传出错')
  }
}

onMounted(() => {
  fetchPlaylists()
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
  margin-bottom: 10px;
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
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-box input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-box button {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-box button:hover {
  background: #e5e5e5;
}

.btn-add {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add:hover {
  background: #45a049;
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

.table-cover {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}



.btn-edit,
.btn-delete {
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  margin-right: 15px;
}

.btn-edit {
  background: #2196F3;
  color: white;
}

.btn-edit:hover {
  background: #0b7dda;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.btn-delete:hover {
  background: #da190b;
}

.empty-data {
  text-align: center;
  padding: 40px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin: 20px 0;
}

.pagination button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
  background: #f5f5f5;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.form-row {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.form-row label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  height: 40px;
  background-color: #fff;
  color: #333;
}

.form-input:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

.form-row textarea.form-input {
  height: auto;
  min-height: 100px;
  resize: vertical;
}

.upload-box {
  border: 2px dashed #ddd;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  background: #fafafa;
}

.preview-img {
  max-width: 100%;
  max-height: 150px;
  margin-top: 10px;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel:hover {
  background: #e5e5e5;
}

.btn-confirm {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-confirm:hover {
  background: #45a049;
}
</style>
