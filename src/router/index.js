import { createRouter, createWebHistory } from 'vue-router' 
import Home from '../views/Home.vue'
import Charts from '../views/Charts.vue'
import Login from '../views/Login.vue'
import Player from '../views/Player.vue'
import Search from '../views/Search.vue'
import Singers from '../views/Singers.vue'
import PlaylistDetail from '../views/PlaylistDetail.vue'
import SongDetail from '../views/SongDetail.vue'
import Profile from '../views/Profile.vue'
import Admin from '@/views/Admin.vue'
import AISong from '../views/AISong.vue' 
import PlaylistPage from "@/views/Playlist.vue"
import SonglistPage from "@/views/Songlist.vue"
import Map from '@/views/Map.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/charts', component: Charts },
  { path: '/login', component: Login },
  { path: '/map', component: Map },
  {
    path: '/singers',
    name: 'Singers',
    component: Singers
  },
  { path: '/player', component: Player ,meta: { requireAuth: true }},
  { path: '/search', component: Search },
  { path: '/playlist/:id', component: PlaylistDetail, props: true },
  { path: '/song/:id', component: SongDetail, props: true },
  { path: '/:pathMatch(.*)*', redirect: '/' },
  {
    path: '/player/:id',
    name: 'Player',
    component: Player,
    props: true
  },
   {
    path: "/playlists",
    component: PlaylistPage
  },
   {
    path: "/songlists",
    component: SonglistPage
  },
  { path: '/profile', component: Profile },
  {
  path: '/admin',
  component: Admin
},
{
  path: '/about',
  component: () => import('@/views/About.vue')
},

{
  path: '/shared-playlists',
  name: 'SharedPlaylists',
  component: () => import('@/views/SharedPlaylists.vue')
},
  { path: '/ai-song', name: 'AISong', component: AISong } 
]

const router = createRouter({
  history: createWebHistory(), 
  routes,
  linkActiveClass: 'router-link-active'
})


// 路由守卫：判断是否需要登录
router.beforeEach((to, from, next) => {
  //看目标页面是否需要登录
  const needLogin = to.meta.requireAuth

  //看本地是否有登录信息
  const isLogin = !!localStorage.getItem('userInfo')

  if (needLogin) {
    if (isLogin) {
      next() // 已登录 → 放行
    } else {
      alert('该页面需要登录') // 
      next('/login') // 想跳登录页就用这个
    }
  } else {
    next() // 不需要登录 → 直接进
  }
})


export default router;
