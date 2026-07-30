<template>
  <div class="song-detail-page">
    <!-- 顶部导航栏 -->
    <div class="nav-container">
      <div class="nav-content">
        <router-link to="/" class="nav-logo">音乐星球</router-link>
        <button class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          返回
        </button>
      </div>
    </div>

    <!-- 歌曲核心信息区 -->
    <div class="song-info-section">
      <div class="song-info-container">
        <!-- 歌曲封面 -->
        <div class="song-cover">
          <img :src="songInfo.coverUrl" alt="歌曲封面" @error="handleCoverError">
          <div class="play-btn" @click="handlePlay(songInfo)">
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        <!-- 歌曲基本信息 -->
        <div class="song-meta">
          <h1 class="song-title">{{ songInfo.name }}</h1>
          <div class="song-artist">
            <span>歌手：</span>
            <router-link :to="`/artist/${songInfo.artistId}`">{{ songInfo.artist }}</router-link>
          </div>
          <div class="song-album">
            <span>时长：</span>
            <span>{{ songInfo.duration }}</span>
          </div>
          <div class="song-stats">
            <span class="play-count">{{ formatCount(songInfo.playCount) }} 播放</span>
            <span class="like-count">{{ formatCount(songInfo.likeCount) }} 喜欢</span>
            <span class="comment-count">{{ formatCount(commentTotal) }} 评论</span>
          </div>


          <!-- 操作按钮 -->
          <div class="song-actions">
            <button class="action-btn like-btn" :class="{ liked: isLiked }" @click="toggleLike">
              <svg v-if="!isLiked" viewBox="0 0 24 24">
                <path
                  d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" />
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <path
                  d="M21 8.25c0-2.34-1.95-4.25-4.31-4.25-1.85 0-3.45 1.04-4.09 2.54l-.19.39-.19-.39C10.76 4 9.16 3 7.31 3 4.95 3 3 4.9 3 7.25c0 1.75.98 3.29 2.48 4.06l.5.26.5-.26C10.02 10.54 11 9 11 7.25 11 6.38 10.64 5.63 10.06 5.12 10.7 4.41 11.79 4 13 4c1.66 0 3 1.34 3 3 0 1.31-.84 2.41-2 2.83V12h5c1.1 0 2 .9 2 2v2.75c0 .41-.34.75-.75.75s-.75-.34-.75-.75V14h-3.83l1.07 5.33c.2 1.01-1.08 1.8-2.12 1.18l-1.33-.88-1.33.88c-.7.47-1.57.44-2.2-.08l-1.83-1.22c-.51-.34-.79-.93-.79-1.57V14H4c-.55 0-1-.45-1-1v-2c0-1.1.9-2 2-2h5v-.77C9.84 8.64 11 7.5 11 6c0-3.31-2.69-6-6-6S-1 2.69-1 6s2.69 6 6 6c1.5 0 2.84-1.16 3.41-2.74l.6.32c1.13.59 2.51.92 3.99.92 2.76 0 5-2.24 5-5z" />
              </svg>
              {{ isLiked ? '已喜欢' : '喜欢' }}
            </button>
            <button class="action-btn collect-btn" :class="{ collected: isCollected }" @click="toggleCollect">
              <svg v-if="!isCollected" viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <path
                  d="M21 5h-2.64l1.14-3.14L17.15 1l-1.46 4H3v2l2.64 7.59-1.35 2.45 1.48 1.48 6-3.81C14.46 17.99 16.04 19 17.99 19 20.72 19 23 16.72 23 14c0-1.95-1.01-3.71-2.54-4.66l-.46-.31L21 5zm-10.6 11.46l-1.07-1.07-4.87 3.15 1.07 1.07L10.4 16.46zM6.14 9.54l1.07-1.07 1.95 1.95L8.09 11.5l-1.95-1.95zm11.72-6.85c-.39-.39-1.02-.39-1.41 0l-1.07 1.07 1.41 1.41 1.07-1.07c.39-.39.39-1.02 0-1.41z" />
              </svg>
              {{ isCollected ? '已收藏' : '收藏' }}
            </button>
            <button class="action-btn share-btn" @click="shareSong">
              <svg viewBox="0 0 24 24">
                <path
                  d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
              </svg>
              分享
            </button>

          </div>
        </div>
        <!-- 歌词展示区域 -->
        <div class="lyric-container" id="div123">
          <div class="lyric-content">
            <div class="lyric-line" v-for="(line, index) in formattedLyricLines" :key="index">
              {{ line }}
            </div>
            <div class="empty-lyric" v-if="!songInfo.lyric">暂无歌词</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 评论区 -->
    <div class="comments-section">
      <div class="comments-container">
        <!-- 评论区标题 -->
        <div class="comments-header">
          <h2>
            <svg viewBox="0 0 24 24">
              <path
                d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
            评论区
            <span class="comments-total">({{ formatCount(commentTotal) }})</span>
          </h2>
          <div class="sort-controls">
            <span>排序：</span>
            <button class="sort-btn" :class="{ active: sortType === 'hot' }" @click="changeSort('hot')">
              热门
            </button>
            <button class="sort-btn" :class="{ active: sortType === 'new' }" @click="changeSort('new')">
              最新
            </button>
          </div>
        </div>

        <!-- 发布评论输入框 -->
        <div class="comment-post">
          <div class="user-avatar">
            <img :src="userInfo.avatar" alt="用户头像" @error="handleAvatarError">
          </div>
          <div class="comment-input-wrapper">
            <textarea v-model="newCommentContent" placeholder="分享你的感受..." class="comment-input"
              @keyup.enter.exact="submitComment" @keyup.enter.shift.exact="handleShiftEnter"
              :disabled="isSubmitting"></textarea>
            <div class="comment-post-actions">
              <span class="char-count">{{ newCommentContent.length }}/200</span>
              <button class="submit-comment-btn" @click="submitComment"
                :disabled="!newCommentContent.trim() || isSubmitting || newCommentContent.length > 200">
                {{ isSubmitting ? '发布中...' : '发布评论' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 评论列表 -->
        <div class="comments-list" v-if="comments.length > 0">
          <div class="comment-item" v-for="(comment, index) in comments" :key="comment.id">
            <div class="comment-avatar">
              <img :src="comment.userAvatar" alt="评论用户头像" @error="handleAvatarError">
            </div>
            <div class="comment-content-wrapper">
              <div class="comment-header">
                <span class="comment-username">{{ comment.username }}</span>
                <span class="comment-time">{{ formatTime(comment.createTime) }}</span>
                <span class="comment-like-count" v-if="comment.likeCount > 0">
                  {{ formatCount(comment.likeCount) }}
                </span>
              </div>
              <div class="comment-content">{{ comment.content }}</div>
              <div class="comment-actions">
                <button class="comment-action-btn like-btn" :class="{ liked: comment.isLiked }"
                  @click="likeComment(comment.id, index)">
                  <svg v-if="!comment.isLiked" viewBox="0 0 24 24">
                    <path
                      d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24">
                    <path
                      d="M21 8.25c0-2.34-1.95-4.25-4.31-4.25-1.85 0-3.45 1.04-4.09 2.54l-.19.39-.19-.39C10.76 4 9.16 3 7.31 3 4.95 3 3 4.9 3 7.25c0 1.75.98 3.29 2.48 4.06l.5.26.5-.26C10.02 10.54 11 9 11 7.25 11 6.38 10.64 5.63 10.06 5.12 10.7 4.41 11.79 4 13 4c1.66 0 3 1.34 3 3 0 1.31-.84 2.41-2 2.83V12h5c1.1 0 2 .9 2 2v2.75c0 .41-.34.75-.75.75s-.75-.34-.75-.75V14h-3.83l1.07 5.33c.2 1.01-1.08 1.8-2.12 1.18l-1.33-.88-1.33.88c-.7.47-1.57.44-2.2-.08l-1.83-1.22c-.51-.34-.79-.93-.79-1.57V14H4c-.55 0-1-.45-1-1v-2c0-1.1.9-2 2-2h5v-.77C9.84 8.64 11 7.5 11 6c0-3.31-2.69-6-6-6S-1 2.69-1 6s2.69 6 6 6c1.5 0 2.84-1.16 3.41-2.74l.6.32c1.13.59 2.51.92 3.99.92 2.76 0 5-2.24 5-5z" />
                  </svg>
                  {{ comment.likeCount > 0 ? comment.likeCount : '点赞' }}
                </button>
                <button class="comment-action-btn reply-btn" @click="toggleReply(comment.id, index)">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                  </svg>
                  回复
                </button>
                <button class="comment-action-btn reply-btn" @click="deleteComment(comment)">
                  删除
                </button>
              </div>

              <!-- 回复区 -->
              <div class="reply-section" v-if="comment.showReply">
                <div class="reply-input-wrapper">
                  <textarea v-model="replyContent" :placeholder="'回复 @' + comment.username + '...'" class="reply-input"
                    @keyup.enter.exact="() => submitReply(comment.id, index)"
                    @keyup.enter.shift.exact="handleShiftEnter" :disabled="isReplying"></textarea>
                  <div class="reply-actions">
                    <button class="cancel-reply-btn" @click="toggleReply(comment.id, index)" :disabled="isReplying">
                      取消
                    </button>
                    <button class="submit-reply-btn" @click="() => submitReply(comment.id, index)"
                      :disabled="!replyContent.trim() || isReplying || replyContent.length > 200">
                      {{ isReplying ? '回复中...' : '回复' }}
                    </button>
                  </div>
                </div>

                <div class="reply-list" v-if="comment.replies && comment.replies.length > 0">
                  <div class="reply-item" v-for="(reply, rIndex) in comment.replies" :key="reply.id">
                    <div class="reply-avatar">
                      <img :src="reply.userAvatar" alt="回复用户头像" @error="handleAvatarError">
                    </div>
                    <div class="reply-content-wrapper">
                      <div class="reply-header">
                        <span class="reply-username">{{ reply.username }}</span>
                        <span class="reply-time">{{ formatTime(reply.createTime) }}</span>
                      </div>
                      <div class="reply-content">
                        <span class="reply-to">@{{ reply.replyToUsername }}：</span>
                        {{ reply.content }}
                      </div>
                      <div class="reply-actions">
                        <button class="reply-action-btn like-btn" :class="{ liked: reply.isLiked }"
                          @click="likeReply(comment.id, index, reply.id, rIndex)">
                          <svg v-if="!reply.isLiked" viewBox="0 0 24 24">
                            <path
                              d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" />
                          </svg>
                          <svg v-else viewBox="0 0 24 24">
                            <path
                              d="M21 8.25c0-2.34-1.95-4.25-4.31-4.25-1.85 0-3.45 1.04-4.09 2.54l-.19.39-.19-.39C10.76 4 9.16 3 7.31 3 4.95 3 3 4.9 3 7.25c0 1.75.98 3.29 2.48 4.06l.5.26.5-.26C10.02 10.54 11 9 11 7.25 11 6.38 10.64 5.63 10.06 5.12 10.7 4.41 11.79 4 13 4c1.66 0 3 1.34 3 3 0 1.31-.84 2.41-2 2.83V12h5c1.1 0 2 .9 2 2v2.75c0 .41-.34.75-.75.75s-.75-.34-.75-.75V14h-3.83l1.07 5.33c.2 1.01-1.08 1.8-2.12 1.18l-1.33-.88-1.33.88c-.7.47-1.57.44-2.2-.08l-1.83-1.22c-.51-.34-.79-.93-.79-1.57V14H4c-.55 0-1-.45-1-1v-2c0-1.1.9-2 2-2h5v-.77C9.84 8.64 11 7.5 11 6c0-3.31-2.69-6-6-6S-1 2.69-1 6s2.69 6 6 6c1.5 0 2.84-1.16 3.41-2.74l.6.32c1.13.59 2.51.92 3.99.92 2.76 0 5-2.24 5-5z" />
                          </svg>
                          {{ reply.likeCount > 0 ? reply.likeCount : '点赞' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button class="load-more-replies-btn" v-if="comment.hasMoreReplies"
                  @click="loadMoreReplies(comment.id, index)" :disabled="isLoadingReplies">
                  {{ isLoadingReplies ? '加载中...' : '查看更多回复' }}
                </button>
              </div>
            </div>
          </div>

          <!-- ✅ 新增：评论分页组件 -->
          <div class="pagination" v-if="totalPages > 1">
            <button class="page-btn" :disabled="currentPage === 1" @click="changeCommentPage(currentPage - 1)">
              上一页
            </button>

            <div class="page-numbers">
              <button v-for="page in displayPages" :key="page" class="page-number-btn"
                :class="{ active: currentPage === page }" @click="changeCommentPage(page)">
                {{ page }}
              </button>
            </div>

            <button class="page-btn" :disabled="currentPage === totalPages" @click="changeCommentPage(currentPage + 1)">
              下一页
            </button>

            <span class="page-info">
              第 {{ currentPage }} / {{ totalPages }} 页
            </span>
          </div>
        </div>

        <!-- 空评论提示 -->
        <div class="empty-comments" v-if="comments.length === 0 && !isLoadingComments">
          <svg viewBox="0 0 24 24">
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
          <p>暂无评论，快来抢沙发吧～</p>
        </div>

        <!-- 加载中提示 -->
        <div class="loading-comments" v-if="isLoadingComments">
          <div class="loading-spinner"></div>
          <p>加载评论中...</p>
        </div>

        <!-- 没有更多评论 (仅在只有一页且无更多时显示) -->
        <div class="no-more-comments"
          v-if="!hasMoreComments && comments.length > 0 && totalPages <= 1 && !isLoadingComments">
          已经到底啦～
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request'
import { usePlayerStore } from '@/stores/player'

const playerStore = usePlayerStore()
const route = useRoute()
const router = useRouter()


// 1. 获取URL中的歌曲ID
const songId = ref(route.params.id)

// 2. 初始化歌曲信息
const songInfo = ref({
  id: songId.value,
  name: '未知歌曲',
  artist: '未知歌手',
  artistId: '',
  albumId: '',
  coverUrl: '',
  duration: '00:00',
  playCount: 0,
  likeCount: 0,
  url: ''
})

// 3. 评论相关状态
const commentTotal = ref(0) // 评论总数
const comments = ref([])
const currentPage = ref(1)
const pageSize = ref(10) // 每页显示10条
const sortType = ref('hot') // hot 或 new
const isLoadingComments = ref(false)
const isLoadingMoreComments = ref(false)
const hasMoreComments = ref(true)

// 回复相关状态
const isLoadingReplies = ref(false)
const isSubmitting = ref(false)
const isReplying = ref(false)
const newCommentContent = ref('')
const replyContent = ref('')

// 用户状态
const userInfo = ref({
  id: 'user1001',
  username: '音乐爱好者',
  avatar: 'https://picsum.photos/seed/user1001/60'
})

const isLiked = ref(false)
const isCollected = ref(false)

// 4. 计算属性：总页数
const totalPages = computed(() => {
  return Math.ceil(commentTotal.value / pageSize.value) || 1;
});

// 5. 计算属性：显示的页码列表 (例如：1 2 3 4 5)
const displayPages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;

  // 策略：显示当前页前后各2页，最多显示5个数字
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + 4);

  if (end - start < 4) {
    start = Math.max(1, end - 4);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// 6. 获取歌曲详情
const fetchSongDetail = async () => {
  try {
    const res = await request.get(`/song/detail/${songId.value}`)
    // 获取歌曲的点赞量
    const liked = await request.post(`/songLikes/querySongLikes`, {
      songId: songId.value
    })
    if (res.data.code === "200" && res.data.success) {
      songInfo.value = res.data.data
      songInfo.value.likeCount = liked.data
    }
  } catch (error) {
    console.error('请求歌曲详情失败：', error)
  }
}




// 7. 获取评论列表 (支持分页)
const fetchComments = async (resetPage = false) => {
  if (resetPage) {
    isLoadingComments.value = true;
    comments.value = [];
    hasMoreComments.value = true;
  } else if (currentPage.value > 1) {
    // 如果是加载更多（虽然我们现在用分页，但保留逻辑以防万一）
    isLoadingMoreComments.value = true;
  } else {
    isLoadingComments.value = true;
  }

  try {
    const res = await request.post('/song-comments/list', {
      songId: songId.value,
      parentId: 0,
      pageNum: currentPage.value,
      pageSize: pageSize.value,
    })

    if (res.data.code === '200' || res.data.success) {
      const pageData = res.data.data

      // ✅ 更新总数
      if (pageData && pageData.totalRow !== undefined) {
        commentTotal.value = pageData.totalRow;
      } else if (pageData && pageData.total !== undefined) {
        commentTotal.value = pageData.total;
      }

      let newComments = []
      if (Array.isArray(pageData)) {
        newComments = pageData
      } else if (pageData && Array.isArray(pageData.records)) {
        newComments = pageData.records
      } else if (pageData && Array.isArray(pageData.list)) {
        newComments = pageData.list
      }

      const formattedComments = newComments.map(item => ({
        id: item.id,
        userId: item.uid,
        username: item.username || '未知用户',
        userAvatar: item.avatar || `https://picsum.photos/seed/${item.uid}/60`,
        content: item.content,
        createTime: item.createdAt,
        likeCount: item.likeCount || 0,
        isLiked: false,
        showReply: false,
        hasMoreReplies: true,
        replies: [],
        replyPageNum: 1
      }))

      // 如果是重置页面，直接替换；否则追加（分页模式下通常是替换）
      if (resetPage || currentPage.value === 1) {
        comments.value = formattedComments
      } else {
        comments.value = [...comments.value, ...formattedComments]
      }

      // 判断是否有更多
      if (comments.value.length >= commentTotal.value) {
        hasMoreComments.value = false
      } else if (newComments.length < pageSize.value) {
        hasMoreComments.value = false
      }
    }
  } catch (err) {
    console.error('获取评论失败', err)
  } finally {
    isLoadingComments.value = false
    isLoadingMoreComments.value = false
  }
}

// 8. 切换页码
const changeCommentPage = async (page) => {
  console.log('🖱️ 点击页码按钮，目标页:', page);
  console.log('📊 当前状态 -> 当前页:', currentPage.value, '总页数:', totalPages.value, '总数:', commentTotal.value);

  // 1. 基础校验
  if (page < 1) return;

  if (page === currentPage.value) {
    console.log('⚠️ 已经是第', page, '页，不重复请求');
    return;
  }

  // 4. 【核心】先更新页码变量！
  currentPage.value = page;
  console.log('✅ 页码已更新为:', currentPage.value);

  // 5. 再发起请求 (传入 true 表示重置列表)
  await fetchComments(true);

  // 6. 滚动到顶部
  document.querySelector('.comments-section')?.scrollIntoView({ behavior: 'smooth' });
};

// 9. 切换排序
const changeSort = async (type) => {
  if (sortType.value === type) return
  sortType.value = type
  await fetchComments(true) // 排序改变时重置到第一页
}

// 10. 发布评论
const submitComment = async () => {
  const content = newCommentContent.value.trim()
  if (!content || content.length > 200 || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const res = await request.post('/song-comments/add', {
      songId: songId.value,
      content: content,
      parentId: 0
    })

    if (res.data.code === '200' || res.data.success || res.data.data === '添加成功') {
      newCommentContent.value = ''
      alert('评论发布成功！')
      // 发布成功后回到第一页查看最新评论
      currentPage.value = 1
      await fetchComments(true)
    } else {
      alert(res.data.msg || '发布失败')
    }
  } catch (err) {
    console.error('发布评论失败', err)
    alert('发布失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

// 11. 其他辅助函数
const formatCount = (count) => {
  if (!count || isNaN(count)) return '0'
  if (count >= 100000000) return (count / 100000000).toFixed(1) + '亿'
  if (count >= 10000) return (count / 10000).toFixed(1) + '万'
  return count.toString()
}

const formatTime = (timestamp) => {
  if (!timestamp) return '未知时间'
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return Math.floor(diff / (60 * 1000)) + '分钟前'
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / (60 * 60 * 1000)) + '小时前'
  if (diff < 365 * 24 * 60 * 60 * 1000) return date.getMonth() + 1 + '月' + date.getDate() + '日'
  return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日'
}

const handleCoverError = (e) => { e.target.src = 'https://picsum.photos/seed/default-cover/300' }
const handleAvatarError = (e) => { e.target.src = 'https://picsum.photos/seed/default-avatar/60' }
const handleShiftEnter = (e) => {
  e.preventDefault()
  const target = e.target
  const start = target.selectionStart
  target.value = target.value.substring(0, start) + '\n' + target.value.substring(target.selectionEnd)
  target.selectionStart = target.selectionEnd = start + 1
}

async function handlePlay(song) {
  try {
    //  加入歌单
    await request.post('/playlist/addSong', {
      songId: song.id,
      playlistId: playerStore.currentPlayListId

    })
    //  设置播放列表ID
    playerStore.setPlaylistId(playerStore.currentPlayListId)

    // 跳转页面
   router.push({
      path: '/player',
      query: { songId: song.id }
    })

  } catch (error) {
    console.error('播放失败', error)
  }
}



// 格式化歌词：按时间戳拆分成逐行
const formattedLyricLines = computed(() => {
  if (!songInfo.value.lyric) return []

  // 1. 按换行符拆分
  const rawLines = songInfo.value.lyric.split('\n')
  const result = []

  // 2. 正则匹配 [00:00.00] 格式的时间戳
  const timeReg = /\[(\d{2}:\d{2}\.\d{2,3})\]/g

  for (const line of rawLines) {
    if (!line.trim()) continue

    // 提取所有时间戳
    const timeMatches = [...line.matchAll(timeReg)]
    // 去掉时间戳，保留歌词文本
    const text = line.replace(timeReg, '').trim()

    if (text) {
      // 每个时间戳对应一行（兼容一行多时间戳的情况）
      if (timeMatches.length > 0) {
        timeMatches.forEach(() => result.push(text))
      } else {
        result.push(text)
      }
    }
  }

  return result
})



// 点赞 / 取消点赞
const toggleLike = async () => {
  try {
    // 先取反（乐观更新，界面不卡顿）
    const oldStatus = isLiked.value
    isLiked.value = !oldStatus

    // 调用后端
    const res = await request.post("/songLikes/addLike", {
      songId: songId.value,
      type: 1,
      liked: 1,
    })

    if (res.data.success) {
      // 成功：更新数量
      songInfo.value.likeCount = res.data.data
    } else {
      // 失败：回滚
      isLiked.value = oldStatus
      alert(res.data.msg || "操作3333失败")
    }
  } catch (err) {
    // 异常回滚
    isLiked.value = !isLiked.value
    console.error(err)
  }
}


const deleteComment = async (comment) => {
  if (!confirm('确定要删除这条评论吗？\n子评论也会一起删除哦！')) return
  console.log("然我看看",comment)
  try {
    const res = await request.post('/song-comments/delete', {
      commentId: comment.id,
      uid:comment.userId  
    })

    if (res.data.success || res.data.code === '200') {
      alert('删除成功')
      // 删除成功后刷新评论
      await fetchComments(true)
    } else {
      alert(res.data.msg || '删除失败')
    }
  } catch (err) {
    console.error(err)
    alert('删除失败，请检查权限')
  }
}



const toggleCollect = async () => {
  isCollected.value = !isCollected.value
}


const shareSong = () => {
  if (navigator.share) {
    navigator.share({ title: songInfo.value.name, text: `推荐你听：${songInfo.value.name}`, url: window.location.href }).catch(() => { })
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => alert('链接已复制'))
  }
}

const likeComment = async (id, index) => {
  // 防止重复点赞
  if (comments.value[index]._liking) return

  try {
    comments.value[index]._liking = true
    const comment = comments.value[index]
    // 先取反（乐观更新）
    const oldStatus = comment.isLiked
    const oldLikeCount = comment.likeCount

    comment.isLiked = !oldStatus
    comment.likeCount += comment.isLiked ? 1 : -1

    // 调用后端
    const res = await request.post("/songLikes/addLike", {
      commentId: id,
      type: 2,
      liked: 1
    })

    if (res.data.success) {
      // 成功：保持更新状态
      comment.likeCount = res.data.data || comment.likeCount
    } else {
      // 失败：回滚
      comment.isLiked = oldStatus
      comment.likeCount = oldLikeCount
      alert(res.data.msg || "点赞失败")
    }
  } catch (err) {
    // 异常回滚
    const comment = comments.value[index]
    comment.isLiked = !comment.isLiked
    comment.likeCount += comment.isLiked ? -1 : 1
    console.error(err)
  } finally {
    comments.value[index]._liking = false
  }
}

const likeReply = async (cId, cIndex, rId, rIndex) => {
  // 防止重复点赞
  if (comments.value[cIndex].replies[rIndex]._liking) return

  try {
    const reply = comments.value[cIndex].replies[rIndex]
    reply._liking = true
    // 先取反（乐观更新）
    const oldStatus = reply.isLiked
    const oldLikeCount = reply.likeCount

    reply.isLiked = !oldStatus
    reply.likeCount += reply.isLiked ? 1 : -1

    // 调用后端
    const res = await request.post("/songLikes/addLike", {
      commentId: rId,
      type: 2,
      liked: 1
    })

    if (res.data.success) {
      // 成功：保持更新状态
      reply.likeCount = res.data.data || reply.likeCount
    } else {
      // 失败：回滚
      reply.isLiked = oldStatus
      reply.likeCount = oldLikeCount
      alert(res.data.msg || "点赞失败")
    }
  } catch (err) {
    // 异常回滚
    const reply = comments.value[cIndex].replies[rIndex]
    reply.isLiked = !reply.isLiked
    reply.likeCount += reply.isLiked ? -1 : 1
    console.error(err)
  } finally {
    comments.value[cIndex].replies[rIndex]._liking = false
  }
}

const toggleReply = async (id, index) => {
  const comment = comments.value[index]
  comment.showReply = !comment.showReply
  replyContent.value = ''
  if (comment.showReply && comment.replies.length === 0) {
    await loadMoreReplies(id, index)
  }
}

const submitReply = async (commentId, index) => {
  const content = replyContent.value.trim()
  if (!content || isReplying.value) return
  isReplying.value = true
  try {
    const res = await request.post('/song-comments/add', {
      songId: songId.value,
      content: content,
      parentId: commentId
    })
    if (res.data.code === '200' || res.data.success) {
      alert('回复成功！')
      // 重新加载评论以显示新回复
      await fetchComments(false)
      // 重新展开刚才那条评论
      const comment = comments.value.find(c => c.id === commentId);
      if (comment) comment.showReply = true;
      replyContent.value = ''
    }
  } catch (err) {
    alert('回复失败')
  } finally {
    isReplying.value = false
  }
}

const loadMoreReplies = async (commentId, index) => {
  const comment = comments.value[index]
  if (!comment) return
  isLoadingReplies.value = true
  try {
    const res = await request.post('/song-comments/list', {
      songId: songId.value,
      parentId: commentId,
      pageNum: comment.replyPageNum,
      pageSize: 5
    })
    const pageData = res.data.data
    let newReplies = []
    if (pageData && Array.isArray(pageData.records)) newReplies = pageData.records

    const formattedReplies = newReplies.map(item => ({
      id: item.id,
      username: item.username,
      userAvatar: item.avatar,
      replyToUsername: comment.username,
      content: item.content,
      createTime: item.createdAt,
      likeCount: item.likeCount || 0,
      isLiked: false
    }))

    comment.replies = [...comment.replies, ...formattedReplies]
    if (newReplies.length < 5) comment.hasMoreReplies = false
    else comment.replyPageNum++
  } catch (err) {
    console.error(err)
  } finally {
    isLoadingReplies.value = false
  }
}

onMounted(() => {
  fetchSongDetail()
  fetchComments(true)
})
</script>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.song-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 导航栏 */
.nav-container {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  color: #ff6b90;
  font-size: 20px;
  font-weight: 600;
  text-decoration: none;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.back-btn svg {
  width: 18px;
  height: 18px;
  fill: #fff;
}

/* 歌曲信息区 */
.song-info-section {
  padding: 40px 24px;
}

.song-info-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 40px;
}

.song-cover {
  position: relative;
  width: 280px;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(255, 107, 144, 0.3);
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b90 0%, #ff477e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(255, 107, 144, 0.5);
  transition: transform 0.2s;
}

.play-btn:hover {
  transform: scale(1.05);
}

.play-btn svg {
  width: 24px;
  height: 24px;
  fill: #fff;
  margin-left: 4px;
}

.song-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.song-title {
  font-size: 40px;
  font-weight: 600;
  color: #fff;
  line-height: 1.2;
}

.song-artist,
.song-album {
  font-size: 18px;
  color: #aaa;
  display: flex;
  align-items: center;
  gap: 8px;
}

.song-artist a {
  color: #ff6b90;
  text-decoration: none;
}

.song-stats {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #888;
  margin-top: 8px;
}

.song-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;

  padding: 10px 10px 10px 10px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.like-btn {
  background: rgba(255, 107, 144, 0.1);
  color: #ff6b90;
}

.like-btn.liked {
  background: #ff6b90;
  color: #fff;
}

.collect-btn {
  background: rgba(107, 142, 235, 0.1);
  color: #6b8eeb;
}

.collect-btn.collected {
  background: #6b8eeb;
  color: #fff;
}

.share-btn {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.action-btn svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.action-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

/* 评论区 */
.comments-section {
  padding: 20px 24px 60px;
}

.comments-container {
  max-width: 1200px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.comments-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
}

.comments-header h2 svg {
  width: 24px;
  height: 24px;
  fill: #ff6b90;
}

.comments-total {
  font-size: 14px;
  color: #888;
  font-weight: normal;
  margin-left: 8px;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #888;
}

.sort-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.sort-btn.active {
  color: #ff6b90;
  background: rgba(255, 107, 144, 0.1);
}

.comment-post {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.user-avatar,
.comment-avatar,
.reply-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.reply-avatar {
  width: 36px;
  height: 36px;
}

.user-avatar img,
.comment-avatar img,
.reply-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-input,
.reply-input {
  width: 100%;
  min-height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  color: #fff;
  font-size: 14px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}

.reply-input {
  min-height: 60px;
}

.comment-input:focus,
.reply-input:focus {
  border-color: rgba(255, 107, 144, 0.5);
}

.comment-input:disabled,
.reply-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comment-post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 12px;
  color: #888;
}

.submit-comment-btn,
.submit-reply-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #ff6b90 0%, #ff477e 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-comment-btn:disabled,
.submit-reply-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comment-item {
  display: flex;
  gap: 16px;
}

.comment-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.comment-username {
  font-weight: 500;
  color: #fff;
}

.comment-time {
  color: #888;
  font-size: 12px;
}

.comment-like-count {
  color: #888;
  font-size: 12px;
  margin-left: auto;
}

.comment-content {
  font-size: 14px;
  line-height: 1.5;
  color: #ddd;
  white-space: pre-wrap;
}

.comment-actions {
  display: flex;
  gap: 16px;
  margin-top: 4px;
}

.comment-action-btn,
.reply-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.comment-action-btn:hover,
.reply-action-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ff6b90;
}

.comment-action-btn.liked,
.reply-action-btn.liked {
  color: #ff6b90;
}

.comment-action-btn svg,
.reply-action-btn svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.reply-section {
  margin-top: 12px;
  padding-left: 16px;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
}

.reply-input-wrapper {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-reply-btn {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #888;
  font-size: 14px;
  cursor: pointer;
}

.cancel-reply-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.cancel-reply-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-reply-btn {
  padding: 6px 16px;
  font-size: 14px;
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reply-item {
  display: flex;
  gap: 12px;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.reply-username {
  font-weight: 500;
  color: #fff;
}

.reply-time {
  color: #888;
}

.reply-content {
  font-size: 13px;
  line-height: 1.4;
  color: #ddd;
  white-space: pre-wrap;
  margin-top: 4px;
}

.reply-to {
  color: #ff6b90;
}

.load-more-replies-btn {
  margin-top: 12px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #888;
  font-size: 12px;
  cursor: pointer;
}

.load-more-replies-btn:hover:not(:disabled) {
  border-color: rgba(255, 107, 144, 0.5);
  color: #ff6b90;
}

.load-more-replies-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-comments,
.loading-comments,
.no-more-comments {
  text-align: center;
  padding: 40px 0;
  color: #888;
  font-size: 14px;
}

.empty-comments svg {
  width: 48px;
  height: 48px;
  fill: #888;
  margin-bottom: 16px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ff6b90;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ✅ 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.page-btn,
.page-number-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled),
.page-number-btn:hover:not(.active) {
  background: rgba(255, 107, 144, 0.2);
  border-color: #ff6b90;
  color: #ff6b90;
}

.page-number-btn.active {
  background: #ff6b90;
  border-color: #ff6b90;
  color: #fff;
  font-weight: bold;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: transparent;
}

.page-numbers {
  display: flex;
  gap: 6px;
}

.page-info {
  font-size: 12px;
  color: #888;
  margin-left: 8px;
}

/* 响应式 */
@media (max-width: 768px) {
  .song-info-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 24px;
  }

  .song-cover {
    width: 200px;
    height: 200px;
  }

  .song-title {
    font-size: 28px;
  }

  .song-actions {
    flex-wrap: wrap;
  }

  .comments-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .comment-post {
    gap: 12px;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
  }
}

/* 歌词容器 - 美化版 */
.lyric-container {
  width: 100%;
  max-width: 600px;
  max-height: 220px;
  /* 增加高度，显示更多行 */
  margin-top: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow-y: auto;
  font-family: 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 滚动条美化 */
.lyric-container::-webkit-scrollbar {
  width: 6px;
}

.lyric-container::-webkit-scrollbar-track {
  background: transparent;
}

.lyric-container::-webkit-scrollbar-thumb {
  background: rgba(255, 107, 144, 0.4);
  border-radius: 3px;
}

.lyric-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 107, 144, 0.6);
}

/* 歌词内容 */
.lyric-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  text-align: center;
}

/* 单行歌词 */
.lyric-line {
  font-size: 16px;
  line-height: 1.6;
  color: #e0e0e0;
  opacity: 0.9;
  transition: all 0.2s ease;
  max-width: 100%;
  word-break: break-word;
  white-space: pre-wrap;
}

/* 鼠标悬停微交互（可选） */
.lyric-line:hover {
  opacity: 1;
  color: #fff;
}

/* 空歌词提示 */
.empty-lyric {
  color: #666;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
  font-style: italic;
}
</style>