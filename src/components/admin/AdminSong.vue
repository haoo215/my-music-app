<template>
  <div class="content-panel">
    <div class="panel-header">
      <h2>歌曲列表</h2>
      <div class="header-actions">
        <div class="search-box">
          <input v-model="songPage.keyword" placeholder="搜索歌曲/歌手..." @keyup.enter="fetchSongs(1)" />
          <button @click="fetchSongs(1)">搜索</button>
        </div>
        <button class="btn-add" @click="handleAddSong">新增歌曲</button>
      </div>
    </div>
    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>歌曲名</th>
            <th>歌手</th>
            <th>封面</th>
            <th>播放量</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="song in songList" :key="song.id">
            <td>{{ song.id }}</td>
            <td>{{ song.name }}</td>
            <td>{{ song.artist }}</td>
            <td>
              <img :src="song.coverUrl" alt="封面" class="table-cover"
                @error="e => e.target.src = 'https://picsum.photos/seed/default/50'">
            </td>
            <td>{{ song.playCount }}</td>
            <td>
              {{
                song.status === 1 ? '正常' :
                song.status === 0 ? '下架' :
                song.status === 3 ? '上架待处理' :
                song.status === 4 ? '下架待处理' : '未知状态'
              }}
            </td>
            <td class="operate"  style="text-align: center; ">
              <button class="btn-edit" @click="handleStatusChange(song.id, 3, '上传', 'song')">上传</button>
              <button class="btn-delete" @click="handleStatusChange(song.id, 4, '下架', 'song')">下架</button>
              <button class="btn-view" @click="handleShowLyrics(song)">歌词</button>
              <button class="btn-edit" @click="handleEditSong(song)">编辑</button>
              <button class="btn-delete" @click="handleDeleteSong(song.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pagination" v-if="songPage.total > 0">
      <button :disabled="songPage.pageNum === 1" @click="changeSongPage(songPage.pageNum - 1)">上一页</button>
      <span>第 {{ songPage.pageNum }} 页 / 共 {{ Math.ceil(songPage.total / songPage.pageSize) }} 页</span>
      <button :disabled="songPage.pageNum * songPage.pageSize >= songPage.total"
        @click="changeSongPage(songPage.pageNum + 1)">下一页</button>
    </div>
    <div v-if="songList.length === 0" class="empty-data">暂无歌曲数据</div>

    <!-- 模态框 -->
    <div v-if="showSongModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ isEdit ? '编辑歌曲' : '新增歌曲' }}</h3>
        <div class="form-row">
          <label>歌曲名</label>
          <input v-model="songForm.name" class="form-input" />
        </div>
        <div v-if="!isEdit" class="form-row">
          <label>歌手</label>
          <input v-model="songForm.artist" class="form-input" />
        </div>
        <div v-if="!isEdit" class="form-row">
          <label>封面</label>
          <div class="upload-box">
            <input type="file" @change="(e) => handleUploadImage(e, songForm, 'coverUrl')" accept="image/*" />
            <img v-if="songForm.coverUrl" :src="songForm.coverUrl" class="preview-img" />
          </div>
        </div>
        <div class="form-row">
          <label>歌曲风格</label>
          <div class="select-multiple-box">
            <select v-model="songForm.styleIds" multiple class="form-input multiple-select" size="6">
              <option v-for="style in songStyles" :key="style.id" :value="style.id"
                :disabled="isStyleOptionDisabled(style.id)">
                {{ style.name }}
              </option>
            </select>
            <div class="form-hint">
              已选{{ songForm.styleIds?.length || 0 }} / {{ MAX_STYLE_COUNT }} 项
              <span v-if="(songForm.styleIds?.length || 0) >= MAX_STYLE_COUNT" style="color: #e74c3c;">
                （已达上限）
              </span>
            </div>
          </div>
        </div>
        <div class="form-row">
          <label>VIP专属歌曲</label>
          <div class="switch-box">
            <label class="switch">
              <input type="checkbox" v-model="songForm.isVip" />
              <span class="slider round"></span>
            </label>
            <span class="switch-text">{{ songForm.isVip ? '是' : '否' }}</span>
          </div>
        </div>
        <div v-if="!isEdit" class="form-row">
          <label>歌曲文件</label>
          <div class="upload-box">
            <input type="file" @change="(e) => handleUploadAudio(e, songForm, 'url')" accept="audio/*" />
            <div v-if="songForm.duration" class="duration-text">
              音频时长: {{ songForm.duration }}
            </div>
          </div>
        </div>
        <div class="form-row">
          <label>歌词识别</label>
          <div class="upload-box">
            <input type="file" @change="(e) => handleUploadLyric(e, songForm, 'lyric')" accept=".lrc,.txt,text/plain" />
          </div>
          <div v-if="lyricMessage" :class="`lyric-status ${lyricMessage.startsWith('❌') ? 'error' : 'success'}`">
            {{ lyricMessage }}
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showSongModal = false" class="btn-cancel">取消</button>
          <button @click="submitSong" class="btn-confirm">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import request from '@/utils/request'
import { myAlert } from '@/utils/alert.js'

const songPage = ref({ pageNum: 1, pageSize: 10, total: 0, keyword: '' })
const songList = ref([])
const songForm = ref({})
const showSongModal = ref(false)
const isEdit = ref(false)
const songStyles = ref([])
const lyricMessage = ref('')
const MAX_STYLE_COUNT = 3

const fetchSongs = async (pageNum) => {
  if (pageNum) songPage.value.pageNum = pageNum
  try {
    const res = await request.get('/song/list', {
      params: {
        pageNum: songPage.value.pageNum,
        pageSize: songPage.value.pageSize,
        keyword: songPage.value.keyword
      }
    })
    if (res.data.code === '200') {
      songList.value = res.data.data.records
      songPage.value.total = res.data.data.totalRow
    }
  } catch (e) {
    console.error('Fetch songs error:', e)
  }
}

const changeSongPage = (pageNum) => fetchSongs(pageNum)

const fetchSongStyles = async () => {
  try {
    const res = await request.get('/song-styles/list')
    if (res.data.code === '200') {
      songStyles.value = res.data.data
    }
  } catch (e) {
    console.error('加载歌曲风格失败', e)
  }
}

const isStyleOptionDisabled = (styleId) => {
  const selected = songForm.value.styleIds || []
  return selected.length >= MAX_STYLE_COUNT && !selected.includes(styleId)
}

watch(
  () => songForm.value.styleIds,
  (newVal) => {
    if (Array.isArray(newVal) && newVal.length > MAX_STYLE_COUNT) {
      songForm.value.styleIds = newVal.slice(0, MAX_STYLE_COUNT)
    }
  },
  { deep: true }
)

const handleAddSong = () => {
  songForm.value = {
    styleIds: [],
    isVip: false
  }
  isEdit.value = false
  showSongModal.value = true
}

const handleEditSong = (song) => {
  songForm.value = JSON.parse(JSON.stringify({
    ...song,
    styleIds: Array.isArray(song.styleIds) ? song.styleIds : (Array.isArray(song.style) ? song.style : [])
  }))
  isEdit.value = true
  showSongModal.value = true
}

const submitSong = async () => {
  try {
    if (isEdit.value) {
      const submitData = {
        id: songForm.value.id,
        name: songForm.value.name,
        styleIds: songForm.value.styleIds,
        isVip: songForm.value.isVip ? 1 : 0,
        lyric: songForm.value.lyric
      }
      await request.put('/song/update', submitData)
    } else {
      const submitData = { ...songForm.value }
      submitData.isVip = submitData.isVip ? 1 : 0
      submitData.styleIds = submitData.styleIds || []
      await request.post('/song/add', submitData)
    }
    showSongModal.value = false
    fetchSongs()
  } catch (e) {
    console.error(e)
    alert('操作失败')
  }
}

const handleDeleteSong = async (id) => {
  if (confirm('确定删除？')) {
    try {
      await request.delete(`/song/delete/${id}`)
      fetchSongs()
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
    fetchSongs()
  } catch (e) {
    console.error('Status update error:', e)
    const msg = e.response?.data?.msg || e.message || '操作失败'
    alert(`${actionName}失败：${msg}`)
  }
}

const handleShowLyrics = (song) => {
  if (!song.lyric || !song.lyric.trim()) {
    myAlert('该歌曲暂未上传歌词')
    return
  }
  const lines = song.lyric
    .split(/[\r\n]+/)
    .map(line => line.trim())
    .filter(line => line && line.includes('['))
    .map(line => {
      return line.replace(/\[\d{2}:\d{2}\.\d{2}\]/g, '').trim()
    })
    .filter(text => text)
  const formattedLyrics = lines.join('\n')
  myAlert(formattedLyrics, 0)
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

const formatTimegec = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const secondsRemain = Math.floor(seconds % 60)
  return `${minutes}:${secondsRemain.toString().padStart(2, '0')}`
}

const handleUploadAudio = async (e, form, field) => {
  const file = e.target.files[0]
  if (!file) return
  const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/aac']
  if (!allowedTypes.includes(file.type)) {
    alert('请上传正确的音频文件（支持 MP3、WAV、AAC）')
    return
  }
  try {
    const durationData = await new Promise((resolve, reject) => {
      const audio = new Audio()
      audio.src = URL.createObjectURL(file)
      audio.onloadedmetadata = () => {
        const totalSeconds = audio.duration
        const duration = formatTimegec(totalSeconds)
        const durationSeconds = Math.floor(totalSeconds)
        URL.revokeObjectURL(audio.src)
        resolve({ duration, durationSeconds })
      }
      audio.onerror = () => {
        URL.revokeObjectURL(audio.src)
        reject(new Error('音频文件解析失败'))
      }
    })
    form.duration = durationData.duration
    form.durationSeconds = durationData.durationSeconds
    const formData = new FormData()
    formData.append('filedata', file)
    const response = await request.post('/upload/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const url = response.data?.url || response.data?.data || ''
    if (!url) {
      alert('上传成功，但未获取到播放地址')
      return
    }
    form[field] = url
    form.fileName = file.name
    alert('音频上传成功！')
  } catch (error) {
    console.error('音频上传失败：', error)
    alert('音频上传失败：' + (error.message || '服务异常'))
  }
}

const handleUploadLyric = async (e, form, field) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (!/\.(lrc|txt)$/i.test(file.name)) {
    lyricMessage.value = '❌ 请上传 .lrc 或 .txt 格式的歌词文件'
    return
  }
  const formData = new FormData()
  formData.append('file', file)
  try {
    lyricMessage.value = ''
    const res = await request.post('/upload/lyric', formData)
    if (res.data.code === 200 || res.data.code === '200') {
      lyricMessage.value = '✅ 歌词识别成功！'
      form[field] = res.data?.lyrics || res.data.data
    } else {
      lyricMessage.value = '⚠️ ' + (res.data?.message || '服务器处理失败')
    }
  } catch (err) {
    console.error('歌词上传失败:', err)
    const msg = err.res?.data?.message || err.message || '网络错误'
    lyricMessage.value = '❌ 歌词上传失败: ' + msg
  } finally {
    e.target.value = ''
  }
}

onMounted(() => {
  fetchSongs()
  fetchSongStyles()
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
  text-align: center;
}

.admin-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #666;
  text-align: center;
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
.btn-view,
.btn-delete {
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  margin-right: 15px  ;
}

.btn-edit {
  background: #2196F3;
  color: white;
}

.btn-edit:hover {
  background: #0b7dda;
}

.btn-view {
  background: #3e2872;
  color: white;
}

.btn-view:hover {
  background: #2a1a52;
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
  color: #444;
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
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 20px auto;
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

.multiple-select {
  height: 120px;
}

.form-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.switch-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background: #27ae60;
}

input:checked + .slider:before {
  transform: translateX(26px);
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
}

.duration-text {
  color: #27ae60;
  font-size: 12px;
  margin-top: 8px;
}

.lyric-status {
  font-size: 12px;
  margin-top: 8px;
}

.lyric-status.success {
  color: #27ae60;
}

.lyric-status.error {
  color: #e74c3c;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel {
  padding: 8px 16px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.btn-confirm {
  padding: 8px 16px;
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
