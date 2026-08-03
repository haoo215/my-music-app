<template>
  <div class="bg-aurora">
    <div class="aurora-orb"></div>
    <div class="aurora-orb"></div>
    <div class="aurora-orb"></div>
  </div>

  <Navbar />

  <main class="main-content">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>

  <transition name="slide-up">
    <div
      class="player-wrapper"
      v-if="playerStore.songId && $route.path !== '/player'"
      ref="playerRef"
      :style="positionStyle"
    >
      <div 
        class="player" 
        :class="{ 'is-dragging': isDragging }"
        @mousedown="onDragStart"
        @touchstart.passive="onDragStart"
      >
        
        <div class="drag-handle">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
        </div>

        <div class="player-info">
          <div class="disk" :class="{ rotating: playerStore.isPlaying }">
            <span v-if="!playerStore.coverUrl">🎧</span>
            <img v-else :src="playerStore.coverUrl" class="disk-cover" alt="cover" />
          </div>
          <div class="song-meta">
            <div class="song-name">{{ playerStore.songName }}</div>
            <!-- <div class="song-prov">{{ playerStore.artistName }}</div> -->
          </div>
        </div>

        <div class="player-controls">
          <button class="play-btn" @click.stop="togglePlay">
            <span class="icon">{{ playerStore.isPlaying ? "⏸" : "▶" }}</span>
            <span class="text">{{ playerStore.isPlaying ? "暂停" : "播放" }}</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
import { usePlayerStore } from '@/stores/player'
import { useRoute } from 'vue-router'
import { onMounted, ref, computed, onBeforeUnmount } from 'vue'
import request from '@/utils/request'

const route = useRoute()
const playerStore = usePlayerStore()

// 你的登录逻辑保持完全不动
const fetchUserOnRefresh = async () => {
  const userInfo = localStorage.getItem('userInfo')
  if (!userInfo) return

  try {
    const res = await request.get('/user/playInfo')
    if (res.data.code === '200' && res.data.success) {
      const data = res.data.data
      // 直接更新 playerStore，而不单独存储 playInfo
      if (data.playListId) {
        playerStore.setPlaylistId(data.playListId)
      }
      // 如果有其他播放状态，也可以在这里设置
      localStorage.setItem('userInfo', JSON.stringify({
        uid: data.uid, username: data.username, avatar: data.avatar
      }))
      window.dispatchEvent(new Event('user-info-updated'))
    }
  } catch (err) {
    localStorage.removeItem('userInfo')
  }
}

const togglePlay = () => playerStore.togglePlay()

// ======== 拖拽逻辑相关 ========
const playerRef = ref(null)
const isDragging = ref(false)
const pos = ref({ x: null, y: null }) // null 代表使用 CSS 默认居中位置

// 动态计算样式
const positionStyle = computed(() => {
  if (pos.value.x === null || pos.value.y === null) return {}
  
  return {
    left: `${pos.value.x}px`,
    top: `${pos.value.y}px`,
    bottom: 'auto',       // 覆盖掉 CSS 中的 fixed bottom
    transform: 'none',    // 覆盖掉 CSS 中的 translateX(-50%)
    transition: isDragging.value ? 'none' : 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
  }
})

let startX = 0, startY = 0, initialX = 0, initialY = 0

const onDragStart = (e) => {
  // 如果点击的是播放按钮区域，不触发拖拽
  if (e.target.closest('.play-btn')) return

  isDragging.value = true
  // 兼容鼠标与触摸屏
  const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX
  const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY

  startX = clientX
  startY = clientY

  // 获取当前元素的实际屏幕坐标
  const rect = playerRef.value.getBoundingClientRect()
  initialX = rect.left
  initialY = rect.top

  // 立即将状态转换为绝对坐标系，防止突跳
  pos.value = { x: initialX, y: initialY }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', onDragEnd)
}

const onDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault() // 防止移动端页面跟着滚动

  const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX
  const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY

  const dx = clientX - startX
  const dy = clientY - startY

  // 获取屏幕边界尺寸，防止拖拽出屏幕
  const rect = playerRef.value.getBoundingClientRect()
  const maxX = window.innerWidth - rect.width
  const maxY = window.innerHeight - rect.height

  // 计算新坐标并增加边界吸附（防止越界）
  pos.value = {
    x: Math.max(0, Math.min(initialX + dx, maxX)),
    y: Math.max(0, Math.min(initialY + dy, maxY))
  }
}

const onDragEnd = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', onDragEnd)
}

onMounted(() => {
  playerStore.initAudio()
  playerStore.restore()
  fetchUserOnRefresh()
  
})

onBeforeUnmount(() => {
  // 兜底清理事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', onDragEnd)
})
</script>

<style>
#app {
  min-height: 100vh;
}

/* 悬浮播放器 - 默认位置为底部居中 */
.player-wrapper {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  touch-action: none; /* 防止触摸滑动冲突 */
}

/* 播放器主体 - 胶囊形态 & 高级毛玻璃 */
.player {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 12px 24px 12px 14px;
  border-radius: 50px; /* 胶囊圆角 */
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 300px;
  cursor: grab;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.player:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/* 拖拽时的交互反馈 */
.player.is-dragging {
  cursor: grabbing;
  box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.6);
  transform: scale(1.02); /* 拖拽时轻微放大带来悬停感 */
}

/* 拖拽手柄 UI */
.drag-handle {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.2);
  margin-right: -4px;
  transition: color 0.3s ease;
}

.player:hover .drag-handle {
  color: rgba(255, 255, 255, 0.5);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  pointer-events: none; /* 让拖拽事件穿透文本，体验更好 */
}

/* 唱片优化 */
.disk {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #334155;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  overflow: hidden;
  font-size: 20px;
}

.disk-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rotating {
  animation: spin 5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.song-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.song-name {
  font-weight: 600;
  font-size: 14px;
  color: #f8fafc;
  letter-spacing: 0.5px;
}

.song-prov {
  font-size: 12px;
  color: #06b6d4;
  font-weight: 500;
}

/* 播放按钮现代化 */
.play-btn {
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.3);
  padding: 8px 18px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.play-btn:hover {
  background: #06b6d4;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
}

.play-btn:active {
  transform: translateY(1px);
}

/* 进出场动画使用 translate 属性，避免与我们用 js 操作的 transform 冲突 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  translate: 0 30px;
}

/* ===== 移动端悬浮播放器适配 ===== */
@media (max-width: 768px) {
  .player-wrapper {
    bottom: 16px;
    left: 12px;
    right: 12px;
    transform: none;
    width: auto;
  }

  .player {
    min-width: 0;
    width: 100%;
    padding: 10px 16px 10px 12px;
    gap: 10px;
  }

  /* 移动端隐藏拖拽手柄，改为占满宽度的固定条 */
  .drag-handle {
    display: none;
  }

  .disk {
    width: 40px;
    height: 40px;
  }

  .song-name {
    font-size: 13px;
  }

  .play-btn {
    padding: 8px 14px;
  }

  .play-btn .text {
    display: none;
  }
}
</style>
