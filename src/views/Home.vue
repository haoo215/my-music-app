<template>
  <div>
    <!-- Hero区域 -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          全新改版 · 极致体验
        </div>
        <h1 class="hero-title">
          聆听音乐<br>
          <span class="gradient">感受生活的律动</span>
        </h1>
        <p class="hero-desc">
         {{ homeConfig.notice || '午夜漫66步' }}
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary" @click="goToPlayerPage">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            开始聆听
          </button>
          <button class="btn btn-outline" @click="goAbout">
            了解更多
          </button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="album-showcase">
          <div class="album-card">
            <img class="album-cover" :src="homeConfig.heroCoverUrl || 'https://picsum.photos/seed/album1/500'"
              alt="Album">
            <!-- <div class="play-btn-large">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div> -->
            <div class="album-overlay">
              <div class="album-info">
                <h3>{{ homeConfig.heroTitle || '午夜漫步' }}</h3>
                <p>{{ homeConfig.heroSubtitle || '周深 · 2026精选专辑' }}</p>
              </div>
            </div>
          </div>
          <div class="floating-cards">
            <div class="mini-card" v-if="playerStore.songId">
              <div class="mini-avatar" style="background: linear-gradient(135deg, #ec4899, #f97316);">
                <img v-if="playerStore.coverUrl" :src="playerStore.coverUrl" class="mini-cover" />
              </div>
              <div class="mini-info">
                <span>正在播放</span>
                <strong>{{ playerStore.songName }}</strong>
              </div>
            </div>
            <!-- 热门歌单卡片 -->
            <div class="mini-card">
              <div class="mini-avatar">
                <img src="/images/热门歌单图.png" alt="热门歌单">
              </div>
              <div class="mini-info">
                <span>热门歌单</span>
                <strong>{{ playlists[0]?.name || '暂无推荐' }}</strong>
              </div>
            </div>

            <!-- 热门歌曲卡片 -->
            <div class="mini-card">
              <div class="mini-avatar">
                <img src="/images/热门歌曲图.png" alt="热门歌曲">
              </div>
              <div class="mini-info">
                <span>热门歌曲</span>
                <strong>{{ newSongs[0]?.name || '暂无新歌' }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>    

    <!-- 推荐歌单 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">✨ 推荐歌单</h2>
        <router-link to="/playlists" class="section-more">
          查看全部
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </router-link>
      </div>
      <!-- 加载状态 -->
      <div v-if="playlistLoading" class="loading">正在加载推荐歌单...</div>
      <!-- 空数据状态 -->
      <div v-else-if="playlists.length === 0" class="empty-data">暂无推荐歌单</div>
      <!-- 歌单列表 -->
      <div v-else class="playlist-grid">
        <div class="playlist-card" v-for="(playlist, index) in playlists" :key="playlist.id"
          @click="handlePlaylistClick(playlist)">
          <div class="playlist-cover">
            <img :src="'https://picsum.photos/seed/playlist' + index + '/400'" :alt="playlist.name">
            <div class="playlist-play">
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div class="playlist-info">
            <h4>{{ playlist.name }}</h4>
            <p>{{ playlist.plays || '0' }} 次播放</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 新歌首发 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">🎵 新歌首发</h2>
        <router-link to="/songlists" class="section-more">
          查看全部
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
          </svg>
        </router-link>
      </div>
      <!-- 加载状态 -->
      <div v-if="songLoading" class="loading">正在加载新歌...</div>
      <!-- 空数据状态 -->
      <div v-else-if="newSongs.length === 0" class="empty-data">暂无新歌首发</div>
      <!-- 新歌列表 -->
      <div v-else class="playlist-grid">
        <div class="playlist-card" v-for="(song, index) in newSongs" :key="song.id" @click="handleSongClick(song)">
          <div class="playlist-cover">
            <img :src="'https://picsum.photos/seed/newsong' + index + '/400'" :alt="song.name">
            <div class="playlist-play">
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          <div class="playlist-info">
            <h4>{{ song.name }}</h4>
            <p>{{ song.artist || '未知歌手' }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { usePlayerStore } from '@/stores/player'
// 初始化路由
const router = useRouter()
const playerStore = usePlayerStore()

const goAbout = () => {
  router.push('/about')
}
// 1. 初始化数据（空数组）+ 加载状态
const playlists = ref([])          // 推荐歌单数据（后端获取）
const newSongs = ref([])           // 新歌首发数据（后端获取）
const playlistLoading = ref(true)  // 歌单加载状态
const songLoading = ref(true)      // 新歌加载状态
const homeConfig = ref({
  title: '聆听音乐',
  subTitle: '感受生活的律动',
  notice: '千万正版高品质音乐，沉浸式聆听体验。智能推荐你喜爱的音乐，发现更多精彩内容。',
  heroTitle: '午夜漫步',
  heroSubtitle: '周深 · 2026精选专辑',
  heroCoverUrl: 'https://picsum.photos/seed/album1/500'
})

// 2. 页面加载时请求后端数据
onMounted(async () => {
  try {
    // 并行请求：同时获取推荐歌单和新歌数据（提升性能）
    const [playlistRes, songRes, configRes] = await Promise.all([
      // 请求推荐歌单列表（后端接口）
      request.get('/playlist/recommend'),
      // 请求新歌首发列表（后端接口）
      request.get('/song/new'),
      // 请求主页配置
      request.get('/home/config/get')
    ])

    // 适配主页配置
    if (configRes.data.code === '200') {
      const config = configRes.data.data
      if (config) {
        if (config.title) homeConfig.value.title = config.title
        if (config.notice) homeConfig.value.notice = config.notice
        if (config.heroTitle) homeConfig.value.heroTitle = config.heroTitle
        if (config.heroSubtitle) homeConfig.value.heroSubtitle = config.heroSubtitle
        if (config.heroCoverUrl) homeConfig.value.heroCoverUrl = config.heroCoverUrl
      }
    }

    // 适配推荐歌单数据（根据后端返回格式调整）
    if (playlistRes.data.code === "200" && playlistRes.data.success) {
      playlists.value = playlistRes.data.data || []
    }


    // 适配新歌数据（根据后端返回格式调整）
    if (songRes.data.code === "200" && songRes.data.success) {
      newSongs.value = songRes.data.data || []
    }

  } catch (error) {
    // 异常处理：请求失败时提示用户
    console.error('主页数据加载失败：', error)
  } finally {
    // 无论成功/失败，都结束加载状态
    playlistLoading.value = false
    songLoading.value = false
  }
})

// 3. 歌单点击事件：跳转详情页（保留原有逻辑，移除冗余请求）
const handlePlaylistClick = (playlist) => {
  try {
    // 直接跳转（详情页自己请求数据，避免重复请求）
    router.push({
      path: `/playlist/${playlist.id}`, // 路径保留id
      query: { name: playlist.name } // 携带歌单名称，路由自动处理编码
    })
  } catch (error) {
    console.error('跳转歌单详情失败：', error)
    alert(`加载「${playlist.name}」失败，请稍后重试！`)
  }
}

// 4. 新歌点击事件：跳转详情页（仅修改这部分，传递完整歌曲数据）
const handleSongClick = (song) => {
  try {
    router.push({
      path: `/song/${song.id}`, // 保留id在URL中
      state: { songData: song } // 关键：把从后端获取的完整歌曲数据传递给详情页
    })
  } catch (error) {
    console.error('跳转歌曲详情失败：', error)
    alert(`加载「${song.name}」失败，请稍后重试！`)
  }
}



const goToPlayerPage = () => {
  router.push({
    path: '/player', 
  })
}
</script>

<style scoped>
/* 原有样式保留，新增以下样式 */
.mini-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.loading {
  text-align: center;
  padding: 30px 0;
  color: #666;
  font-size: 16px;
}

.empty-data {
  text-align: center;
  padding: 30px 0;
  color: #999;
  font-size: 16px;
}

.mini-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  /* 其他样式... */
}

.mini-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f3f4f6;
  /* 可选：加载失败时的底色 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 防止图片变形 */
}
</style>