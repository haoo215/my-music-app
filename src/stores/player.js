import { defineStore } from 'pinia'

let audioInstance = null;

export const usePlayerStore = defineStore('player', {
  state: () => ({
    isPlaying: false,
    duration: 0, 
    playList: [],
   
    // 需要在localStorage存储
    songId: null,
    currentTime: 0,
    audioUrl: '',
    volume: 70, 
    coverUrl: '',
    songName: '',
    artistName: '', 
    currentPlayListId: null,
  }),

  getters: {
    audio: () => audioInstance,
  },

  actions: {
    // ========================
    // 1. 初始化与监听
    // ========================
    initAudio() {
      if (audioInstance || typeof window === 'undefined') return;
      
      audioInstance = new Audio();
      audioInstance.volume = this.volume / 100;
      this.setupAudioListeners();
    },

    setupAudioListeners() {
      const audio = audioInstance;
      if (!audio) return;
      
      audio.addEventListener('timeupdate', () => {
        this.currentTime = audio.currentTime; 
      });
  
      audio.addEventListener('loadedmetadata', () => {
        this.duration = audio.duration;
      });

      audio.addEventListener('play', () => {
        this.isPlaying = true;
      });

      audio.addEventListener('pause', () => {
        this.isPlaying = false;
      });
    },

    // ========================
    // 2. 播放控制
    // ========================
    play() {
      const audio = audioInstance;
      if (!audio?.src) return;
      
      // 避免每次播放都重置，但在持久化恢复后可以保证从断点继续
      if (this.currentTime > 0 && Math.abs(audio.currentTime - this.currentTime) > 1) {
        audio.currentTime = this.currentTime;
      }

      audio.play().catch(err => {
        console.warn('播放失败', err);
      });
    },

    pause() {
      const audio = audioInstance;
      if (!audio) return;
      audio.pause();
    },

    togglePlay() {
      if (!audioInstance?.src) return;

      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    seek(time) {
      this.currentTime = time;
      if (audioInstance) {
        audioInstance.currentTime = time;
      }
    },

    setVolume(val) {
      this.volume = val;
      if (audioInstance) {
        audioInstance.volume = val / 100;
      }
    },

    // ========================
    // 3. 状态与列表管理
    // ========================
    setSong(song, index = 0) {
      if (!song) return;
      this.initAudio();
      
      this.songId = song.id;
      this.songName = song.name;
      this.artistName = song.artist;
      this.coverUrl = song.coverUrl;
      this.audioUrl = song.url;
      this.currentTime = 0;
      this.duration = 0;
      
      const audio = audioInstance;
      audio.src = song.url;
      audio.load();
    },

    setPlayList(list, index = 0) {
      this.playList = list;
    },

    setPlaylistId(id) {
      this.currentPlayListId = id;
    },

    switchPlaylist(list, index = 0,playlistId = null) {
      this.initAudio();
      this.setPlayList(list, index);
      this.setSong(list[index], index);
      this.setPlaylistId(playlistId);
      this.play();
    },

    // ========================
    // 4. 持久化数据恢复
    // ========================
    restore() {
      const audio = audioInstance;
      if (!audio || !this.audioUrl) return;

      audio.src = this.audioUrl;
      audio.currentTime = this.currentTime || 0;
      audio.volume = this.volume / 100;

      audio.load();

      if (this.isPlaying) {
        audio.play().catch(err => {
          console.warn('恢复播放失败', err);
          this.isPlaying = false;
        });
      }
    }
  },

  // ========================
  // 5. Pinia 插件持久化配置
  // ========================
  persist: {
    key: 'player',
    storage: localStorage,
    paths: [
      'songId', 'songName', 'artistName', 
      'coverUrl','currentTime', 'audioUrl',
      'volume', 'currentPlayListId'
    ]
  } 
});