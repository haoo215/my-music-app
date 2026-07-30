<template>
  <div class="shared-playlists main-content">
    <div class="bg-aurora">
      <div class="aurora-orb"></div>
      <div class="aurora-orb"></div>
      <div class="aurora-orb"></div>
    </div>

    <div class="section">
      <h1 class="page-title">🌍 共享歌单广场</h1>
      
      <div v-if="loading" class="loading">正在加载共享歌单...</div>
      
      <div v-else class="playlists-grid">
        <div 
          v-for="item in sharedPlaylists" 
          :key="item.id"
          class="playlist-card"
          @click="viewPlaylist(item)"
        >
          <div class="cover">
            <img :src="item.coverUrl || 'https://picsum.photos/seed/shared/300'" alt="封面">
          </div>
          <h3 class="name">{{ item.name }}</h3>
        </div>
        
        <div v-if="sharedPlaylists.length === 0" class="empty">
          暂无共享歌单，快去分享你的歌单吧！
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(true)
const sharedPlaylists = ref([])

onMounted(async () => {
  try {
    const res = await request.get('/playlist/shared-list')
    if (res.data?.code === '200' && res.data.success) {
      sharedPlaylists.value = res.data.data || []
    }
  } catch (error) {
    console.error('加载共享歌单失败', error)
  } finally {
    loading.value = false
  }
})

const viewPlaylist = (item) => {
  router.push(`/playlist/${item.id}?name=${encodeURIComponent(item.name)}`)
}
</script>

<style scoped>
.playlists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.playlist-card {
  background: var(--bg-card);
  border: 1px solid var(--border-glass);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.playlist-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

.cover {
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  font-size: 16px;
  margin: 12px 8px 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 0 8px 12px;
}

.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 40px;
  grid-column: 1 / -1;
}
</style>