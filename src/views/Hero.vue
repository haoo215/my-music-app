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
          千万正版高品质音乐，沉浸式聆听体验。智能推荐你喜爱的音乐，发现更多精彩内容。
        </p>
        <div class="hero-actions">
          <button class="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            开始聆听
          </button>
          <button class="btn btn-outline">了解更多</button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="album-showcase">
          <div class="album-card">
            <img class="album-cover" src="https://picsum.photos/seed/album1/500" alt="Album">
            <div class="play-btn-large">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div class="album-overlay">
              <div class="album-info">
                <h3>午夜漫步</h3>
                <p>周深 · 2024精选专辑</p>
              </div>
            </div>
          </div>
          <div class="floating-cards">
            <div class="mini-card">
              <div class="mini-avatar" style="background: linear-gradient(135deg, #ec4899, #f97316);"></div>
              <div class="mini-info">
                <span>正在播放</span>
                <strong>星辰大海</strong>
              </div>
            </div>
            <div class="mini-card">
              <div class="mini-avatar" style="background: linear-gradient(135deg, #06b6d4, #3b82f6);"></div>
              <div class="mini-info">
                <span>热门歌单</span>
                <strong>华语热歌榜</strong>
              </div>
            </div>
            <div class="mini-card">
              <div class="mini-avatar" style="background: linear-gradient(135deg, #a855f7, #ec4899);"></div>
              <div class="mini-info">
                <span>新专辑</span>
                <strong>夜曲 · Remix</strong>
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
        <a href="#" class="section-more">
          查看全部
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
        </a>
      </div>
      <div class="playlist-grid">
        <div class="playlist-card" 
             v-for="(playlist, index) in playlists" 
             :key="playlist.id"
             @click="handlePlaylistClick(playlist)">
          <div class="playlist-cover">
            <img :src="'https://picsum.photos/seed/playlist' + index + '/400'" :alt="playlist.name">
            <div class="playlist-play">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <div class="playlist-info">
            <h4>{{ playlist.name }}</h4>
            <p>{{ playlist.plays }} 次播放</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 新歌首发 -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">🎵 新歌首发</h2>
        <a href="#" class="section-more">
          查看全部
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
        </a>
      </div>
      <div class="playlist-grid">
        <div class="playlist-card" 
             v-for="(song, index) in newSongs" 
             :key="song.id"
             @click="handleSongClick(song)">
          <div class="playlist-cover">
            <img :src="'https://picsum.photos/seed/newsong' + index + '/400'" :alt="song.name">
            <div class="playlist-play">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <div class="playlist-info">
            <h4>{{ song.name }}</h4>
            <p>{{ song.artist }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// 暂时注释请求工具，避免未安装axios导致报错
// import request from '../utils/request'

const router = useRouter()

// 歌单数据
const playlists = ref([
  { id: 1, name: '华语流行金曲', plays: '328.5万' },
  { id: 2, name: '深夜情歌精选', plays: '256.2万' },
  { id: 3, name: '运动健身必备', plays: '189.7万' },
  { id: 4, name: '工作学习专注', plays: '412.3万' },
  { id: 5, name: '经典老歌回忆', plays: '567.8万' },
  { id: 6, name: '轻音乐助眠', plays: '298.4万' },
]);

// 新歌数据
const newSongs = ref([
  { id: 101, name: '漠河舞厅', artist: '柳爽' },
  { id: 102, name: '孤勇者', artist: '陈奕迅' },
  { id: 103, name: '稻香', artist: '周杰伦' },
  { id: 104, name: '起风了', artist: '买辣椒也用券' },
  { id: 105, name: '错位时空', artist: '艾辰' },
  { id: 106, name: '白月光与朱砂痣', artist: '大籽' },
]);

// 歌单点击：只跳转，暂时屏蔽后端请求（先保证页面能运行）
const handlePlaylistClick = (playlist) => {
  try {
    // 仅跳转路由，不请求后端
    router.push(`/playlist/${playlist.id}`)
    console.log(`点击歌单：${playlist.name}，跳转至 /playlist/${playlist.id}`)
  } catch (error) {
    console.error('跳转失败：', error)
    alert(`跳转至「${playlist.name}」失败`)
  }
}

// 新歌点击：只跳转
const handleSongClick = (song) => {
  try {
    router.push(`/song/${song.id}`)
    console.log(`点击歌曲：${song.name}，跳转至 /song/${song.id}`)
  } catch (error) {
    console.error('跳转失败：', error)
    alert(`跳转至「${song.name}」失败`)
  }
}
</script>