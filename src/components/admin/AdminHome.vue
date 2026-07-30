<template>
  <div class="content-panel">
    <div class="panel-header">
      <h2>主页配置</h2>
      <button class="btn-add" @click="handleSaveHomeConfig">保存配置</button>
    </div>
    <div class="home-form">
      <div class="form-row">
        <label>主页标题</label>
        <input v-model="homeConfig.title" class="form-input" />
      </div>
      <div class="form-row">
        <label>首页公告</label>
        <textarea v-model="homeConfig.notice" rows="4" class="form-input"></textarea>
      </div>
      <div class="form-row">
        <label>热门歌单</label>
        <input v-model="homeConfig.recommendPlaylistIds" placeholder="逗号分隔，例如：1,2,3" class="form-input" />
      </div>
      <div class="form-row">
        <label>热门歌曲</label>
        <input v-model="homeConfig.newAlbumIds" placeholder="逗号分隔，例如：10,11" class="form-input" />
      </div>
      <div class="form-row">
        <label>Hero标题</label>
        <input v-model="homeConfig.heroTitle" placeholder="例如：午夜漫步" class="form-input" />
      </div>
      <div class="form-row">
        <label>Hero副标题</label>
        <input v-model="homeConfig.heroSubtitle" placeholder="例如：周深 · 2026精选专辑" class="form-input" />
      </div>
      <div class="form-row">
        <label>Hero封面</label>
        <div class="upload-box">
          <input type="file" @change="(e) => handleUploadImage(e, homeConfig, 'heroCoverUrl')" accept="image/*" />
          <img v-if="homeConfig.heroCoverUrl" :src="homeConfig.heroCoverUrl" class="preview-img" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const homeConfig = ref({
  title: '',
  notice: '',
  recommendPlaylistIds: '',
  newAlbumIds: '',
  heroTitle: '',
  heroSubtitle: '',
  heroCoverUrl: '',
  heroTargetId: ''
})

const fetchHomeConfig = async () => {
  try {
    const res = await request.get('/home/config/get')
    if (res.data.code === '200') {
      homeConfig.value = res.data.data
    }
  } catch (e) {
    console.error('Fetch home config error:', e)
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

const handleSaveHomeConfig = async () => {
  try {
    await request.post('/home/config/save', homeConfig.value)
    alert('主页配置保存成功')
  } catch (e) {
    alert('保存失败')
  }
}

onMounted(() => {
  fetchHomeConfig()
})
</script>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.btn-add {
  padding: 8px 16px;
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add:hover {
  background: #219653;
}

.home-form {
  padding: 20px 0;
}

.form-row {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.form-row label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
}

.form-input:focus {
  outline: none;
  border-color: #0288d1;
  box-shadow: 0 0 0 2px rgba(2, 136, 209, 0.1);
}

.upload-box {
  border: 2px dashed #ddd;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  background: #fafafa;
}

.upload-box input[type="file"] {
  cursor: pointer;
  display: none;
}

.upload-box:hover {
  border-color: #0288d1;
  background: #f0f8ff;
}

.preview-img {
  max-width: 200px;
  max-height: 200px;
  margin-top: 10px;
  border-radius: 4px;
}
</style>
