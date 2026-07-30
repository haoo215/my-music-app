<template>
  <div class="player-page">
    <!-- 如果没有播放列表，显示提示 -->
    <div v-if="!currentPlayListId" class="no-playlist-message">
      <h2>请先选择一个歌单开始播放</h2>
      <p>您可以从首页或搜索页面选择歌曲添加到播放列表</p>
      <button @click="$router.push('/')" class="go-home-btn">返回首页</button>
    </div>

    <div v-else class="player-page-container">
      <div>
        <div class="player-cover-section">
          <div class="player-cover" :class="{ playing: isPlaying }">
            <img :src="coverUrl" alt="Now Playing" @error="handleCoverError">
            <div class="vinyl-overlay">
              <div class="vinyl-center"></div>
            </div>
          </div>
        </div>
        <!-- 歌词显示区域 - 新增ref用于滚动 -->
        <div class="lyrics-section" v-if="lyrics.length > 0" ref="lyricsContainerRef">
          <div class="lyrics-line" v-for="(line, index) in lyrics" :key="index"
            :class="{ active: currentLyricIndex === index }">
            {{ line.text }} <!-- 修正：显示text字段 -->
          </div>
        </div>
        <!-- 状态兜底：区分加载中/无歌词/加载失败 -->
        <div v-else-if="isLoading" class="lyrics-placeholder">
          歌词加载中...
        </div>
        <div v-else-if="lyricError" class="lyrics-placeholder error">
          {{ lyricError }}
        </div>
        <div v-else class="lyrics-section">
          本歌曲暂无歌词，请联系管理员添加歌词
        </div>
      </div>

      <!-- 中间：播放控制区 -->
      <div class="player-controls-section">
        <div class="now-playing-label">
          <span class="playing-dot"></span> 正在播放
        </div>

        <h2 class="player-title">{{ songName }}</h2>

        <!-- 进度条 -->
        <div class="progress-section">
          <div class="progress-bar" @click="seekProgress">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            <div class="progress-thumb" :style="{ left: progress + '%' }"></div>
          </div>
          <div class="progress-time">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- 播放按钮 -->
        <div class="player-buttons">
          <button class="control-btn prev-btn" @click="playPrevSong">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" />
            </svg>
          </button>

          <button class="control-btn play-pause-btn" @click="togglePlay">
            <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </button>

          <button class="control-btn next-btn" @click="playNextSong">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        </div>

        <!-- 音量 -->
        <div class="volume-section">
          <svg class="volume-icon" viewBox="0 0 24 24">
            <path
              d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm4.38 2.57l-3.38-3.38v-2.21c1.48.73 2.5 2.25 2.5 4.03 0 .89-.22 1.72-.62 2.45zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          <div class="volume-slider" @click="adjustVolume">
            <div class="volume-fill" :style="{ width: volume + '%' }"></div>
            <div class="volume-thumb" :style="{ left: volume + '%' }"></div>
          </div>
        </div>

        <!-- 歌曲下拉框 + 内嵌删除按钮 -->
        <div class="select-with-delete">
          <select v-model="currentSongIndex" @change="changeSongBySelect" :disabled="songList.length === 0">
            <option v-for="(song, index) in songList" :key="song.id" :value="index">
              {{ song.name }}
            </option>
          </select>

          <button v-if="songList.length > 0" class="delete-inside-btn" @click="handleDeleteSongInPlaylist"
            title="从歌单中移除此歌曲">
            X
          </button>
        </div>

      </div>

      <!-- 右侧：评论区 -->
      <div class="comments-section">
        <div class="comments-header">
          <h3>歌曲评论</h3>
          <span class="comments-count">{{ comments.length }} 条首评论</span>
        </div>

        <!-- 评论加载状态 -->
        <div v-if="isCommentLoading" class="comment-loading">
          加载评论中...
        </div>

        <div v-else class="comments-list">
          <div class="comment-item" v-for="(comment, index) in comments" :key="comment.id || index">
            <div class="comment-avatar">
              <img :src="comment.avatar || `https://picsum.photos/seed/${comment.username}/60`" alt="User Avatar"
                @error="handleAvatarError">
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-username">{{ comment.username }}</span>
                <span class="comment-time">{{ formatCommentTime(comment.createdAt) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
            </div>
          </div>

          <!-- 空评论提示 -->
          <div v-if="comments.length === 0" class="empty-comments">
            暂无评论，快来抢沙发吧～
          </div>
        </div>

        <!-- 评论输入框 -->
        <div class="comment-input-section">
          <textarea placeholder="写下你的评论..." v-model="newComment" @keyup.enter.exact="handleEnterSubmit"
            @keydown.enter.exact.prevent=""></textarea>
          <button class="submit-comment-btn" @click="submitComment" :disabled="!newComment.trim() || isSubmitting">
            {{ isSubmitting ? '发布中...' : '发布' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import request from '../utils/request'
import { myAlert } from '@/utils/alert.js'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'


const progress = computed(() => {
  if (playerStore.duration <= 0) return 0
  return (playerStore.currentTime / playerStore.duration) * 100
})


const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()
// 直接解构 store 状态（响应式！）
const {
  isPlaying,
  songName,
  artistName,
  coverUrl,
  audioUrl,
  currentTime,
  duration,
  volume,
  audio
} = storeToRefs(playerStore)


// ===== 音频核心 =====

const lyricsContainerRef = ref(null)

const lyrics = ref([])
const isLoading = ref(false)
const lyricError = ref('')
const currentLyricIndex = ref(-1)

// ===== 热度统计相关 =====
const songHeat = ref(0)
const hasReportedPlay = ref(false)
const HEAT_THRESHOLD = 10

// ===== 歌曲ID =====
const songId = ref('')

// ===== 歌曲列表 =====
const songList = ref([])
const currentSongIndex = ref(0)
const { currentPlayListId } = storeToRefs(playerStore)



// ===== 评论区数据 =====
const comments = ref([])
const newComment = ref('')
const isCommentLoading = ref(false)
const isSubmitting = ref(false)



/**
 * 获取歌单列表
 */
const fetchSongList = async (playlistId) => {
  if (!playlistId) return

  try {
    const { data } = await request.post('/playlist/query_one', { id: playlistId })

    if (data?.code === '200' && Array.isArray(data.data)) {
      songList.value = data.data.map(song => {
        const realId = song.songId ?? song.song_id ?? song.id;

        return {
          id: String(realId),
          songId: String(realId),
          name: song.name || song.songName,
          artist: song.artist,
          coverUrl: song.coverUrl || `https://picsum.photos/seed/${realId}/600`,
          url: song.url,
          playCount: song.playCount || 0,
          heat: song.heat || 0
        }
      })
      console.log('歌单加载成功，共', songList.value.length, '首歌曲')
    } else {
      songList.value = []
    }
  } catch (err) {
    console.error('获取歌单失败:', err)
    songList.value = []
  }
}

/**
 * 获取歌曲评论
 */
const fetchSongComments = async (currentSongId) => {
  if (!currentSongId) {
    comments.value = []
    return
  }

  isCommentLoading.value = true
  try {
    const { data } = await request.get('/song-comments/one-list', {
      params: { songId: currentSongId }
    })

    if (data?.code === '200' && data.data?.records) {
      comments.value = data.data.records.map(comment => ({
        id: comment.id,
        username: comment.username || '未知用户',
        content: comment.content,
        createdAt: comment.createdAt,
        avatar: ''
      }))
    } else {
      comments.value = []
    }
  } catch (err) {
    console.error('获取评论失败:', err)
    comments.value = []
  } finally {
    isCommentLoading.value = false
  }
}

const formatCommentTime = (timeStr) => {
  if (!timeStr) return '未知时间'
  const date = new Date(timeStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 解析 LRC 歌词
 */
function parseLrc(lrcText) {
  const lines = lrcText.split('\n');
  const lyrics = [];

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const millis = parseInt(match[3].padEnd(3, '0'), 10);
      const time = mins * 60 + secs + millis / 1000;
      const text = match[4].trim();
      if (text) {
        lyrics.push({ time, text });
      }
    }
  }

  lyrics.sort((a, b) => a.time - b.time);
  return lyrics;
}

/**
 * 获取歌词
 */
const fetchLyrics = async (songId) => {
  try {
    isLoading.value = true;
    lyricError.value = '';
    lyrics.value = [];
    currentLyricIndex.value = -1;

    const res = await request({
      url: '/song/lyric',
      method: 'get',
      params: { songId }
    });

    if ((res.data.code === 200 || res.data.code === '200') && res.data.success) {
      const lyricText = res.data.data;

      if (typeof lyricText === 'string' && lyricText.trim()) {
        lyrics.value = parseLrc(lyricText);
      } else {
        lyrics.value = [];
      }
    } else {
      throw new Error(res.data.msg || '获取歌词失败');
    }
  } catch (err) {
    console.error('获取歌词出错:', err);
    lyricError.value = err.response?.data?.msg || err.message || '获取歌词失败，请稍后重试';
    lyrics.value = [];
  } finally {
    isLoading.value = false;
  }
};

/**
 * 更新歌词高亮
 */
const updateLyricHighlight = (currentTime) => {
  if (lyrics.value.length === 0) {
    currentLyricIndex.value = -1;
    return;
  }

  let newIndex = -1;
  for (let i = lyrics.value.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics.value[i].time) {
      newIndex = i;
      break;
    }
  }

  if (newIndex !== currentLyricIndex.value) {
    currentLyricIndex.value = newIndex;
    scrollToCurrentLyric();
  }
};

/**
 * 滚动歌词
 */
const scrollToCurrentLyric = () => {
  if (!lyricsContainerRef.value || currentLyricIndex.value === -1) return;

  const container = lyricsContainerRef.value;
  const lines = container.children;
  const currentLine = lines[currentLyricIndex.value];

  if (!currentLine) return;

  const containerStyle = window.getComputedStyle(container);
  const paddingTop = parseFloat(containerStyle.paddingTop) || 12;
  const paddingBottom = parseFloat(containerStyle.paddingBottom) || 12;
  const containerInnerHeight = container.clientHeight - paddingTop - paddingBottom;
  const containerHalfHeight = containerInnerHeight / 2;
  const lineHalfHeight = currentLine.offsetHeight / 2;

  const targetScrollTop = currentLine.offsetTop - containerHalfHeight + lineHalfHeight - paddingTop;

  container.scrollTo({
    top: Math.max(0, Math.min(targetScrollTop, container.scrollHeight - container.clientHeight)),
    behavior: 'smooth'
  });
};

// ====================== 删除歌单中的歌曲 ======================
const handleDeleteSongInPlaylist = async () => {
  if (currentSongIndex.value == null) {
    alert('请先选择要删除的歌曲')
    return
  }

  const song = songList.value[currentSongIndex.value]
  if (!song) return

  if (!confirm(`确定要从歌单中删除【${song.name}】吗？`)) return

  try {
    const res = await request.delete('/playlist/deleteSong', {
      data: {
        playlistId: currentPlayListId.value,
        songId: song.id
      }
    })

    if (res.data.code === '200') {
      alert('删除成功！')
      await fetchSongList(currentPlayListId.value)

      if (songList.value.length > 0) {
        await playSongByIndex(0, false)
      } else {
        audioUrl.value = ''
        songName.value = '歌单已空'
      }
    } else {
      myAlert(res.data.msg || '删除失败')
    }
  } catch (e) {
    console.error(e)
    alert('删除请求异常')
  }
}

/**
 * 播放指定索引的歌曲
 */
const playSongByIndex = async (index, autoPlay = false) => {
  if (index < 0 || index >= songList.value.length) {
    console.warn('歌曲索引超出范围', index);
    return;
  }
  playerStore.setPlayList(songList.value, index)
  const song = songList.value[index];
  console.log('准备播放歌曲：',song);
  currentSongIndex.value = index;

  hasReportedPlay.value = false;
  songHeat.value = song.playCount || song.heat || 0;

  playerStore.setSong({
    id: song.id,
    name: song.name,
    artistName: song.artist,
    coverUrl: song.coverUrl,
    url: song.url
  })
  songId.value = song.id
  await Promise.all([
    fetchSongComments(songId.value),
    fetchLyrics(songId.value)
  ]);

  if (!autoPlay) {
    currentTime.value = 0;
    currentLyricIndex.value = -1;
  }

  await nextTick();

  if (autoPlay) {
    playerStore.play()
  } else {
    playerStore.pause()
  }
};



/**
 * 上报播放次数
 */
let isReporting = false; // 全局锁

const reportPlayCount = async () => {
  if (isReporting || hasReportedPlay.value) return;

  const today = new Date().toDateString();
  const reportKey = `play_report_${today}_${songId.value}`;

  if (localStorage.getItem(reportKey)) {
    hasReportedPlay.value = true;
    return;
  }

  isReporting = true; // 上锁

  try {
    const { data } = await request.post('/song/playCount', { id: songId.value });
    if (data?.code === '200' || data?.success) {
      console.log('✅ 播放次数上报成功');
      songHeat.value++;
      localStorage.setItem(reportKey, 'true');
      hasReportedPlay.value = true;
    }
  } catch (err) {
    console.error('上报播放次数失败:', err);
  } finally {
    isReporting = false; // 解锁（无论成功失败）
  }
};

/**
 * 播放控制
 */
const togglePlay = () => playerStore.togglePlay()

const playPrevSong = () => {
  if (songList.value.length === 0) return
  let newIndex = currentSongIndex.value - 1
  if (newIndex < 0) newIndex = songList.value.length - 1
  playSongByIndex(newIndex, true)
}

const playNextSong = () => {
  if (songList.value.length === 0) return
  let newIndex = currentSongIndex.value + 1
  if (newIndex >= songList.value.length) newIndex = 0
  playSongByIndex(newIndex, true)
}

const changeSongBySelect = () => {
  playSongByIndex(currentSongIndex.value, true)
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}



const seekProgress = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  const newTime = percent * duration.value
  playerStore.seek(newTime)
}

const adjustVolume = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  playerStore.setVolume(percent) //  调用 store 方法
}

/**
 * 评论发布逻辑
 */
const doSubmitComment = async () => {
  if (isSubmitting.value) return;
  const commentText = newComment.value.trim()
  if (!commentText) {
    alert('评论内容不能为空！');
    return;
  }
  if (!songId.value) {
    alert('当前无播放歌曲，无法发布评论！');
    return;
  }

  try {
    isSubmitting.value = true;
    const { data } = await request.post('/song-comments/add', {
      songId: songId.value,
      content: commentText,
      parentId: 0
    });

    if (data?.code === '200' || data?.success) {
      newComment.value = '';
      await fetchSongComments(songId.value);
      alert('评论发布成功！');
    } else {
      alert(`发布失败：${data?.msg || '服务器异常'}`);
    }
  } catch (err) {
    console.error('发布评论失败:', err);
    alert('发布失败，请稍后重试！');
  } finally {
    isSubmitting.value = false;
  }
};

const handleEnterSubmit = () => doSubmitComment();
const submitComment = () => doSubmitComment();

// 错误处理
const handleCoverError = (e) => {
  e.target.src = 'https://picsum.photos/seed/default-cover/600'
}

const handleAvatarError = (e) => {
  e.target.src = 'https://picsum.photos/seed/default-avatar/60'
}

const handleAudioError = (e) => {
  const audio = e.target;
  const err = audio.error;
  isPlaying.value = false;
  if (!err) return;

  let msg = '';
  switch (err.code) {
    case 1: msg = '播放被中止'; break;
    case 2: msg = '网络错误'; break;
    case 3: msg = '解码错误'; break;
    case 4: msg = '资源不存在 (404) 或跨域问题'; break;
    default: msg = `未知错误 (${err.code})`;
  }
  console.error(`❌ 播放失败：${msg}`, audio.src);
  alert(`播放失败：${msg}`);
}

/**
 * 页面加载逻辑
 */
onMounted(async () => {
  console.log('🎵 播放页面加载')

  const routeSongId = route.query.songId

  const {
    currentPlayListId,
    songId: savedSongId,
    currentTime: savedTime,
    isPlaying: shouldPlay
  } = storeToRefs(playerStore)

  // 如果没有播放列表ID，尝试从服务器获取用户的播放信息
  if (!currentPlayListId.value) {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      try {
        const res = await request.get('/user/playInfo')
        if (res.data.code === '200' && res.data.success) {
          const data = res.data.data
          playerStore.setPlaylistId(data.playListId)
          // 可以设置其他信息，如用户信息，但这里主要设置 playlistId
        }
      } catch (err) {
        console.error('获取用户播放信息失败:', err)
      }
    }
  }

  if (!currentPlayListId.value) return

  await fetchSongList(currentPlayListId.value)

  if (songList.value.length === 0) return

  let targetIndex = 0

  // 优先用路由
  if (routeSongId) {
    const idx = songList.value.findIndex(
      s => String(s.id) === String(routeSongId)
    )
    if (idx !== -1) targetIndex = idx
  }
  // 否则用缓存
  else if (savedSongId.value) {
    const idx = songList.value.findIndex(
      s => String(s.id) === String(savedSongId.value)
    )
    if (idx !== -1) targetIndex = idx
  }

  currentSongIndex.value = targetIndex

  const targetSong = songList.value[targetIndex]


  if (routeSongId) {
    await playSongByIndex(targetIndex, true)
  }
  else if (!playerStore.songId) {
    await playSongByIndex(targetIndex, false)
  }
  else {
    songId.value = targetSong.id

    await Promise.all([
      fetchSongComments(targetSong.id),
      fetchLyrics(targetSong.id)
    ])
  }

  // ✅ 6. 恢复进度
  if (savedTime.value > 0) {
    playerStore.seek(savedTime.value)
  }

  // 添加自动播放下一首的监听器
  if (audio.value) {
    audio.value.addEventListener('ended', playNextSong)
  }
})
watch(
  () => route.params.id,
  async (newId) => {
    if (!newId || songList.value.length === 0) return
    const idx = songList.value.findIndex(s => s.id === String(newId))
    if (idx !== -1) {
      await playSongByIndex(idx, true)
    }
  },
  { immediate: true }
)

watch(currentTime, (val) => {
  updateLyricHighlight(val)
})

onUnmounted(() => {
  // 移除自动播放监听器
  if (audio.value) {
    audio.value.removeEventListener('ended', playNextSong)
  }
})
</script>

<style scoped>
.comment-loading {
  text-align: center;
  padding: 20px;
  color: #999;
}

.active {
  color: red;
}

/* 整体页面容器 */
.player-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 40px 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 无播放列表提示 */
.no-playlist-message {
  text-align: center;
  color: #fff;
  max-width: 400px;
}

.no-playlist-message h2 {
  font-size: 24px;
  margin-bottom: 16px;
  color: #ff6b90;
}

.no-playlist-message p {
  font-size: 16px;
  margin-bottom: 24px;
  color: #ccc;
}

.go-home-btn {
  background: linear-gradient(135deg, #ff6b90 0%, #ff477e 100%);
  border: none;
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}

.go-home-btn:hover {
  background: linear-gradient(135deg, #ff477e 0%, #ff2f6e 100%);
}

.player-page-container {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 40px;
  width: 100%;
  max-width: 1200px;
  align-items: center;
}

/* 专辑封面区 */
.player-cover-section {
  display: flex;
  justify-content: center;
  align-items: center;
}

.player-cover {
  width: 320px;
  height: 320px;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 60px rgba(255, 107, 144, 0.3);
  transition: transform 0.3s ease;
}

.player-cover.playing {
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.player-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vinyl-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vinyl-center {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle at center, #ff6b90 0%, #ff477e 100%);
}

/* 播放控制区 */
.player-controls-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  text-align: center;
}

.now-playing-label {
  color: #ff6b90;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.playing-dot {
  width: 8px;
  height: 8px;
  background: #ff6b90;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.player-title {
  color: #fff;
  font-size: 32px;
  font-weight: 600;
  margin: 0;
}

.progress-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b90 0%, #ff477e 100%);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  left: 0;
  width: 12px;
  height: 12px;
  background: #ff6b90;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.2s;
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
}

.progress-time {
  display: flex;
  justify-content: space-between;
  color: #888;
  font-size: 14px;
}

/* 播放按钮样式 */
.player-buttons {
  display: flex;
  align-items: center;
  gap: 24px;
}

.control-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  padding: 8px;
  background-color: #ff477e;
}

.control-btn svg {
  width: 24px;
  height: 24px;
  fill: #fff;
}

.control-btn:hover {
  transform: scale(1.1);
}

.play-pause-btn {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #ff6b90 0%, #ff477e 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(255, 107, 144, 0.4);
}

.play-pause-btn svg {
  width: 28px;
  height: 28px;
  fill: #fff;
}

/* 音量控制 */
.volume-section {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 150px;
}

.volume-icon {
  width: 20px;
  height: 20px;
  fill: #888;
}

.volume-slider {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.volume-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b90 0%, #ff477e 100%);
  border-radius: 2px;
}

.volume-thumb {
  position: absolute;
  top: 50%;
  left: 0;
  width: 10px;
  height: 10px;
  background: #ff6b90;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.2s;
}

.volume-slider:hover .volume-thumb {
  opacity: 1;
}

/* 下拉框 + 内嵌删除按钮（深色主题完美适配） */
.select-with-delete {
  position: relative;
  width: 380px;
  margin: 10px 0;
}

.select-with-delete select {
  width: 100%;
  padding: 10px 36px 10px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 107, 144, 0.3);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.select-with-delete select option {
  background: #16213e;
  color: #fff;
}

.delete-inside-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  line-height: 22px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-inside-btn:hover {
  background: #ff477e !important;
  color: #fff !important;
}

/* 评论区 */
.comments-section {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 24px;
  height: 500px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
}

.comments-header h3 {
  color: #fff;
  font-size: 20px;
  margin: 0;
}

.comments-count {
  color: #888;
  font-size: 14px;
}

.comments-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comments-list::-webkit-scrollbar {
  width: 6px;
}

.comments-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb {
  background: rgba(255, 107, 144, 0.5);
  border-radius: 3px;
}

.empty-comments {
  color: #666;
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-username {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.comment-time {
  color: #666;
  font-size: 12px;
}

.comment-text {
  color: #ddd;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.comment-input-section {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.comment-input-section textarea {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 14px;
  color: #fff;
  resize: none;
  min-height: 48px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.comment-input-section textarea:focus {
  outline: none;
  border-color: rgba(255, 107, 144, 0.5);
}

.comment-input-section textarea::placeholder {
  color: #666;
}

.submit-comment-btn {
  background: linear-gradient(135deg, #ff6b90 0%, #ff477e 100%);
  border: none;
  color: #fff;
  padding: 0 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}

.submit-comment-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-comment-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff477e 0%, #ff2f6e 100%);
}

/* 响应式适配 */
@media (max-width: 1024px) {
  .player-page-container {
    grid-template-columns: 1fr 1.5fr;
    gap: 20px;
  }

  .comments-section {
    grid-column: 1 / -1;
    height: 300px;
  }
}

@media (max-width: 768px) {
  .player-page {
    padding: 20px;
  }

  .player-page-container {
    grid-template-columns: 1fr;
  }

  .player-cover {
    width: 240px;
    height: 240px;
  }

  .player-title {
    font-size: 24px;
  }
}

.lyrics-section {
  width: 100%;
  max-height: 105px;
  overflow-y: auto;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-top: 90px;
  color: #ddd;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
  position: relative;
}

.lyrics-line {
  opacity: 0.7;
  transition: all 0.2s ease;
  margin: 2px 0;
}

.lyrics-line.active {
  opacity: 1;
  color: #ff6b90;
  font-weight: bold;
  transform: scale(1.05);
}

.lyrics-section::-webkit-scrollbar {
  width: 4px;
}

.lyrics-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.lyrics-section::-webkit-scrollbar-thumb {
  background: rgba(255, 107, 144, 0.5);
  border-radius: 2px;
}
</style>