<template>
  <div class="playlist-page">

    <!-- 头部 -->
    <div class="header">
      <h1>🎶 歌单</h1>

      <div class="search-box">
        <input
          v-model="keyword"
          placeholder="搜索歌单..."
          @keyup.enter="loadPlaylists"
        />
        <button @click="loadPlaylists">搜索</button>
      </div>
    </div>

    <!-- 加载动画 -->
    <div v-if="loading" class="playlist-grid">
      <div class="skeleton-card" v-for="i in 8" :key="i"></div>
    </div>

    <!-- 歌单 -->
    <div v-else class="playlist-grid">

      <div
        class="playlist-card"
        v-for="item in playlists"
        :key="item.id"
        @click="goDetail(item.id)"
      >

        <div class="cover">

          <img :src="item.cover || 'https://picsum.photos/400?random='+item.id" />

          <!-- 播放按钮 -->
          <div class="play-btn">▶</div>

          <!-- 收藏
          <div class="fav-btn">♡</div> -->

        </div>

        <div class="info">
          <h4>{{ item.name }}</h4>
          <p>{{ item.description || "优质歌单推荐" }}</p>
        </div>

      </div>

    </div>

    <!-- 分页 -->
    <div class="pagination">

      <button
        :disabled="pageNum===1"
        @click="changePage(pageNum-1)"
      >
        上一页
      </button>

      <span>{{pageNum}} / {{pages}}</span>

      <button
        :disabled="pageNum===pages"
        @click="changePage(pageNum+1)"
      >
        下一页
      </button>

    </div>

  </div>
</template>

<script>
// ✅ 改为导入你项目中的 request（通常是封装好的 axios 实例）
import request from '@/utils/request' // 路径根据你项目调整

export default {
  name: 'PlaylistList', // 建议加上 name

  data() {
    return {
      playlists: [],
      pageNum: 1,
      pageSize: 8,
      pages: 1,
      keyword: '',
      loading: false
    }
  },

  mounted() {
    this.loadPlaylists()
  },

  methods: {
    async loadPlaylists() {
      this.loading = true
      try {
        // ✅ 使用 request 替代 axios，统一管理请求
        const res = await request.get('/playlist/list', {
          params: {
            pageNum: this.pageNum,
            pageSize: this.pageSize,
            keyword: this.keyword
          }
        })

        // ✅ 安全解构，避免空指针
        const page = res.data?.data || {}
        this.playlists = page.records || []
       this.pages = page.totalPage || 1
      } catch (error) {
        // ✅ 错误处理（可配合全局提示）
        console.error('加载歌单失败:', error)
        this.$message?.error?.('加载歌单失败，请稍后重试') // 如果你用了 Element UI / Naive UI 等
        this.playlists = []
        this.pages = 1
      } finally {
        this.loading = false
      }
    },

    changePage(num) {
      if (num < 1 || num > this.pages || num === this.pageNum) return
      this.pageNum = num
      this.loadPlaylists()
      window.scrollTo(0, 0)
    },

    goDetail(id) {
      this.$router.push(`/playlist/${id}`)
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

.playlist-page{
  max-width:1200px;
  margin:auto;
  padding:30px;
}

/* header */

.header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:30px;
}

.header h1{
  font-size:28px;
}

.search-box{
  display:flex;
  gap:10px;
}

.search-box input{
  padding:8px 12px;
  border-radius:20px;
  border:1px solid #ddd;
  background-color: transparent; /* 设置背景为透明 */
  color: white;
}

.search-box button{
  background:#ff4e6a;
  border:none;
  color:white;
  padding:8px 15px;
  border-radius:20px;
  cursor:pointer;
}

/* grid */

.playlist-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
  gap:25px;
}

/* card */

.playlist-card{
  cursor:pointer;
  transition:.25s;
}

.playlist-card:hover{
  transform:translateY(-6px);
}

.cover{
  position:relative;
}

.cover img{
  width:100%;
  border-radius:12px;
}

/* 播放量 */

.play-count{
  position:absolute;
  top:8px;
  right:8px;
  font-size:12px;
  color:white;
  background:rgba(0,0,0,.6);
  padding:2px 6px;
  border-radius:10px;
}

/* 播放按钮 */

.play-btn{
  position:absolute;
  bottom:10px;
  right:10px;
  width:45px;
  height:45px;
  border-radius:50%;
  background:#ff4e6a;
  display:flex;
  align-items:center;
  justify-content:center;
  color:white;
  font-size:18px;
  opacity:0;
  transition:.25s;
}

.playlist-card:hover .play-btn{
  opacity:1;
}

/* 收藏 */

.fav-btn{
  position:absolute;
  bottom:10px;
  left:10px;
  color:white;
  background:rgba(0,0,0,.5);
  width:32px;
  height:32px;
  border-radius:50%;
  display:flex;
  align-items:center;
  justify-content:center;
}

/* info */

.info{
  margin-top:10px;
  margin-left: 10px;
  margin-bottom: 5px;
}

.info h4{
  font-size:15px;
  margin-bottom:4px;
}

.info p{
  font-size:12px;
  color:#888;
}

/* skeleton */

.skeleton-card{
  height:260px;
  border-radius:12px;
  background:linear-gradient(
    90deg,
    #eee 25%,
    #f5f5f5 37%,
    #eee 63%
  );
  background-size:400% 100%;
  animation:skeleton 1.4s ease infinite;
}

@keyframes skeleton{
  0%{background-position:100% 50%}
  100%{background-position:0 50%}
}

/* pagination */

.pagination{
  margin-top:40px;
  text-align:center;
}

.pagination button{
  padding:8px 16px;
  margin:0 10px;
  border:none;
  background:#ff4e6a;
  color:rgb(54, 37, 37);
  border-radius:6px;
  cursor:pointer;
}

.pagination button:disabled{
  background:#ebd1d1;
}

</style>