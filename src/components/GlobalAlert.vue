<template>
  <Teleport to="body">
    <Transition name="alert">
      <div v-if="visible" class="modal-overlay" @click.self="close">
        <div class="modal-content">
          <div class="alert-message">{{ message }}</div>
          <button class="alert-btn" @click="close">确定</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  name: 'GlobalAlert',
  data() {
    return {
      visible: false,
      message: '',
      timer: null,
      escListener: null
    }
  },
  methods: {
    show(msg, duration = 0) {
      if (this.timer) clearTimeout(this.timer);
      this.message = msg;
      this.visible = true;

      // 绑定 ESC
      if (!this.escListener) {
        this.escListener = (e) => {
          if (e.key === 'Escape') this.close();
        };
        document.addEventListener('keydown', this.escListener);
      }

      if (duration > 0) {
        this.timer = setTimeout(() => this.close(), duration);
      }
    },
    close() {
      // 只需要改变数据，Vue 会自动等待动画结束再销毁 DOM
      this.visible = false;
      this.cleanup();
    },
    cleanup() {
      if (this.timer) clearTimeout(this.timer);
      if (this.escListener) {
        document.removeEventListener('keydown', this.escListener);
        this.escListener = null;
      }
    }
  },
  beforeUnmount() {
    this.cleanup();
  }
}
</script>

<style scoped>
/* 1. 基础样式（不含动画定义） */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 30px 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 440px;
  max-width: 90%;
  text-align: center;
}

/* 2. Vue Transition 核心逻辑：替代原有的 @keyframes */
/* 入场 (enter) 和 退场 (leave) 的活跃阶段 */
.alert-enter-active,
.alert-leave-active {
  transition: opacity 0.25s ease;
}

.alert-enter-active .modal-content,
.alert-leave-active .modal-content {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

/* 入场前状态 & 退场后状态 */
.alert-enter-from,
.alert-leave-to {
  opacity: 0;
}

.alert-enter-from .modal-content,
.alert-leave-to .modal-content {
  opacity: 0;
  transform: translateY(-20px);
}

/* 3. 其余静态样式完全保留 */
.alert-message {
  font-size: 16px;
  margin-bottom: 20px;
  line-height: 1.5;
  white-space: pre-line;
  color: #333 !important;
  max-height: 60vh;
  overflow-y: auto;
}
.alert-btn {
  background: #1890ff;
  color: white;
  border: none;
  padding: 8px 24px;
  border-radius: 6px;
  cursor: pointer;
}



.alert-enter-active .modal-overlay,
.alert-leave-active .modal-overlay {
  transition: opacity 0.25s ease;
}

.alert-enter-from .modal-overlay,
.alert-leave-to .modal-overlay {
  opacity: 0;
}
</style>