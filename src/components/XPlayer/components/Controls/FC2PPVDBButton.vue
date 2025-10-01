<template>
  <button
    :class="[styles.btn.root]"
    @click="handleClick"
  >
    <img :src="iconUrl" :class="styles.icon" alt="FC2PPVDB">
  </button>
</template>

<script setup lang="ts">
import { GM_getResourceURL } from '$'
import { computed } from 'vue'
import { controlRightStyles } from '../../styles/common'

/** 属性 */
const props = defineProps<{
  fc2Number: string
}>()

/** 样式 */
const styles = {
  btn: controlRightStyles.btn,
  icon: 'size-8',
}

/** 图标URL */
const iconUrl = computed(() => GM_getResourceURL('fc2ppvdbIcon'))

/** 处理点击 */
function handleClick() {
  window.open(`https://fc2ppvdb.com/articles/${props.fc2Number}`, '_blank')
}
</script>

