<template>
  <div class="charts-page">
    <h1 class="page-title">🏆 音乐排行榜</h1>

    <div class="charts-tabs">
      <button class="chart-tab" :class="{ active: activeTab === tab.id }" v-for="tab in tabs" :key="tab.id"
        @click="activeTab = tab.id">
        {{ tab.name }}
      </button>
    </div>

    <div class="chart-list">
      <div class="chart-item" v-for="(song, index) in chartSongs" :key="index">
        <span class="chart-rank" :class="{ 'top-1': index === 0, 'top-2': index === 1, 'top-3': index === 2 }">
          {{ index + 1 }}
        </span>
        <div class="chart-cover">
          <img :src="'https://picsum.photos/seed/chart' + index + '/200'" :alt="song.name">
        </div>
        <div class="chart-info">
          <h4>{{ song.name }}</h4>
          <p>歌手：{{ song.artist }}</p>
        </div>
        <div  class="chart-info">
           <p>播放量：{{ song.playCount }}</p>
        </div>
        <div  class="chart-info">
          <p>发行时间：{{song.releaseTime}}</p>
        </div>
        
        <span class="chart-duration">{{ song.duration }}</span>

        <div class="chart-actions">
          <!-- 播放 -->
          <button class="action-btn" @click="handlePlay(song)">
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <!-- 添加到歌单 -->
          <button class="action-btn" @click="handleAdd(song)">
            <svg viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>



<script setup>
import { ref, watch } from 'vue'
import request from '@/utils/request'
import { useRouter } from 'vue-router'  // ← 引入
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
const router = useRouter() 

const tabs = ref([]);
const activeTab = ref('');
const chartSongs = ref([]);
const loading = ref(false);

// 1. 获取榜单分类（tabs）
async function fetchRankTabs() {
  try {
    const res = await request.get('api/ranking/list');
    tabs.value = res.data.data;
    activeTab.value = tabs.value[0]?.id;
    fetchChartSongs(activeTab.value);
  } catch (error) {
    console.error('获取榜单分类失败', error);
    tabs.value = [
      { id: 1, name: '热歌榜' },
      { id: 2, name: '新歌榜' },
    ];
    activeTab.value = 1;
    fetchChartSongs(1);
  }
}

// 2. 获取具体榜单歌曲
async function fetchChartSongs(tabId) {
  loading.value = true;
  try {
    const res = await request.get(`api/ranking/charts/${tabId}`);
    chartSongs.value = res.data.data;
  } catch (error) {
    console.error(`加载 ${tabId} 榜单失败`, error);
    chartSongs.value = [];
  } finally {
    loading.value = false;
  }
}

// 添加到歌单
async function handleAdd(song) {
  try {
    const res =  await request.post('/playlist/addSong', {
      songId: song.id,
      playlistId: data?.playListId  
    })
    if(res.code === 200) {
      alert('已成功添加到歌单！')
    } else {
      alert('添加到歌单失败：' + res.data.msg)
    }
  } catch (error) {
    console.error('添加到歌单失败', error)
  }
}

async function handlePlay(song) {
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

// 初始化
fetchRankTabs();

// 监听 tab 切换
watch(activeTab, (newId) => {
  fetchChartSongs(newId);
});
</script>