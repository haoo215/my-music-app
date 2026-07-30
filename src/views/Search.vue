<template>
  <div class="search-page">
    <!-- 搜索框 -->
    <div class="search-box">
      <svg
        class="search-icon"
        viewBox="0 0 24 24"
        @click="handleSearch"
        :class="{ disabled: isLoading }"
      >
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57 l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0 C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>

      <input
        type="text"
        class="search-input"
        placeholder="请搜索歌曲或歌手..."
        v-model="searchKeyword"
        @keyup.enter="handleSearch"
        :disabled="isLoading"
      />
    </div>

    <!-- 场景 A: 热门推荐 -->
    <div v-if="!isSearched" class="default-section">
      <div class="section-title">
        <h3>🔥 热门推荐</h3>
        <span v-if="defaultLoading" class="loading-text">正在加载热门歌曲...</span>
      </div>
      
      <div class="songs-grid">
        <div
          class="song-card"
          v-for="song in defaultSongs"
          :key="'hot-' + song.id"
          @click="handlePlay(song)"
        >
          <div class="song-cover">
            <img
              :src="song.coverUrl || `https://picsum.photos/seed/hot${song.id}/200`"
              :alt="song.name"
              @error="e => e.target.src='https://picsum.photos/seed/default/200'"
            />
            <div class="play-overlay">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <div class="song-info">
            <h4>{{ song.name }}</h4>
            <p class="artist">{{ song.artist || '未知歌手' }}</p>
            <p class="stats">🔥 {{ formatPlayCount(song.playCount) }}</p>
          </div>
        </div>
      </div>
      
      <div v-if="!defaultLoading && defaultSongs.length === 0" class="empty-result">
        暂无热门歌曲推荐
      </div>
    </div>

    <!-- 场景 B: 搜索结果 -->
    <div v-else class="search-results">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>正在搜索 "{{ searchKeyword }}" ...</p>
      </div>

      <div v-else-if="errorMsg" class="error-message">
        <p>😢 {{ errorMsg }}</p>
        <button @click="handleSearch">重试</button>
      </div>

      <div v-else-if="!hasSearchResult" class="empty-result">
        <p>没有找到与「{{ searchKeyword }}」相关的内容</p>
        <p class="hint">试试搜索其他关键词吧~</p>
      </div>

      <div v-else>
        <div class="result-category" v-if="songs.length">
          <h3>🎵 歌曲</h3>
          <div class="songs-grid">
            <div
              class="song-card"
              v-for="song in songs"
              :key="song.id"
              @click="handlePlay(song)"
            >
              <div class="song-cover">
                <img
                  :src="song.coverUrl || `https://picsum.photos/seed/s${song.id}/200`"
                  :alt="song.name"
                  @error="e => e.target.src='https://picsum.photos/seed/default/200'"
                />
              </div>
              <div class="song-info">
                <h4>{{ song.name }}</h4>
                <p class="artist">{{ song.artist }}</p>
                <p class="stats">🔥 {{ formatPlayCount(song.playCount) }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="artists.length" class="result-category"><h3>👤 歌手</h3>...</div>
        <div v-if="recommendPlaylists.length" class="result-category"><h3>📀 歌单</h3>...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
const router = useRouter()
const searchKeyword = ref('')
const isSearched = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')
const songs = ref([])
const artists = ref([])
const recommendPlaylists = ref([])
const defaultLoading = ref(false)
const defaultSongs = ref([])
const hasSearchResult = computed(() => {
  return songs.value.length > 0 || artists.value.length > 0 || recommendPlaylists.value.length > 0
})

onMounted(() => {
  fetchHotSongs()
})

const fetchHotSongs = async () => {
  defaultLoading.value = true
  try {
    const res = await request.get('/song/hot')
    if (res.data.code === 200 || res.data.code === '200' || res.data.success) {
      defaultSongs.value = res.data.data || []
    } else {
      defaultSongs.value = []
    }
  } catch (error) {
    console.error('❌ 获取热门歌曲失败:', error)
    defaultSongs.value = []
  } finally {
    defaultLoading.value = false
  }
}
// 添加到歌单
async function handleAdd(song) {
  try {
    await request.post('/playlist/addSong', {
      songId: song.id,
      playlistId: data?.playListId  // ← 加可选链，防止 data 为 null
    })
    console.log('添加成功')
  } catch (error) {
    console.error('添加到歌单失败', error)
  }
}
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


const formatPlayCount = (count) => {
  if (!count && count !== 0) return '0'
  const num = Number(count)
  return num >= 10000 ? (num / 10000).toFixed(1) + '万' : num.toString()
}

const handleSearch = async () => {
  if (isLoading.value) return
  errorMsg.value = ''
  const keyword = searchKeyword.value.trim()
  
  if (!keyword) {
    isSearched.value = false
    songs.value = []
    artists.value = []
    recommendPlaylists.value = []
    return
  }

  isSearched.value = true
  try {
    isLoading.value = true
    const { data } = await request.get('/search', {
      params: { keyword, type: 'all' },
      timeout: 10000
    })

    if (data?.code === 200 || data?.code === '200' || data?.success) {
      const resultData = data.data
      if (Array.isArray(resultData)) {
        songs.value = resultData
      } else if (resultData && Array.isArray(resultData.songs)) {
        songs.value = resultData.songs
        artists.value = resultData.artists || []
        recommendPlaylists.value = resultData.playlists || []
      } else {
        songs.value = []
      }
    } else {
      errorMsg.value = data?.msg || '搜索失败'
      songs.value = []
    }
  } catch (err) {
    console.error(err)
    errorMsg.value = err.response?.data?.msg || '网络异常，请检查连接'
    songs.value = []
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>



.search-input::placeholder {
  color: #888;
}

/* 标题区域 */
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px; /* 增加标题与网格间距 */
  padding-left: 15px;
  border-left: 5px solid #ff6b90;
}

.section-title h3 {
  margin: 0;
  font-size: 24px; /* 标题字体加大 */
  font-weight: 700;
  letter-spacing: 1px;
}

.loading-text {
  font-size: 14px;
  color: #ff6b90;
  animation: pulse 1.5s infinite;
  margin-left: 15px;
}

/* 🔥 核心修改：网格间距变大 */
.songs-grid {
  display: grid;
  /* 最小列宽增加，自动减少每行数量，增加间距 */
  grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); 
  gap: 35px; /* 大幅增加卡片之间的间距 (原 20px) */
  margin-bottom: 50px; /* 增加区块底部间距 */
}

/* 歌曲卡片 */
.song-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px; /* 圆角稍大 */
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, background 0.3s, box-shadow 0.3s;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.05); /* 增加微弱边框 */
}

.song-card:hover {
  transform: translateY(-8px); /* 悬停上浮距离增加 */
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); /* 增加阴影 */
}

.song-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}

.song-card:hover .song-cover img {
  transform: scale(1.15); /* 图片放大效果更明显 */
}

.play-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); /* 遮罩加深 */
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.play-overlay svg {
  width: 60px; /* 播放图标变大 */
  height: 60px;
  fill: #fff;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6));
  transform: scale(0.8);
  transition: transform 0.3s;
}

.song-card:hover .play-overlay {
  opacity: 1;
}

.song-card:hover .play-overlay svg {
  transform: scale(1);
}

/* 🔥 核心修改：卡片内部信息间距 */
.song-info {
  padding: 30px 18px; /* 大幅增加内边距 (原 12px) */
  text-align: left;
}

.song-info h4 {
  margin: 0 0 10px; /* 增加标题下方间距 */
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
  line-height: 1.4;
}

.song-info .artist {
  margin: 0 0 8px; /* 增加歌手名下方间距 */
  font-size: 14px;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.song-info .stats {
  margin: 0;
  font-size: 13px;
  color: #ff6b90;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 结果分类标题 */
.result-category {
  margin-bottom: 50px; /* 增加分类块之间的间距 */
}

.result-category h3 {
  font-size: 22px;
  margin-bottom: 25px; /* 增加标题与网格间距 */
  padding-left: 10px;
  border-left: 4px solid #ff6b90;
  color: #fff;
}

/* 状态提示 */
.empty-result, .error-message, .loading-state {
  text-align: center;
  padding: 80px 20px; /* 增加垂直留白 */
  color: #888;
  font-size: 16px;
}

.error-message {
  color: #ff6b90;
}

.error-message button {
  margin-top: 20px;
  padding: 10px 25px;
  background: rgba(255, 107, 144, 0.2);
  border: 1px solid #ff6b90;
  color: #ff6b90;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.error-message button:hover {
  background: #ff6b90;
  color: #fff;
  transform: translateY(-2px);
}

.hint {
  font-size: 14px;
  margin-top: 15px;
  color: #666;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .search-page {
    padding: 20px;
  }
  .songs-grid {
    /* 移动端保持适当间距，但列宽减小 */
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 25px; 
  }
  .search-box {
    margin: 0 auto 40px;
    width: 90%;
    padding: 6px 20px;
  }
  .section-title h3 {
    font-size: 20px;
  }
  .song-info {
    padding: 15px;
  }
}
</style>