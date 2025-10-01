<template>
  <button
    :class="[styles.btn.root]"
    data-tip="下一集 (N)"
    @click="handleNextEpisode"
  >
    <Icon :icon="ICON_NEXT" :class="[styles.btn.icon]" />
  </button>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { controlStyles } from '../../styles/common'

/** 发送下一集事件 */
const emit = defineEmits<{
  next: []
}>()

/** 图标 */
const ICON_NEXT = 'material-symbols:skip-next-rounded'

/** 样式 */
const styles = {
  btn: controlStyles.btn,
}

/** 处理下一集点击 */
function handleNextEpisode() {
  emit('next')
}
</script>
