<template>
  <div class="container">
    <!-- 纯CSS科技感呼吸网格背景 -->
    <div class="tech-grid-bg"></div>
    <div class="bg-glow"></div>
    
    <div class="map-wrapper">
      <svg :viewBox="viewBox" @click="onMapClick" @mousemove="onMouseMove" @mouseleave="hoverProv = null">
        <defs>
          <linearGradient id="bgGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
          
          <!-- 增强发光滤镜 -->
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <!-- 选中态的高亮滤镜 -->
          <filter id="active-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#22d3ee" flood-opacity="0.8"/>
          </filter>
        </defs>

        <rect x="-1000" y="-1000" width="3000" height="3000" fill="transparent" />

        <g class="map-group">
          <path 
            v-for="item in mapData" 
            :key="item.name" 
            :d="item.path" 
            :fill="getFillColor(item)" 
            class="province" 
            :class="{ 
              'is-unlocked': isUnlocked(item.name),
              'is-selected': currentProv === item.name,
              'is-hovered': hoverProv === item.name 
            }" 
            :data-name="item.name"
          />
        </g>
      </svg>
    </div>

    <!-- 浮动悬停提示 (带平滑移动动画) -->
    <transition name="fade-scale">
      <div v-if="hoverProv" class="tooltip" :style="{ transform: `translate(${tooltipPos.x}px, ${tooltipPos.y}px)` }">
        <div class="tooltip-content">
          <div class="tooltip-status">
            <span class="tooltip-dot" :class="{ 'active': isUnlocked(hoverProv) }"></span>
            <span class="tooltip-dot-pulse" v-if="isUnlocked(hoverProv)"></span>
          </div>
          <span class="tooltip-text">{{ hoverProv }}</span>
          <span class="tooltip-badge" v-if="isUnlocked(hoverProv)">已解锁</span>
        </div>
      </div>
    </transition>

    <!-- 侧边栏：采用更细腻的玻璃质感 -->
    <div class="sidebar" :class="{ show: sidebarVisible }">
      <div class="sidebar-blur-bg"></div>
      <div class="sidebar-border-glow"></div>
      
      <!-- 固定的头部 -->
      <div class="sidebar-header">
        <div class="sidebar-title">
          <div class="title-badge">
            <span class="badge-icon">📍</span> REGIONAL CULTURE
          </div>
          <h2>{{ currentProv || '未选择' }}</h2>
        </div>
        <button class="close-btn" @click="closeSidebar">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 可滚动的区域 -->
      <div class="sidebar-scroll-area">
        <transition name="slide-up">
          <div class="culture-panel" v-if="currentCultureInfo && sidebarVisible">
            <div class="section-header">
              <div class="section-line"></div>
              <div class="section-label">文化风貌</div>
            </div>
            <p class="culture-intro">{{ currentCultureInfo.intro }}</p>
            <div class="culture-tags">
              <span v-for="(tag, index) in currentCultureInfo.highlights" :key="index" class="culture-tag">
                <span class="tag-hash">#</span> {{ tag }}
              </span>
            </div>
          </div>
        </transition>

        <transition name="slide-up" style="transition-delay: 0.1s;">
          <div class="list-section" v-if="sidebarVisible">
            <div class="section-header">
              <div class="section-line"></div>
              <div class="section-label">
                传承之声
                <span class="count-badge">{{ provList.length }}</span>
              </div>
            </div>
            
            <transition-group name="list-stagger" tag="div" class="song-list">
              <div v-for="(item, index) in provList" 
                :key="item.songId || item.id" 
                class="song-card"
                :class="{ 'playing': currentSong && currentSong.songId === item.songId }" 
                @click="playAudio(item, index)"
                :style="{ transitionDelay: `${index * 0.05}s` }"
              >
                <div class="song-cover">
                  <!-- 如果有封面则显示封面，无封面则显示波形或播放图标 -->
                  <img v-if="item.coverUrl" :src="item.coverUrl" class="cover-img" alt="cover"/>
                  <div class="cover-overlay" v-else>
                    <span v-if="currentSong && currentSong.songId === item.songId && isPlaying" class="music-wave">
                      <span v-for="i in 4" :key="i"></span>
                    </span>
                    <svg v-else-if="currentSong && currentSong.songId === item.songId" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                </div>
                <div class="song-detail">
                  <div class="song-name">{{ item.name }}</div>
                  <div class="song-meta">
                    <span class="meta-tag">{{ item.province }}</span>
                    <span class="meta-dot">·</span>
                    <span>民间瑰宝</span>
                  </div>
                </div>
                <div class="song-action">
                  <div class="play-btn-mini">
                    <div class="pulse-ring" v-if="currentSong && currentSong.songId === item.songId && isPlaying"></div>
                  </div>
                </div>
              </div>
            </transition-group>

            <div v-if="provList.length === 0" class="empty-state">
              <div class="empty-art">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="rgba(255,255,255,0.2)" stroke-width="1" fill="none">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </div>
              <p>这片土地的旋律，静待您的发掘</p>
              <button class="contribute-btn">我要上传</button>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 隐藏的音频元素用于直接播放 -->
    <audio ref="audioRef" @ended="onAudioEnded" @error="onAudioError"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePlayerStore } from '@/stores/player'
import request from '@/utils/request'

const mapData = ref([])
const viewBox = ref("0 0 100 100")
const hoverProv = ref(null)
const currentProv = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })
const popup = ref({ show: false, x: 0, y: 0, name: "", count: 0, culture: "" })
const sidebarVisible = ref(false)
const provList = ref([])
const unlockedProvinces = ref([])
const songList = ref([])
const songGroups = ref({})
const currentSong = ref(null)
const isPlaying = ref(false)
const currentCultureInfo = ref(null)
const audioRef = ref(null)

const playerStore = usePlayerStore()

function groupSongsByProvince(list) {
  return list.reduce((map, song) => {
    const key = song.province || "未知省份"
    if (!map[key]) map[key] = []
    map[key].push(song)
    return map
  }, {})
}

async function loadMapData() {
  try {
    const res = await fetch("/china.json")
    const geo = await res.json()

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    const features = geo.features.map(f => {
      const coords = getCoords(f.geometry)
      coords.forEach(ring => {
        ring.forEach(p => {
          if (p[0] < minX) minX = p[0]
          if (p[0] > maxX) maxX = p[0]
          if (p[1] < minY) minY = p[1]
          if (p[1] > maxY) maxY = p[1]
        })
      })
      return { name: f.properties.name, geometry: f.geometry }
    })

    const width = maxX - minX
    const height = maxY - minY
    const padding = 2
    viewBox.value = `${minX - padding} ${-maxY - padding} ${width + padding * 2} ${height + padding * 2}`
    mapData.value = features.map(item => ({
      ...item,
      path: geomToPath(item.geometry)
    }))
  } catch (error) {
    console.error("地图加载失败", error)
  }
}

async function getSongData() {
  try {
    const result = await request("/mapSong")
    if (result.data.code === '200') {
      songList.value = result.data.data
      songGroups.value = groupSongsByProvince(songList.value)
      unlockedProvinces.value = Object.keys(songGroups.value)
    }
  } catch (err) {
    console.log("加载歌曲失败", err)
  }
}

function fetchProvinceInfo(name) {
  currentCultureInfo.value = null
  const provinceData = songGroups.value[name] || []
  
  if (provinceData.length > 0) {
    const firstSong = provinceData[0]
    currentCultureInfo.value = {
      intro: firstSong.culture || "该地区暂无详细文化信息，欢迎补充。",
      highlights: firstSong.highlights || ['原生态', '非物质文化遗产', '民族乐器'] // 兜底标签展示效果
    }
    popup.value.culture = firstSong.culture || ""
  } else {
    currentCultureInfo.value = {
      intro: "这片土地孕育了独特的地域文化，但相关的音频存证目前仍是一片空白。期待您的探索与记录。",
      highlights: ['待探索', '虚位以待']
    }
  }
}

function getCoords(geom) {
  if (geom.type === "Polygon") return geom.coordinates
  if (geom.type === "MultiPolygon") return geom.coordinates.flat(1)
  return []
}

function geomToPath(geom) {
  const coords = getCoords(geom)
  return coords.map(ring => {
    return ring.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${-p[1]}`).join(" ") + " Z"
  }).join(" ")
}

function isUnlocked(provName) {
  return unlockedProvinces.value.includes(provName)
}

function getFillColor(item) {
  if (item.name === currentProv.value) return "#06b6d4" // 选中态填充
  return isUnlocked(item.name) ? "rgba(8, 145, 178, 0.6)" : "rgba(30, 41, 59, 0.8)"
}

function onMouseMove(e) {
  const el = e.target.closest(".province")
  const name = el ? el.dataset.name : null
  hoverProv.value = name
  
  if (name) {
    // 增加细微偏移量避免遮挡鼠标
    tooltipPos.value = { x: e.clientX + 20, y: e.clientY + 20 }
  }
}

async function onMapClick(e) {
  const el = e.target.closest(".province")
  if (!el) {
    closeSidebar()
    return
  }
  const name = el.dataset.name
  currentProv.value = name
  provList.value = songGroups.value[name] || songList.value.filter(s => s.province === name)
  sidebarVisible.value = true
  popup.value = {
    show: true,
    x: e.clientX,
    y: e.clientY,
    name,
    count: provList.value.length,
    culture: ""
  }
  await fetchProvinceInfo(name)
}

function closeSidebar() {
  sidebarVisible.value = false
  currentProv.value = null
  popup.value.show = false
  
  // 停止播放
  if (audioRef.value && isPlaying.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
    isPlaying.value = false
    currentSong.value = null
  }
}

const playAudio = async (item, index) => {
  if (!item.url) {
    // 此处可替换为漂亮的 Toast 组件
    alert("该条目暂无音频资源链接")
    return
  }
  
  // 如果点击的是正在播放的歌曲，则暂停
  if (currentSong.value && currentSong.value.songId === item.songId && isPlaying.value) {
    if (audioRef.value) {
      audioRef.value.pause()
      isPlaying.value = false
    }
    return
  }
  
  // 如果正在播放其他歌曲，先停止
  if (isPlaying.value && audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
  }
  
  // 直接在页面播放，不使用全局播放器
  if (audioRef.value) {
    audioRef.value.src = item.url
    audioRef.value.play()
    isPlaying.value = true
    currentSong.value = item
  }

  try {
    await request.post('/user/savePlaylist', { playlistId: 8 })
  } catch(e) {}
}

const onAudioEnded = () => {
  isPlaying.value = false
  currentSong.value = null
}

const onAudioError = (e) => {
  console.error('音频播放错误:', e)
  isPlaying.value = false
  alert('播放失败，请检查音频资源')
}

onMounted(() => {
  loadMapData()
  getSongData()
})
</script>

<style scoped>
/* ================= 基础布局与背景 ================= */
.container {
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: #020617;
  color: #f1f5f9;
  overflow: hidden;
  font-family: "PingFang SC", "Helvetica Neue", Helvetica, "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* 科技感网格背景 */
.tech-grid-bg {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: center center;
  mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
  -webkit-mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
  pointer-events: none;
}

/* 呼吸光晕 */
.bg-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80vw;
  height: 80vw;
  max-width: 800px;
  max-height: 800px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(2, 6, 23, 0) 70%);
  transform: translate(-50%, -50%);
  pointer-events: none;
  animation: pulse-glow 8s ease-in-out infinite alternate;
}

@keyframes pulse-glow {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

/* ================= 地图区域 ================= */
.map-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 40px 40px 10%; /* 给侧边栏留出视觉空间 */
  box-sizing: border-box;
}

svg {
  width: 100%;
  height: 100%;
  max-height: 90vh;
  filter: drop-shadow(0 20px 30px rgba(0,0,0,0.5));
}

.province {
  transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
  cursor: pointer;
  stroke: rgba(148, 163, 184, 0.15);
  stroke-width: 0.2;
  stroke-linejoin: round;
  outline: none;
}

/* 未解锁区域 Hover */
.province:hover {
  fill: #334155 !important;
  stroke: rgba(255, 255, 255, 0.4);
  stroke-width: 0.4;
}

/* 已解锁区域 */
.province.is-unlocked {
  stroke: rgba(34, 211, 238, 0.4);
  stroke-width: 0.3;
}

/* 已解锁区域 Hover */
.province.is-unlocked:hover {
  fill: rgba(6, 182, 212, 0.8) !important;
  stroke: #67e8f9;
  filter: url(#glow);
}

/* 选中状态 */
.province.is-selected {
  fill: #06b6d4 !important;
  stroke: #ffffff;
  stroke-width: 0.6;
  filter: url(#active-glow);
  transform-origin: center;
}

/* ================= 悬停提示 Tooltip ================= */
.tooltip {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  pointer-events: none;
  transition: transform 0.1s linear; /* 实现跟随鼠标的平滑移动 */
}

.tooltip-content {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05) inset;
}

.tooltip-status {
  position: relative;
  width: 8px;
  height: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tooltip-dot {
  width: 8px;
  height: 8px;
  background: #475569;
  border-radius: 50%;
  z-index: 2;
}

.tooltip-dot.active {
  background: #22d3ee;
  box-shadow: 0 0 8px #22d3ee;
}

.tooltip-dot-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #22d3ee;
  border-radius: 50%;
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
  z-index: 1;
}

@keyframes ping {
  75%, 100% { transform: scale(2.5); opacity: 0; }
}

.tooltip-text {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #f8fafc;
}

.tooltip-badge {
  font-size: 10px;
  background: rgba(34, 211, 238, 0.15);
  color: #67e8f9;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 4px;
}

/* ================= 侧边栏 ================= */
.sidebar {
  position: absolute;
  right: -420px;
  top: 24px;
  bottom: 24px;
  width: 380px;
  transition: right 0.6s cubic-bezier(0.19, 1, 0.22, 1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  margin-right: 24px;
}

.sidebar.show {
  right: 0;
}

.sidebar-blur-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(2, 6, 23, 0.95) 100%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 24px;
  box-shadow: -20px 0 60px rgba(0, 0, 0, 0.6);
  z-index: -1;
}

.sidebar-border-glow {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 1px;
  background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 0;
}

/* 侧边栏头部 */
.sidebar-header {
  position: relative;
  padding: 32px 32px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 10;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.title-badge {
  font-size: 11px;
  color: #06b6d4;
  letter-spacing: 2px;
  margin-bottom: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.badge-icon {
  font-size: 14px;
}

.sidebar-title h2 {
  font-size: 32px;
  margin: 0;
  font-weight: 700;
  letter-spacing: 2px;
  color: white;
}

.close-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255,255,255,0.05);
  color: #94a3b8;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
  transform: rotate(90deg);
}

/* 滚动区域 */
.sidebar-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 40px;
  z-index: 10;
  scroll-behavior: smooth;
}

.sidebar-scroll-area::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll-area::-webkit-scrollbar-track {
  background: transparent;
  margin: 10px 0;
}

.sidebar-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
}

.sidebar-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}

/* 通用区块标题 */
.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-line {
  height: 1px;
  flex: 1;
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%);
}

.section-label {
  font-size: 13px;
  color: #cbd5e1;
  font-weight: 500;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 文化面板 */
.culture-panel {
  margin-bottom: 32px;
}

.culture-intro {
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.8;
  margin: 0 0 20px 0;
  text-align: justify;
}

.culture-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.culture-tag {
  font-size: 12px;
  background: rgba(15, 23, 42, 0.6);
  color: #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  gap: 4px;
  transition: 0.3s;
}

.culture-tag:hover {
  border-color: rgba(34, 211, 238, 0.4);
  color: #22d3ee;
  transform: translateY(-2px);
}

.tag-hash {
  color: #06b6d4;
  font-weight: bold;
}

/* 歌曲列表与卡片 */
.count-badge {
  background: rgba(34, 211, 238, 0.1);
  color: #22d3ee;
  padding: 2px 8px;
  border-radius: 100px;
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.song-card {
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.song-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #06b6d4;
  transform: scaleY(0);
  transition: transform 0.3s ease;
  border-radius: 4px 0 0 4px;
}

.song-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
}

.song-card.playing {
  background: linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, rgba(255,255,255,0.02) 100%);
  border-color: rgba(6, 182, 212, 0.3);
}

.song-card.playing::before {
  transform: scaleY(1);
}

/* 封面与播放状态图标 */
.song-cover {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: #0f172a;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
  color: #e2e8f0;
}

.song-card.playing .cover-overlay {
  background: rgba(6, 182, 212, 0.2);
  color: #22d3ee;
}

/* 歌曲文字信息 */
.song-detail {
  flex: 1;
  min-width: 0; /* 截断所需 */
}

.song-name {
  font-weight: 600;
  font-size: 15px;
  color: #f8fafc;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-meta {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-tag {
  background: rgba(255,255,255,0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.meta-dot {
  opacity: 0.5;
}

.song-action {
  width: 32px;
  display: flex;
  justify-content: center;
}

/* 音乐律动动画 */
.music-wave {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 16px;
}

.music-wave span {
  width: 3px;
  background: #22d3ee;
  border-radius: 3px;
  animation: wave 0.8s infinite ease-in-out;
}

.music-wave span:nth-child(1) { animation-delay: 0.1s; }
.music-wave span:nth-child(2) { animation-delay: 0.3s; height: 100%; }
.music-wave span:nth-child(3) { animation-delay: 0.2s; height: 70%; }
.music-wave span:nth-child(4) { animation-delay: 0.4s; height: 40%; }

@keyframes wave {
  0%, 100% { height: 4px; }
  50% { height: 16px; }
}

/* 空状态设计 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 16px;
  border: 1px dashed rgba(255,255,255,0.1);
  margin-top: 20px;
}

.empty-art {
  margin-bottom: 16px;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-state p {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 24px;
}

.contribute-btn {
  background: rgba(6, 182, 212, 0.1);
  color: #22d3ee;
  border: 1px solid rgba(34, 211, 238, 0.3);
  padding: 8px 24px;
  border-radius: 100px;
  font-size: 14px;
  cursor: pointer;
  transition: 0.3s;
}

.contribute-btn:hover {
  background: #06b6d4;
  color: #fff;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.4);
}

/* ================= 进场与过渡动画 ================= */
.fade-scale-enter-active, .fade-scale-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-scale-enter-from, .fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9) translate(-10px, -10px);
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 列表交错动画 */
.list-stagger-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.list-stagger-leave-active {
  transition: all 0.3s ease;
  position: absolute;
}
.list-stagger-enter-from, .list-stagger-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.list-stagger-move {
  transition: transform 0.5s ease;
}
</style>