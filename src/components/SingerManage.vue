<template>
  <div class="singer-manage">
    <!-- 头部 -->
    <div class="panel-header">
      <h2>歌手列表</h2>
      <div class="header-actions">
        <div class="search-box">
          <input v-model="singerPage.keyword" placeholder="搜索歌手..." @keyup.enter="fetchSingers(1)" />
          <button @click="fetchSingers(1)">搜索</button>
        </div>
        <button class="btn-add" @click="handleAddSinger">新增歌手</button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>歌手名</th>
            <th>类型</th>
            <th>国家</th>
            <th>描述</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="singer in singerList" :key="singer.id">
            <td>{{ singer.id }}</td>
            <td>{{ singer.name }}</td>
            <td>
              {{
                singer.type === "1" ? '男歌手' :
                singer.type === "2" ? '女歌手' :
                singer.type === "3" ? '组合' :
                singer.type === "4" ? '海外' : '未知'
              }}
            </td>
            <td>{{ singer.country || '-' }}</td>
            <td>{{ singer.description || '-' }}</td>
            <td>{{ formatTime(singer.createTime) }}</td>
            <td class="operate">
              <button class="btn-edit" @click="handleEditSinger(singer)">编辑</button>
              <button class="btn-delete" @click="handleDeleteSinger(singer.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="singerPage.total > 0">
      <button :disabled="singerPage.pageNum === 1" @click="changeSingerPage(singerPage.pageNum - 1)">上一页</button>
      <span>第 {{ singerPage.pageNum }} 页 / 共 {{ Math.ceil(singerPage.total / singerPage.pageSize) }} 页</span>
      <button :disabled="singerPage.pageNum * singerPage.pageSize >= singerPage.total"
        @click="changeSingerPage(singerPage.pageNum + 1)">下一页</button>
    </div>
    <div v-if="singerList.length === 0" class="empty-data">暂无歌手数据</div>

    <!-- 编辑/新增模态框 -->
    <div v-if="showSingerModal" class="modal-overlay">
      <div class="modal-content">
        <h3>{{ isEdit ? '编辑歌手' : '新增歌手' }}</h3>
        <div class="form-row">
          <label>歌手名</label>
          <input v-model="singerForm.name" class="form-input" placeholder="请输入歌手名" />
        </div>
        <div class="form-row">
          <label>歌手类型</label>
          <select v-model.number="singerForm.type" class="form-input">
            <option value="">-- 请选择 --</option>
            <option :value="1">男歌手</option>
            <option :value="2">女歌手</option>
            <option :value="3">组合</option>
            <option :value="4">海外</option>
          </select>
        </div>
        <div class="form-row">
          <label>国家</label>
          <input v-model="singerForm.country" class="form-input" placeholder="请输入国家(如：中国、日本等)" />
        </div>
        <div class="form-row">
          <label>歌手描述</label>
          <textarea v-model="singerForm.description" class="form-input" rows="4" placeholder="请输入歌手描述"></textarea>
        </div>
        <div class="modal-actions">
          <button @click="showSingerModal = false" class="btn-cancel">取消</button>
          <button @click="submitSinger" class="btn-confirm">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

// 数据
const singerList = ref([])
const singerPage = ref({ pageNum: 1, pageSize: 10, total: 0, keyword: '' })
const singerForm = ref({})
const showSingerModal = ref(false)
const isEdit = ref(false)

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN')
}

// 获取歌手列表
const fetchSingers = async (pageNum) => {
  if (pageNum) singerPage.value.pageNum = pageNum
  try {
    const res = await request.get('/artist/list', {
      params: {
        pageNum: singerPage.value.pageNum,
        pageSize: singerPage.value.pageSize,
        keyword: singerPage.value.keyword
      }
    })
    if (res.data.code === '200') {
      singerList.value = res.data.data.records || res.data.data.list || []
      singerPage.value.total = res.data.data.totalRow || res.data.data.total || 0
    }
  } catch (e) {
    console.error('获取歌手列表失败:', e)
    singerList.value = []
  }
}

// 分页
const changeSingerPage = (pageNum) => fetchSingers(pageNum)

// 新增歌手
const handleAddSinger = () => {
  singerForm.value = { type: '' }
  isEdit.value = false
  showSingerModal.value = true
}

// 编辑歌手
const handleEditSinger = (singer) => {
  singerForm.value = { ...singer }
  isEdit.value = true
  showSingerModal.value = true
}

// 提交歌手
const submitSinger = async () => {
  // 表单验证
  if (!singerForm.value.name) {
    alert('请输入歌手名')
    return
  }
  if (!singerForm.value.type) {
    alert('请选择歌手类型')
    return
  }

  try {
    if (isEdit.value) {
      // 编辑
      const submitData = {
        id: singerForm.value.id,
        name: singerForm.value.name,
        type: singerForm.value.type,
        country: singerForm.value.country,
        description: singerForm.value.description
      }
      await request.put('/artist/update', submitData)
      alert('编辑成功')
    } else {
      // 新增
      const submitData = {
        name: singerForm.value.name,
        type: singerForm.value.type,
        country: singerForm.value.country,
        description: singerForm.value.description
      }
      await request.post('/artist/add', submitData)
      alert('新增成功')
    }

    showSingerModal.value = false
    fetchSingers()
  } catch (e) {
    console.error('提交失败:', e)
    alert('操作失败: ' + (e.response?.data?.msg || e.message))
  }
}

// 删除歌手
const handleDeleteSinger = async (id) => {
  if (confirm('确定删除这位歌手吗？')) {
    try {
      await request.delete(`/artist/delete/${id}`)
      alert('删除成功')
      fetchSingers()
    } catch (e) {
      console.error('删除失败:', e)
      alert('删除失败: ' + (e.response?.data?.msg || e.message))
    }
  }
}

onMounted(() => {
  fetchSingers()
})
</script>

<style scoped>
.singer-manage {
  width: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-box input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-box button {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-box button:hover {
  background: #e5e5e5;
}

.btn-add {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add:hover {
  background: #45a049;
}

.table-wrap {
  margin-bottom: 20px;
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  font-size: 14px;
}

.admin-table thead {
  background: #f5f5f5;
}

.admin-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e5e7eb;
}

.admin-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #666;
}

.admin-table tbody tr:hover {
  background: #f9f9f9;
}

.operate {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.btn-edit {
  background: #2196F3;
  color: white;
}

.btn-edit:hover {
  background: #0b7dda;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.btn-delete:hover {
  background: #da190b;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin: 20px 0;
  color: #444;
}

.pagination button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
  background: #f5f5f5;
}

.empty-data {
  text-align: center;
  padding: 40px;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.form-row {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.form-row label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  box-sizing: border-box;
  height: 40px;
  background-color: #fff;
  color: #333;
}

.form-input:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

.form-row textarea.form-input {
  height: auto;
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel:hover {
  background: #e5e5e5;
}

.btn-confirm {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-confirm:hover {
  background: #45a049;
}
</style>
