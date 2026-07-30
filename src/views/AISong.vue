<template>
  <div class="ai-song-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>AI比她更懂你</h1>
      <p>输入你的心情，AI为你匹配专属歌曲</p>
    </div>

    <!-- 核心功能区 -->
    <div class="ai-container">
      <!-- 心情输入区域 -->
      <div class="input-section">
        <textarea
          v-model="userInput"
          rows="5"
          placeholder="例如：今天失恋了，感觉世界都是灰色的..."
          class="mood-input"
        ></textarea>
        <button 
          class="submit-btn" 
          @click="submitMood" 
          :disabled="loading"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? 'AI正在分析你的心情...' : '立即匹配歌曲' }}
        </button>
      </div>

      <!-- 匹配结果区域 -->
      <div class="result-section" v-if="hasResult">
        <div class="result-header">
          <span>AI识别标签：</span>
          <span class="tag">{{ matchedTag }}</span>
        </div>

        <!-- 歌曲列表 -->
        <div class="song-list" v-if="songList.length > 0">
          <h3>为你推荐的歌曲</h3>
          <div v-for="song in songList" :key="song.id" class="song-card">
            <div class="song-info">
              <span class="song-name">{{ song.name }}</span>
              <span class="song-singer">{{ song.artist }}</span>
              <button 
                class="play-btn"
                @click="handlePlay(song)"
              >播放</button>
            </div>
          </div>
        </div>

        <!-- 无结果提示 -->
        <div class="empty-tip" v-if="songList.length === 0">
          <div class="empty-icon">📭</div>
          <p>暂无匹配的歌曲，换个心情试试吧～</p>
        </div>
      </div>
    </div>

    <!-- 新增：提示框 DOM -->
    <div 
      v-if="showToast" 
      class="toast" 
      :class="{ 
        warning: toastMessage.includes('请输入'), 
        error: toastMessage.includes('失败'),
        info: !toastMessage.includes('请输入') && !toastMessage.includes('失败')
      }"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { checkAuth } from '../utils/request'
import { ref, onBeforeUnmount } from 'vue'
import { myAlert } from '@/utils/alert.js';
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
const isUnmounted = ref(false)

onBeforeUnmount(() => {
  isUnmounted.value = true
})

const router = useRouter()

// 响应式数据
const userInput = ref('')
const loading = ref(false)
const matchedTag = ref('')
const songList = ref([])
const hasResult = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
// 提示框功能（替代 ElMessage）
const showMessage = (msg, type = 'info') => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 提交心情分析
// 替换原有 submitMood 方法中的请求逻辑
const submitMood = async () => {

  // 第一步：校验登录
  if (!checkAuth()) return

  // 第二步：已登录 → 执行你的功能
  console.log("已登录，开始发布")

  const text = userInput.value.trim();
  if (!text) {
    showMessage('请输入你的心情文字～', 'warning');
    return;
  }

  loading.value = true;
  hasResult.value = false;
  songList.value = [];
  matchedTag.value = '';

  try {
   
    const { data } = await request.post('/ai/match-songs', { text });

    if (data.code === '200' || data.code === 200) {
      matchedTag.value = data.data?.tag || '未知风格';
      songList.value = data.data?.songs || [];

      if (songList.value.length > 0) {
        hasResult.value = true;
        showMessage(`匹配成功！为你找到 ${songList.value.length} 首歌曲`, 'success');
      } else {
        showMessage('暂时没找到匹配的歌曲，换个心情试试？', 'warning');
      }
    } else {
        myAlert(data.msg );
      // throw new Error(data.message || data.msg || '匹配失败');
    }
  } finally {
    loading.value = false;
  }
};
async function handlePlay(song) {
  try {
    //  加入歌单
    await request.post('/playlist/addSong', {
      songId: song.id,
      playlistId: playerStore.currentPlayListId
    })
    //  设置播放列表ID
    playerStore.setPlaylistId(playerStore.currentPlayListId)

    // 跳转页面
   router.push({
      path: '/player',
      query: { songId: song.id }
    })

  } catch (error) {
    console.error('播放失败', error)
  }
}


</script>

<style scoped>
/* 基础样式 */
.ai-song-page {
  padding: 30px 20px;
  max-width: 1000px;
  margin: 0 auto;
  min-height: calc(100vh - 60px);
  background-color: transparent;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;

}

.page-header h1 {
  font-size: 28px;
  color: #FFF;
  margin-bottom: 10px;
}

.page-header p {
  font-size: 16px;
  color: #FFF;
}

.ai-container {
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.05);
}

/* 输入区域 */
.input-section {
  margin-bottom: 40px;
}

.mood-input {
  width: 100%;
  font-size: 16px;
  padding: 15px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  margin-bottom: 20px;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.mood-input:focus {
  border-color: #409eff;
}

.submit-btn {
  width: 100%;
  height: 50px;
  font-size: 18px;
  border: none;
  border-radius: 8px;
  background-color: #409eff;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background-color 0.2s;
}

.submit-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #fff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 结果区域 */
.result-section {
  margin-top: 30px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
}

.tag {
  background-color: #e8f4ff;
  color: #409eff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.song-list h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 20px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.song-card {
  padding: 15px;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  margin-bottom: 15px;
  transition: box-shadow 0.2s;
}

.song-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.song-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
   text-align: center;
}

.song-name {
  font-size: 17px;
  font-weight: 500;
  color: #333;
   flex: 1;
  text-align: left;
  font-weight: bold;
}


.song-singer {
  font-size: 14px;
  color: #999;
  margin-right: 200px;
 flex: 1;
  text-align: center; /* 真正稳定居中 */
  padding: 0 8px;
}

.play-btn {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.play-btn::before {
  content: '🎧';
}

/* 空提示 */
.empty-tip {
  padding: 40px 0;
  text-align: center;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.empty-tip p {
  color: #999;
  font-size: 16px;
}

/* 提示框 */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 4px;
  color: #fff;
  z-index: 9999;
  animation: fade 0.3s ease;
}

.toast.warning {
  background-color: #e6a23c;
}

.toast.error {
  background-color: #f56c6c;
}

.toast.info {
  background-color: #67c23a;
}

@keyframes fade {
  from { opacity: 0; top: 10px; }
  to { opacity: 1; top: 20px; }
}
</style>