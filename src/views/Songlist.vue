<template>
  <div class="songlist-page">
    <!-- 头部 -->
    <div class="header">
      <h1>🎵 歌曲列表</h1>

      <div class="search-box">
        <input
          v-model="keyword"
          placeholder="搜索歌曲/歌手..."
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch">搜索</button>
      </div>
    </div>

    <!-- 筛选栏（轻量，无背景） -->
    <div class="filter-bar" v-if="!loading">   
      <select v-model="sortType" @change="handleSearch">
        <option value="default">默认排序</option>
        <option value="playCount">播放量 </option>
        <option value="duration">时长 </option>
        <option value="updateTime">上架时间 </option>
        <option value="vip">VIP专属</option>
      </select>
    </div>

    <!-- 加载动画 -->
    <div v-if="loading" class="songlist-container">
      <div class="skeleton-item" v-for="i in 10" :key="i"></div>
    </div>

    <!-- 歌曲列表 -->
    <div v-else class="songlist-container">
      <!-- 空状态 -->
      <div v-if="songs.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="#c39cc9">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
        <p>暂无相关歌曲，换个关键词试试～</p>
      </div>

      <!-- 歌曲列表项 -->
      <div
        class="song-item"
        v-for="(item, index) in songs"
        :key="item.id"
        @click="goSongDetail(item.id)" 
      >
        <!-- 歌曲序号 -->
        <div class="song-index">{{ index + 1 }}</div>
        
        <!-- 歌曲封面 -->
        <div class="song-cover">
          <img :src="item.coverUrl || `https://picsum.photos/80?random=${item.id}`" />
          <!-- 播放按钮（hover显示） -->
          <div class="play-icon">▶</div>    
        </div>
        
        <!-- 歌曲信息 -->
        <div class="song-info">
          <h4 class="song-name">{{ item.name }}
             <span v-if="item.isVip" class="vip-badge">VIP</span>
          </h4>
          
          <p class="song-artist">🎤 {{ item.artist || '未知歌手' }}</p>
          <p class="song-style">🎼 {{ item.releaseTime || '未知发售时间' }}</p>
        </div>
        
        <!-- 歌曲时长 -->
        <div class="song-duration">{{ item.duration || '00:00' }}</div>
        
        <!-- 播放量 -->
        <div class="song-playcount">🔥 {{ formatPlay(item.playCount) }}</div>
        
        <!-- 操作按钮 -->
        <div class="song-actions">
          <button class="action-btn collect-btn" @click.stop="addToPlaylist(item)">收藏</button>
          <button class="action-btn download-btn" @click.stop="downloadSong(item)">下载</button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="!loading && songs.length > 0">
      <button
        :disabled="pageNum === 1"
        @click="changePage(pageNum - 1)"
        class="page-btn"
      >
        上一页
      </button>

      <span class="page-num">{{ pageNum }} / {{ pages }}</span>

      <button
        :disabled="pageNum === pages"
        @click="changePage(pageNum + 1)"
        class="page-btn"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'SongList',
  data() {
    return {
      songs: [],
      pageNum: 1,
      pageSize: 10,
      pages: 1,
      keyword: '',
      loading: false,
      sortType: 'default'
    }
  },
  mounted() {
    this.loadSongs()
  },
  methods: {
    async loadSongs() {
      this.loading = true
      try {
        const res = await request.get('/song/list', {
          params: {
            pageNum: this.pageNum,
            pageSize: this.pageSize,
            keyword: this.keyword,
            sortType: this.sortType
          }
        })

        const page = res.data?.data || {}
        this.songs = page.records || []
        this.pages = page.totalPage || page.pages || 1
      } catch (error) {
        console.error('加载歌曲失败:', error)
        this.$message?.error?.('加载歌曲失败，请稍后重试')
        this.songs = []
        this.pages = 1
      } finally {
        this.loading = false
      }
    },

handleSearch() {
  this.pageNum = 1
  this.loadSongs()
},

    changePage(num) {
      if (num < 1 || num > this.pages || num === this.pageNum) return
      this.pageNum = num
      this.loadSongs()
      window.scrollTo(0, 0)
    },

    goSongDetail(id) {
      this.$router.push(`/song/${id}`)
    },


    
/**
 * 添加到歌单/收藏逻辑
 */
    async addToPlaylist(song) {
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
    },

    downloadSong(song) {
  console.log('下载歌曲:', song.name)
  this.$message?.info?.(`开始下载《${song.name}》`)

  // 确保 song.url 是一个可以直接访问的音频文件链接（如 .mp3）
  if (!song.url) {
    this.$message?.error?.('歌曲下载地址不存在')
    return
  }

  // 创建一个隐藏的 <a> 元素
  const link = document.createElement('a')
  link.href = song.url
  link.download = `${song.name}.mp3` // 指定下载文件名
  link.style.display = 'none'

  // 触发下载
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
},



    formatPlay(num) {
      if (!num || num <= 0) return '0'
      if (num >= 10000) {
        return `${(num / 10000).toFixed(1)}万`
      }
      return num.toString()
    }
  }
}
</script>

<style scoped>
/* 全局基础样式（适配深色/浅色主题，这里以深色为例） */
.songlist-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  /* 背景色适配，可选浅灰 #f8f5fa 或深紫调 #1a1625 */
  background-color:transparent; 
  min-height: 100vh;
}

/* --- 头部样式 --- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(156, 124, 161, 0.2);
}

.header h1 {
  font-size: 28px;
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin: 0;
}

.search-box {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-box input {
  padding: 10px 16px;
  border-radius: 24px;
  border: 1px solid #c39cc9;
  background-color: rgba(255, 255, 255, 0.05);
  color: #fff;
  width: 280px;
  outline: none;
  transition: all 0.3s ease;
}

.search-box input::placeholder {
  color: #bbb;
}

.search-box input:focus {
  border-color: #b07bb8;
  background-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 8px rgba(195, 156, 201, 0.2);
}

.search-box button {
  background: linear-gradient(135deg, #c39cc9, #9d69a8);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.search-box button:hover {
  background: linear-gradient(135deg, #b07bb8, #8b5898);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(195, 156, 201, 0.3);
}

/* --- 筛选栏 --- */
.filter-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  color: #fff;
}

.filter-bar select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #c39cc9;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
}

.filter-bar select:hover {
  border-color: #b07bb8;
  background: rgba(255, 255, 255, 0.08);
}

.filter-bar select option {
  background: #2a2438;
  color: #fff;
}

/* --- 歌曲列表容器 --- */
.songlist-container {
  display: flex;
  flex-direction: column;
  gap: 16px; /* 缩小间距更紧凑 */
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100px 20px;
  color: #999;
}

.empty-state svg {
  margin-bottom: 15px;
  opacity: 0.7;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* --- 歌曲项核心样式 --- */
.song-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border: 1px solid #3c283f;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 悬浮效果 */
.song-item:hover {
  transform: translateY(-4px);
  border-color: #b07bb8;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 6px 20px rgba(195, 156, 201, 0.15);
}

/* 序号 */
.song-index {
  width: 36px;
  text-align: center;
  font-size: 14px;
  color: #aaa;
  font-weight: 500;
  transition: color 0.3s ease;
}

.song-item:hover .song-index {
  color: #c39cc9;
}

/* 封面 */
.song-cover {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.song-item:hover .song-cover img {
  transform: scale(1.05);
}

/* 播放按钮 */
.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(195, 156, 201, 0.9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0;
  transition: all 0.3s ease;
}

.song-item:hover .play-icon {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
}

/* VIP标签 */
.vip-badge {
  display: inline-block;
  font-size: 10px;
  color: #1a1625;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
  margin-left: 6px;
  vertical-align: middle;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 歌曲信息 */
.song-info {
  flex: 1;
}

.song-name {
  font-size: 16px;
  margin: 0 0 6px 0;
  color: #fff;
  font-weight: 500;
  transition: color 0.3s ease;
}

.song-item:hover .song-name {
  color: #c39cc9;
}

.song-artist,
.song-style {
  font-size: 13px;
  color: #ccc;
  margin: 2px 0;
  line-height: 1.4;
}

/* 时长/播放量 */
.song-duration,
.song-playcount {
  min-width: 80px;
  text-align: center;
  font-size: 13px;
  color: #aaa;
  transition: color 0.3s ease;
}

.song-item:hover .song-duration,
.song-item:hover .song-playcount {
  color: #c39cc9;
}

/* 操作按钮 */
.song-actions {
  display: flex;
  gap: 12px;
  margin-left: 20px;
}

.action-btn {
  padding: 7px 14px;
  font-size: 12px;
  border: 1px solid #c39cc9;
  background: transparent;
  color: #c39cc9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.action-btn:hover {
  background: linear-gradient(135deg, #c39cc9, #9d69a8);
  color: white;
  border-color: transparent;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(195, 156, 201, 0.2);
}

/* 骨架屏 */
.skeleton-item {
  height: 96px;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    rgba(195, 156, 201, 0.1) 25%,
    rgba(195, 156, 201, 0.15) 37%,
    rgba(195, 156, 201, 0.1) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

@keyframes skeleton-loading {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

/* 分页 */
.pagination {
  margin-top: 40px;
  text-align: center;
  padding: 20px 0;
}

.page-btn {
  padding: 10px 20px;
  margin: 0 12px;
  border: none;
  background: linear-gradient(135deg, #c39cc9, #9d69a8);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.page-btn:disabled {
  background: #443b48;
  color: #888;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.page-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #b07bb8, #8b5898);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(195, 156, 201, 0.2);
}

.page-num {
  color: #fff;
  font-size: 14px;
  margin: 0 10px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .songlist-page {
    padding: 20px 15px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    margin-bottom: 20px;
    padding-bottom: 10px;
  }

  .header h1 {
    font-size: 24px;
  }

  .search-box {
    width: 100%;
  }

  .search-box input {
    flex: 1;
    width: auto;
  }

  .filter-bar {
    flex-wrap: wrap;
    gap: 10px;
  }

  .song-item {
    flex-wrap: wrap;
    padding: 14px 16px;
    gap: 12px;
  }

  .song-cover {
    margin: 0;
  }

  .song-info {
    width: calc(100% - 100px);
  }

  .song-duration,
  .song-playcount {
    min-width: 60px;
    font-size: 12px;
  }

  .song-actions {
    width: 100%;
    margin-left: 0;
    margin-top: 10px;
    justify-content: flex-end;
    gap: 8px;
  }

  .action-btn {
    padding: 6px 12px;
    font-size: 11px;
  }

  .pagination {
    margin-top: 30px;
  }

  .page-btn {
    padding: 8px 16px;
    margin: 0 8px;
  }
}

/* 适配浅色主题（可选，取消注释即可切换） */
/* 
.songlist-page {
  background-color: #f8f5fa;
}
.header h1 {
  color: #2a2438;
}
.song-name {
  color: #2a2438;
}
.song-artist, .song-style {
  color: #666;
}
.page-num {
  color: #2a2438;
}
*/
</style>