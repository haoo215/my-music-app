<template>
  <div class="playlist-page main-content">
    <!-- 背景动画（复用全局样式） -->
    <div class="bg-aurora">
      <div class="aurora-orb"></div>
      <div class="aurora-orb"></div>
      <div class="aurora-orb"></div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">正在加载歌单详情...</div>

    <!-- 歌单详情内容 -->
    <div v-else class="playlist-detail section">
      <h1 class="page-title">🎶 歌单： {{ playlistName }}</h1>

      <!-- 歌单封面 + 基础信息（复用全局卡片样式） -->
      <div class="playlist-header"
        style="display: flex; gap: 30px; background: var(--bg-card); border: 1px solid var(--border-glass); border-radius: 20px; padding: 24px; margin-bottom: 40px; align-items: center;">
        <div class="playlist-cover"
          style="width: 180px; height: 180px; border-radius: 16px; overflow: hidden; flex-shrink: 0;">
          <img :src="`https://picsum.photos/seed/playlist${playlistId}/400`" alt="歌单封面"
            style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div class="playlist-meta" style="flex: 1;">
          <p class="plays" style="font-size: 16px; color: var(--text-secondary); margin: 10px 0;">100.0万 次播放</p>
          <p class="desc" style="font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px;">
            热门排行榜歌曲合集</p>
          <button class="btn btn-primary play-btn" @click="handlePlayAll">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            播放全部
          </button>
        </div>
        <div class="playlist-actions" style="margin-top: 16px; display: flex; gap: 10px;">
  <!-- 只有当前用户是歌单创建者时才显示 -->
  <button 
    v-if="isOwner" 
    class="btn btn-secondary" 
    @click="toggleShare"
    :disabled="shareLoading"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18 16v-5l3 3-3 3v-2c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4v-2l3-3-3-3v5c-3.86 0-7-3.14-7-7s3.14-7 7-7v2l-3 3 3 3V9c2.21 0 4 1.79 4 4s-1.79 4-4 4z"/>
    </svg>
    {{ isShared ? '取消共享' : '共享歌单' }}
  </button>

  <!-- 所有人都能看到“查看所有共享歌单”入口 -->
  <button 
    class="btn btn-outline btn-primary play-btn"
    @click="goToSharedList"
  ><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
    查看共享歌单
  </button>
</div>
      </div>

      <!-- 歌曲列表（复用排行榜样式） -->
      <div class="song-list">
        <h3 class="section-title" style="margin-bottom: 24px;">歌曲列表（共{{ songList.length }}首）</h3>
        <div class="chart-list">
          <div v-for="(song, idx) in songList" :key="song.id" class="chart-item">
            <!-- 排名 -->
            <div class="chart-rank" :class="{ 'top-1': idx === 0, 'top-2': idx === 1, 'top-3': idx === 2 }">
              {{ idx + 1 }}
            </div>

            <!-- 封面 -->
            <div class="chart-cover">
              <img :src="`https://picsum.photos/seed/song${song.id}/100`" :alt="song.name">
            </div>

            <!-- 🔴 修复：合并为一个 chart-info -->
            <div class="chart-info">
              <h4>{{ song.name }}</h4>
              <!-- 将歌手信息和专辑信息放在同一行或分行显示 -->
              <p>
                <span class="artist-name">{{ song.artist || '未知歌手' }}</span>
                <span class="separator">|</span>
                <span class="album-info">专辑 ID: {{ song.albumId }}</span>
                <span class="separator">|</span>
                <span class="play-count">{{ song.playCount }}次播放</span>
              </p>
            </div>

            <!-- 统计标签 (新歌/VIP) -->
            <div class="chart-stats">
              <span v-if="song.isNew" class="tag-new">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-5-9h10v2h-10z" />
                </svg>
                新歌
              </span>
              <span :class="song.isVip ? 'tag-vip' : 'tag-free'">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
                {{ song.isVip ? 'VIP' : '免费' }}
              </span>
            </div>



            <!-- 操作按钮 -->
            <div class="chart-actions">
              <button class="action-btn" @click="handlePlay(song)" title="播放">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <button class="action-btn" @click="handleAdd(song)" title="添加到歌单">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
import request from '../utils/request'

const router = useRouter()
const route = useRoute()
const playlistId = route.params.id
const playlistName = route.query.name || '未知歌单'
// 2. 响应式数据
const loading = ref(true)
const songList = ref([])
onMounted(async () => {
  try {
    const response = await request.get('/playlist/detail', {
      params: { playlistId: playlistId }
    })
    if (response.data?.code === "200" && response.data.success) {
      const detail = response.data.data

  
      songList.value = detail.songs || detail || []

      // 判断是否是歌主
      const localUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
      isOwner.value = localUser && localUser.uid === detail.ownerId
      isShared.value = detail.isShared || false

      console.log('加载成功，歌曲数量：', songList.value.length)
    }
  } catch (error) {
    console.error('请求异常：', error)
    songList.value = [
      { id: 1, name: "排行榜歌曲 1", albumId: 1, duration: "03", isNew: 1, isVip: 0, playCount: 1278 },
      { id: 2, name: "排行榜歌曲 2", albumId: 1, duration: "04", isNew: 1, isVip: 1, playCount: 987 },
      { id: 3, name: "排行榜歌曲 3", albumId: 2, duration: "03", isNew: 1, isVip: 0, playCount: 876 }
    ]
  } finally {
    loading.value = false
  }
})



// 新增响应式数据
const isOwner = ref(false)        // 是否是歌单创建者
const isShared = ref(false)       // 当前是否已共享
const shareLoading = ref(false)   // 共享操作加载状态

// 新增方法：切换共享状态
const toggleShare = async () => {
  if (shareLoading.value) return
  
  shareLoading.value = true
  try {
    const newStatus = !isShared.value
    await request.post('/playlist/toggle-share', {
      playlistId: playlistId,
      isShared: newStatus
    })
    
    isShared.value = newStatus
    myAlert(newStatus ? '歌单已共享！其他人可在“共享歌单”中查看' : '已取消共享', 3000)
  } catch (error) {
    console.error('共享操作失败:', error)
    myAlert('操作失败，请重试', 3000)
  } finally {
    shareLoading.value = false
  }
}

// 跳转到共享歌单列表页
const goToSharedList = () => {
  router.push('/shared-playlists')
}


// 播放全部
const handlePlayAll = async () => {
  if (!songList.value || songList.value.length === 0) {
    alert('歌单为空');
    return;
  }
  //保存歌单id到数据库
  await request.post('/user/savePlaylist', {
      playlistId:playlistId
    })
  try {
  
  playerStore.switchPlaylist(songList.value, 0, playlistId);
    
    // 跳转页面
   router.push({
      path: '/player',
    })

  } catch (error) {
    console.error('播放失败', error)
  }
}


 const handlePlay = async (song) => {
  const index = songList.value.findIndex(s => s.id === song.id);
  if (index === -1) return;
  
  // （可选）添加到收藏
  if (playerStore.currentPlayListId) {
    request.post('/playlist/addSong', { songId: song.id, playlistId: playerStore.currentPlayListId });
  }

  playerStore.switchPlaylist(songList.value, index);
  router.push('/player');
};


/**
 * 添加到歌单/收藏逻辑
 */
async function handleAdd(song) {
  try {
    // 调用后端添加接口
    // 注意：这里需要有效的 playListId，如果没有，可能需要先创建默认歌单或提示用户
    const targetPlaylistId = playerStore.currentPlayListId

    if (!targetPlaylistId) {
      alert('请先播放一首歌曲以初始化播放列表，或稍后在个人中心收藏')
      return
    }

    await request.post('/playlist/addSong', {
      songId: song.id,
      playlistId: targetPlaylistId
    })

    console.log('添加成功:', song.name)
    alert(`已添加 "${song.name}" 到歌单！`)

  } catch (error) {
    console.error('添加到歌单失败', error)
    alert('添加失败，请稍后重试')
  }
}
</script>

<style scoped>
/* 仅补充局部样式，全局样式已通过class复用 */
.playlist-page {
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.loading {
  text-align: center;
  padding: 100px 0;
  font-size: 18px;
  color: var(--text-secondary);
}

/* 适配响应式 */
@media (max-width: 768px) {
  .playlist-header {
    flex-direction: column;
    text-align: center;
  }

  .playlist-cover {
    margin-bottom: 20px;
  }
}

.chart-info {
  flex: 1;
  /* 确保它占据剩余空间 */
  min-width: 0;
  /* 防止内容溢出破坏布局 */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.chart-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chart-info p {
  margin: 0;
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 6px;
  /* 增加元素间距 */
  white-space: nowrap;
  /* 尽量不换行 */
  overflow: hidden;
  text-overflow: ellipsis;
}

.separator {
  opacity: 0.5;
  font-size: 10px;
}
</style>