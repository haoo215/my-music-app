<template>
  <div class="playlist-manage">
    <el-table :data="playlists" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="歌单名称" />
      <el-table-column label="操作" width="320">
        <template #default="{ row }">
          <button class="btn-edit" @click="handleStatusChange(row.id, 2, '上传', 'playlist')">上传</button>
          <button class="btn-delete" @click="handleStatusChange(row.id, 2, '下架', 'playlist')">下架</button>
          <button class="btn-edit" @click="handleEditPlaylist(row)">编辑</button>
          <!-- 👇 新增：编辑歌曲 -->
          <button class="btn-edit" @click="openSongDialog(row)">编辑歌曲</button>
          <button class="btn-delete" @click="handleDeletePlaylist(row.id)">删除</button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 歌曲编辑弹窗 -->
    <el-dialog
      v-model="songDialog.visible"
      title="编辑歌单歌曲"
      width="800px"
      @close="resetSongDialog"
    >
      <div style="display: flex; gap: 20px;">
        <!-- 已绑定歌曲 -->
        <div style="flex: 1;">
          <h4>已绑定歌曲（{{ songDialog.boundSongs.length }} 首）</h4>
          <el-checkbox-group v-model="songDialog.selectedToRemove">
            <el-checkbox
              v-for="song in songDialog.boundSongs"
              :key="song.id"
              :label="song.id"
            >
              {{ song.name }}
            </el-checkbox>
          </el-checkbox-group>
          <p v-if="songDialog.boundSongs.length === 0" style="color: #999;">暂无歌曲</p>
        </div>

        <!-- 可添加歌曲 -->
        <div style="flex: 1;">
          <h4>可添加歌曲</h4>
          <el-input
            v-model="songDialog.searchKeyword"
            placeholder="搜索歌曲名称..."
            style="margin-bottom: 10px;"
            clearable
            @input="filterAvailableSongs"
          />
          <el-checkbox-group v-model="songDialog.selectedToAdd">
            <el-checkbox
              v-for="song in songDialog.filteredAvailableSongs"
              :key="song.id"
              :label="song.id"
            >
              {{ song.name }}
            </el-checkbox>
          </el-checkbox-group>
          <p v-if="songDialog.filteredAvailableSongs.length === 0" style="color: #999;">无匹配歌曲</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="songDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="songDialog.saving" @click="saveSongChanges">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// ====== 模拟 API（请替换为你的真实接口）======
const api = {
  // 获取歌单列表
  getPlaylists: () => Promise.resolve({ data: [
    { id: 1, name: '热门推荐' },
    { id: 2, name: '我的收藏' }
  ]}),
  
  // 获取歌单已绑定的歌曲
  getPlaylistSongs: (playlistId) => Promise.resolve({ data: [
    { id: 101, name: '晴天' },
    { id: 102, name: '七里香' }
  ]}),
  
  // 获取所有可选歌曲（支持搜索）
  getAllSongs: (keyword = '') => {
    const all = [
      { id: 101, name: '晴天' },
      { id: 102, name: '七里香' },
      { id: 103, name: '青花瓷' },
      { id: 104, name: '稻香' },
      { id: 105, name: '夜曲' }
    ]
    return Promise.resolve({
      data: keyword 
        ? all.filter(s => s.name.includes(keyword))
        : all
    })
  },
  
  // 添加歌曲到歌单
  addSongsToPlaylist: (playlistId, songIds) => Promise.resolve(),
  
  // 从歌单移除歌曲
  removeSongsFromPlaylist: (playlistId, songIds) => Promise.resolve()
}

// ====== 主页面数据 ======
const playlists = ref([])

// 操作方法（保留你原有的）
const handleStatusChange = (id, status, action, type) => {
  console.log('状态变更:', id, action)
}
const handleEditPlaylist = (row) => {
  console.log('编辑歌单:', row)
}
const handleDeletePlaylist = (id) => {
  console.log('删除歌单:', id)
}

// ====== 歌曲弹窗状态 ======
const songDialog = reactive({
  visible: false,
  playlistId: null,
  boundSongs: [],           // 已绑定
  allAvailableSongs: [],    // 所有可选歌曲
  filteredAvailableSongs: [], // 搜索过滤后的
  selectedToRemove: [],     // 选中要删除的
  selectedToAdd: [],        // 选中要添加的
  searchKeyword: '',
  saving: false,

  // 重置弹窗
  reset() {
    this.visible = false
    this.playlistId = null
    this.boundSongs = []
    this.allAvailableSongs = []
    this.filteredAvailableSongs = []
    this.selectedToRemove = []
    this.selectedToAdd = []
    this.searchKeyword = ''
    this.saving = false
  }
})

// 打开弹窗
const openSongDialog = async (playlist) => {
  songDialog.playlistId = playlist.id
  songDialog.visible = true

  try {
    // 加载已绑定歌曲
    const boundRes = await api.getPlaylistSongs(playlist.id)
    songDialog.boundSongs = boundRes.data

    // 加载所有可选歌曲
    const allRes = await api.getAllSongs()
    songDialog.allAvailableSongs = allRes.data
    songDialog.filteredAvailableSongs = allRes.data
  } catch (err) {
    ElMessage.error('加载歌曲失败')
    songDialog.visible = false
  }
}

// 搜索过滤
const filterAvailableSongs = () => {
  if (!songDialog.searchKeyword) {
    songDialog.filteredAvailableSongs = songDialog.allAvailableSongs
  } else {
    songDialog.filteredAvailableSongs = songDialog.allAvailableSongs.filter(song =>
      song.name.includes(songDialog.searchKeyword)
    )
  }
}

// 保存更改
const saveSongChanges = async () => {
  if (songDialog.saving) return
  songDialog.saving = true

  try {
    const { playlistId, selectedToRemove, selectedToAdd } = songDialog

    // 移除歌曲
    if (selectedToRemove.length > 0) {
      await api.removeSongsFromPlaylist(playlistId, selectedToRemove)
    }

    // 添加歌曲
    if (selectedToAdd.length > 0) {
      // 防止重复添加（可选）
      const existingIds = new Set(songDialog.boundSongs.map(s => s.id))
      const uniqueToAdd = selectedToAdd.filter(id => !existingIds.has(id))
      if (uniqueToAdd.length > 0) {
        await api.addSongsToPlaylist(playlistId, uniqueToAdd)
      }
    }

    ElMessage.success('歌曲更新成功')
    songDialog.visible = false
    // 可选：刷新当前歌单数据
  } catch (err) {
    ElMessage.error('保存失败，请重试')
  } finally {
    songDialog.saving = false
  }
}

// 关闭弹窗时重置
const resetSongDialog = () => {
  songDialog.reset()
}

// 初始化加载歌单列表
onMounted(async () => {
  const res = await api.getPlaylists()
  playlists.value = res.data
})
</script>

<style scoped>
.btn-edit {
  margin-right: 8px;
  padding: 4px 8px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.btn-delete {
  margin-right: 8px;
  padding: 4px 8px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>