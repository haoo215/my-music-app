<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()

const router = useRouter()

// ================= 状态定义 =================
const singers = ref([])
const loading = ref(false)
const activeCategory = ref('all') // all, male, female, band, international
const activeCountry = ref('all') // all, western, mainland, hongkong, japan, korea
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const selectedSinger = ref(null)
const searchHistory = ref(JSON.parse(localStorage.getItem('singerSearchHistory')) || [])
let searchTimer = null
// 新增：前端分类 -> 后端数字映射表（核心修改）
const categoryToTypeMap = {
  all: null,       // 全部 -> 不传/null
  male: 1,         // 男歌手 -> 1
  female: 2,       // 女歌手 -> 2
  band: 3,         // 组合 -> 3
  international: 4 // 海外 -> 4
}

// 国家映射表
const countryMap = {
  all: null,
  western: 'Western',
  mainland: 'Mainland',
  hongkong: 'HongKong',
  japan: 'Japan',
  korea: 'Korea'
}

// ================= 核心方法：获取数据 =================
const fetchSingers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      // 核心修改：用映射表转换type值
      type: categoryToTypeMap[activeCategory.value],
      country: countryMap[activeCountry.value],
      keyword: searchKeyword.value && searchKeyword.value.trim() ? searchKeyword.value.trim() : null
    }

    const res = await request.post('/artist/query_page', params)
    const pageData = res.data.data || {}
    singers.value = pageData.records || pageData.list || []
    total.value = pageData.totalRow || 0
    currentPage.value = pageData.pageNumber || pageData.page || currentPage.value

  } catch (error) {
    console.error('获取歌手列表失败:', error)
    singers.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// ================= 业务逻辑方法 =================
const changeCategory = (category) => {
  if (activeCategory.value === category) return
  activeCategory.value = category
  currentPage.value = 1
  selectedSinger.value = null
  fetchSingers()
}

const changeCountry = (country) => {
  if (activeCountry.value === country) return
  activeCountry.value = country
  currentPage.value = 1
  selectedSinger.value = null
  fetchSingers()
}

const handleSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchSingers()
    const kw = searchKeyword.value.trim()
    if (kw) addToSearchHistory(kw)
  }, 500)
}

const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  currentPage.value = 1
  fetchSingers()
  const kw = searchKeyword.value.trim()
  if (kw) addToSearchHistory(kw)
}

const addToSearchHistory = (keyword) => {
  searchHistory.value = searchHistory.value.filter(item => item !== keyword)
  searchHistory.value.unshift(keyword)
  if (searchHistory.value.length > 10) {
    searchHistory.value = searchHistory.value.slice(0, 10)
  }
  localStorage.setItem('singerSearchHistory', JSON.stringify(searchHistory.value))
}

const clearSearch = () => {
  searchKeyword.value = ''
  currentPage.value = 1
  fetchSingers()
}

const resetSearch = () => {
  searchKeyword.value = ''
  activeCategory.value = 'all'
  activeCountry.value = 'all'
  currentPage.value = 1
  fetchSingers()
}

const searchByHistory = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
}

const clearSearchHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('singerSearchHistory')
}

const selectSinger = async (singer) => {
 selectedSinger.value = {
  ...singer,
  songs: [],
  songCount: 0
}

  await fetchSingerSongs(singer.id)
}

const backToList = () => {
  selectedSinger.value = null
}

// 新增：根据歌手ID查询歌曲
const fetchSingerSongs = async (artistId) => {
  try {
    const res = await request.post('/artist/query_songs', {
      id: artistId
    })

    const data  = res.data.data || []

    // 把歌曲挂到 selectedSinger 上
    selectedSinger.value.songs = data.song || []
    selectedSinger.value.songCount = data.songCount || 0


  } catch (error) {
    console.error('获取歌手歌曲失败:', error)
    selectedSinger.value.songs = []
  }
}


// 新增：页码兜底修正（防止前端传0/负数，和后端兜底呼应）
const handlePageChange = (newPage) => {
  // 核心修改：强制保证newPage≥1
  const validPage = Math.max(newPage, 1)
  if (validPage > Math.ceil(total.value / pageSize.value)) return
  currentPage.value = validPage
  fetchSingers()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const getCategoryName = () => {
  const map = {
    all: '全部歌手',
    male: '男歌手',
    female: '女歌手',
    band: '乐队/组合',
    international: '海外歌手'
  }
  return map[activeCategory.value] || '全部歌手'
}


const handleAvatarError = (e) => {
  const fullName = e.target.alt || 'Singer'
  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&bold=true&size=300&font-size=0.3`
}

// 添加到歌单
async function handleAdd(song) {
  try {
    const playListId = dataplayInfo?.playListId

    await request.post('/playlist/addSong', {
      songId: song.id,
      playlistId: playListId
    })

    console.log('添加成功')
  } catch (error) {
    console.error('添加到歌单失败', error)
  }
}

const playSong = async (song) => {
  if (!song.id) return
 try {
    const playlistId = playerStore.currentPlayListId
    //  加入歌单
    await request.post('/playlist/addSong', {
      songId: song.id,
      playlistId: playlistId
    })
    
    //  设置播放列表ID
    playerStore.setPlaylistId(playlistId)

    // 跳转页面
   router.push({
      path: '/player',
      query: { songId: song.id }
    })

  } catch (error) {
    console.error('播放失败', error)
  }
  
}

const playSingerAllSongs = () => {
  if (!selectedSinger.value) return
  alert('正在加载该歌手的所有歌曲... (需对接后端全量歌曲接口)')
}

// ================= 生命周期 =================
onMounted(() => {
  fetchSingers()
})
</script>

<template>
  <div class="singers-page">
    <!-- 顶部导航栏 -->
    <div class="nav-container">
      <div class="nav-links">
        <router-link to="/" class="nav-link">发现</router-link>
        <router-link to="/charts" class="nav-link">排行榜</router-link>
        <router-link to="/search" class="nav-link">搜索</router-link>
        <router-link to="/singers" class="nav-link active">歌手</router-link>
        <router-link to="/player" class="nav-link">播放器</router-link>
      </div>
    </div>

    <div class="singers-container">
      <!-- 左侧：分类与搜索 -->
      <div class="singers-category">
        <h3 class="category-title">歌手分类</h3>
        <ul class="category-list">
          <li
            v-for="cat in ['all', 'male', 'female', 'band', 'international']"
            :key="cat"
            class="category-item"
            :class="{ active: activeCategory === cat }"
            @click="changeCategory(cat)"
          >
            {{ cat === 'all' ? '全部歌手' : cat === 'male' ? '男歌手' : cat === 'female' ? '女歌手' : cat === 'band' ? '乐队/组合' : '海外歌手' }}
          </li>
        </ul>

        <ul class="category-list">
          <li
            v-for="country in ['all', 'western', 'mainland', 'hongkong', 'japan', 'korea']"
            :key="country"
            class="category-item"
            :class="{ active: activeCountry === country }"
            @click="changeCountry(country)"
          >
            {{ country === 'all' ? '全部' : country === 'western' ? '欧美' : country === 'mainland' ? '内地' : country === 'hongkong' ? '港台' : country === 'japan' ? '日本' : '韩国' }}
          </li>
        </ul>

        <div class="search-section">
          <h3 class="search-title">搜索歌手</h3>
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            <input
              type="text"
              class="search-input"
              v-model="searchKeyword"
              placeholder="输入歌手名..."
              @input="handleSearchInput"
              @keyup.enter="handleSearch"
            >
            <button class="clear-btn" v-if="searchKeyword" @click="clearSearch">×</button>
          </div>

          <div class="search-history" v-if="searchHistory.length > 0 && !searchKeyword">
            <div class="history-header">
              <span class="history-title">搜索历史</span>
              <button class="clear-history-btn" @click="clearSearchHistory">清空</button>
            </div>
            <div class="history-tags">
              <span 
                class="history-tag" 
                v-for="(kw, idx) in searchHistory" 
                :key="idx"
                @click="searchByHistory(kw)"
              >
                {{ kw }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：内容区域 -->
      <div class="singers-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <span>加载中...</span>
        </div>

        <!-- 非加载状态 -->
        <div v-else>
          <!-- 搜索结果提示 -->
          <div class="search-result-tip" v-if="searchKeyword || activeCategory !== 'all'">
            <span>
              {{ searchKeyword ? `搜索“${searchKeyword}”` : getCategoryName() }}
              <span v-if="total > 0">共找到 {{ total }} 位歌手</span>
              <span v-else>未找到相关歌手</span>
            </span>
            <button class="reset-search-btn" v-if="searchKeyword" @click="resetSearch">重置</button>
          </div>

          <!-- 歌手列表视图 -->
          <div class="singers-list" v-if="!selectedSinger">
            <div class="list-header" v-if="!searchKeyword && activeCategory === 'all'">
              <h2>全部歌手</h2>
              <span class="count">{{ total }} 位</span>
            </div>

            <div class="singers-grid" v-if="singers.length > 0">
              <div 
                class="singer-card" 
                v-for="singer in singers" 
                :key="singer.id"
                @click="selectSinger(singer)"
              >
                <div class="singer-avatar">
                  <img :src="singer.avatarUrl" :alt="singer.name" @error="handleAvatarError">
                  <div class="singer-mask">
                  </div>
                </div>
                <div class="singer-info">
                  <h4 class="singer-name">{{ singer.name }}</h4>
                  <!-- 优化：后端返回数字type时，转成中文显示 -->
                  <span class="singer-tag">
                    {{
                      singer.type === "1" ? '男歌手' :
                      singer.type === "2" ? '女歌手' :
                      singer.type === "3" ? '乐队/组合' :
                      singer.type === "4" ? '海外歌手' :
                      singer.tag || '歌手'
                    }}
                  </span>
                  <span class="singer-country" v-if="singer.country">{{ singer.country }}</span>
                </div>
              </div>
            </div>

            <!-- 空数据 -->
            <div class="empty-singers" v-if="singers.length === 0">
              暂无相关歌手数据
            </div>

            <!-- 分页控件 -->
            <div class="pagination-container" v-if="total > pageSize">
              <button 
                class="page-btn" 
                :disabled="currentPage <= 1" 
                @click="handlePageChange(currentPage - 1)"
              >
                上一页
              </button>
              <span class="page-info">
                第 {{ currentPage }} / {{ Math.ceil(total / pageSize) }} 页
              </span>
              <button 
                class="page-btn" 
                :disabled="currentPage * pageSize >= total" 
                @click="handlePageChange(currentPage + 1)"
              >
                下一页
              </button>
            </div>
          </div>

          <!-- 歌手详情视图 -->
          <div class="singer-detail" v-else-if="selectedSinger">
            <button class="back-btn" @click="backToList">
              <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              返回列表
            </button>

            <div class="singer-header">
              <div class="singer-header-avatar">
                <img :src="selectedSinger.avatarUrl" :alt="selectedSinger.name" @error="handleAvatarError">
              </div>
              <div class="singer-header-info">
                <h2 class="detail-name">{{ selectedSinger.name }}</h2>
                <p class="detail-tag">
                  {{
                    selectedSinger.type === "1" ? '男歌手' :
                    selectedSinger.type === "2" ? '女歌手' :
                    selectedSinger.type === "3" ? '乐队/组合' :
                    selectedSinger.type === "4" ? '海外歌手' :
                    selectedSinger.tag || '歌手'
                  }}
                </p>
                <p class="detail-country" v-if="selectedSinger.country">
                  {{ selectedSinger.country }}
                </p>
                <div class="detail-stats">
                  <span>{{ selectedSinger.songCount || 0 }} 首歌曲</span>
                  <!-- <span>{{ selectedSinger.fansCount || '0' }} 粉丝</span> -->
                </div>
                <button class="play-all-btn" @click="playSingerAllSongs">
                  <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  播放全部
                </button>
              </div>
            </div>

            <div class="singer-songs">
              <h3 class="songs-title">热门歌曲</h3>
              <div class="songs-list">
                <div v-if="selectedSinger.songs && selectedSinger.songs.length" class="songs-list">
                   <div 
                    class="song-item" 
                    v-for="(song, index) in selectedSinger.songs" 
                    :key="song.id"
                    @click="playSong(song)"
                  >
                    <div class="song-index">{{ index + 1 }}</div>
                    <div class="song-info">
                      <h5 class="song-name">{{ song.name }}</h5>
                      <p class="song-album">{{ song.album }}</p>
                    </div>
                    <div class="song-duration">{{ song.duration }}</div>
                    <button class="play-btn">
                      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                  </div>
                </div>
                <div v-else class="empty-songs">
                  暂无歌曲数据
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 全局样式 */
.singers-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 80px 60px 40px;
  color: #fff;
}

/* 导航栏样式 */
.nav-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 16px 0;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-link {
  color: #aaa;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  transition: color 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: #ff6b90;
}

.nav-link.active,
.nav-link.router-link-active {
  color: #ff6b90;
}

.nav-link.active::after,
.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #ff6b90 0%, #ff477e 100%);
  border-radius: 1px;
}

/* 主体容器 */
.singers-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 20px;
}

/* 左侧分类栏 */
.singers-category {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  height: fit-content;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.category-title {
  font-size: 18px;
  margin: 0 0 16px 0;
  color: #ff6b90;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
}

.category-item {
  padding: 10px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
  font-size: 14px;
  color: #ddd;
}

.category-item:hover {
  background: rgba(255, 107, 144, 0.1);
  color: #ff6b90;
}

.category-item.active {
  background: linear-gradient(135deg, rgba(255, 107, 144, 0.2), rgba(255, 71, 126, 0.1));
  color: #ff6b90;
  font-weight: 500;
  border-left: 3px solid #ff6b90;
}

/* 新增：搜索区域样式 */
.search-section {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 20px;
}

.search-title {
  font-size: 18px;
  margin: 0 0 12px 0;
  color: #ff6b90;
}

.search-input-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  fill: #888;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: rgba(255, 107, 144, 0.5);
}

.search-input::placeholder {
  color: #666;
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #888;
  font-size: 16px;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.clear-btn:hover {
  color: #ff6b90;
}

/* 搜索历史样式 */
.search-history {
  margin-top: 8px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-title {
  font-size: 12px;
  color: #888;
}

.clear-history-btn {
  font-size: 12px;
  color: #888;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.clear-history-btn:hover {
  color: #ff6b90;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  font-size: 12px;
  color: #ddd;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-tag:hover {
  background: rgba(255, 107, 144, 0.1);
  color: #ff6b90;
}

/* 右侧内容区 */
.singers-content {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  min-height: 600px;
}

/* 新增：搜索结果提示 */
.search-result-tip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #888;
  font-size: 14px;
}

.reset-search-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ff6b90;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-search-btn:hover {
  background: rgba(255, 107, 144, 0.1);
}

/* 歌手列表视图 */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.list-header h2 {
  margin: 0;
  font-size: 24px;
  color: #fff;
}

.count {
  color: #888;
  font-size: 14px;
}

.singers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
}

.singer-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 12px;
  overflow: hidden;
}

.singer-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.singer-avatar {
  position: relative;
  width: 100%;
  aspect-ratio: 1/1;
  border-radius: 12px;
  overflow: hidden;
}

.singer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.singer-card:hover .singer-avatar img {
  transform: scale(1.05);
}

.singer-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.singer-card:hover .singer-mask {
  opacity: 1;
}

.song-count {
  color: #fff;
  font-size: 12px;
}

.singer-info {
  padding: 12px 8px;
  text-align: center;
}

.singer-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #fff;
}

.singer-tag {
    margin: 0 7px 0 0;
  font-size: 12px;
  color: #888;
}

.singer-country {
  margin: 4px 0 0 0;
  font-size: 11px;
  color: #aaa;
}

.empty-singers {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
  color: #666;
  font-size: 14px;
}

/* 歌手详情视图 */
.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: #ff6b90;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 8px 0;
}

.back-btn svg {
  width: 16px;
  height: 16px;
  fill: #ff6b90;
}

.singer-header {
  display: flex;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.singer-header-avatar {
  width: 180px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
}

.singer-header-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.singer-header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.detail-name {
  font-size: 32px;
  margin: 0 0 8px 0;
  color: #fff;
}

.detail-tag {
  font-size: 16px;
  color: #aaa;
  margin: 0 0 16px 0;
}

.detail-country {
  font-size: 14px;
  color: #999;
  margin: 0 0 16px 0;
}

.detail-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  color: #888;
  font-size: 14px;
}

.play-all-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ff6b90 0%, #ff477e 100%);
  border: none;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  width: fit-content;
  transition: background 0.2s ease;
}

.play-all-btn:hover {
  background: linear-gradient(135deg, #ff477e 0%, #ff2f6e 100%);
}

.play-all-btn svg {
  width: 16px;
  height: 16px;
  fill: #fff;
}

/* 歌手歌曲列表 */
.songs-title {
  font-size: 20px;
  margin: 0 0 16px 0;
  color: #fff;
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  transition: background 0.2s ease;
  cursor: pointer;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.song-index {
  width: 24px;
  text-align: center;
  color: #888;
  font-size: 14px;
  margin-right: 16px;
}

.song-info {
  flex: 1;
}

.song-name {
  margin: 0 0 4px 0;
  font-size: 15px;
  color: #fff;
}

.song-album {
  margin: 0;
  font-size: 12px;
  color: #888;
}

.song-duration {
  color: #888;
  font-size: 14px;
  margin-right: 16px;
  width: 60px;
  text-align: right;
}

.play-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.song-item:hover .play-btn {
  opacity: 1;
}

.play-btn svg {
  width: 18px;
  height: 18px;
  fill: #ff6b90;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .singers-page {
    padding: 80px 20px 40px;
  }

  .singers-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .singer-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .singer-header-info {
    align-items: center;
  }

  .detail-stats {
    justify-content: center;
  }

  .singers-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
</style>