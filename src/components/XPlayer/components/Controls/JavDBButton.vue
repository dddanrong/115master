<template>
  <button
    :class="[styles.btn.root]"
    :disabled="loading"
    @click="handleClick"
  >
    <img v-if="!loading" :src="iconUrl" :class="styles.icon" alt="JavDB">
    <span v-else :class="styles.loading">...</span>
  </button>
</template>

<script setup lang="ts">
import { GM_getResourceURL, GM_xmlhttpRequest } from '$'
import { computed, shallowRef } from 'vue'
import { controlRightStyles } from '../../styles/common'

/** 属性 */
const props = defineProps<{
  movieNum: string
}>()

/** 样式 */
const styles = {
  btn: controlRightStyles.btn,
  icon: 'size-8',
  loading: 'text-xs',
}

/** 加载状态 */
const loading = shallowRef(false)

/** 图标URL */
const iconUrl = computed(() => GM_getResourceURL('javdbIcon'))

/** 处理点击 */
function handleClick() {
  if (loading.value)
    return

  loading.value = true

  GM_xmlhttpRequest({
    method: 'GET',
    url: `https://javdb.com/search?q=${props.movieNum.replace(/00/g, '-').toUpperCase()}`,
    onload: (r) => {
      loading.value = false
      const href = new DOMParser()
        .parseFromString(r.responseText, 'text/html')
        .querySelector('.movie-list a')
        ?.getAttribute('href')

      if (href) {
        window.open(`https://javdb.com${href}`, '_blank')
      }
      else {
        alert('未找到该番号')
      }
    },
    onerror: () => {
      loading.value = false
      alert('请求失败')
    },
  })
}
</script>

