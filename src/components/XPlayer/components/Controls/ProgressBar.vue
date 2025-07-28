<template>
  <div :class="styles.progressBar.root">
    <!-- 进度条外容器 -->
    <div
      ref="progressBarWrapperRef"
      :class="styles.progressBar.wrapper"
      @mousedown="handleBarWrapperMouseDown"
      @mouseenter="handleBarWrapperMouseEnter"
      @mousemove="handleBarWrapperMouseMove"
      @mouseleave="handleBarWrapperMouseLeave"
    >
      <!-- 进度条内容器 -->
      <div :class="[styles.progressBar.track]">
      <!-- 时间书签标记 -->  
<div  
  v-for="marker in timeMarkers"  
  :key="marker.time"  
  :class="styles.timeMarker.base"  
  :style="{ left: `${marker.position}%` }"  
  :title="`${marker.label} - ${formatTime(marker.time)}`"  
/>

        <!-- 原始播放进度（拖拽时保持显示） -->
        <div
          :class="styles.thumb.current"
          :style="{
            width: `${progressValue}%`,
            opacity: isDragging ? 0 : 1,
          }"
        />

        <!-- 拖拽时的实时进度 -->
        <div
          v-if="isDragging && !progressBar.isLongPressDragging.value"
          :class="[styles.thumb.current, styles.thumb.dragging]"
          :style="{ width: `${dragProgress}%` }"
        />

        <!-- 预览进度 -->
        <div
          v-show="isPreviewVisible && !isDragging"
          :class="styles.thumb.hover"
          :style="{ width: `${previewProgress}%` }"
        />

        <!-- 原始进度拖拽点 -->
        <div
          v-if="isDragging"
          :class="styles.handle.container"
          :style="{ left: `${originalProgress}%` }"
        >
          <div :class="[styles.handle.base, styles.handle.original]" />
        </div>

        <!-- 当前进度拖拽点 -->
        <div
          :class="styles.handle.container"
          :style="{
            left: `${isDragging ? dragProgress : progressValue}%`,
          }"
        >
          <div
            :class="[
              styles.handle.base,
              isHovering && styles.handle.visible,
              isDragging && styles.handle.dragging,
            ]"
          />
        </div>
      </div>
    </div>
    <!-- 缩略图预览 -->
    <Thumbnail
      :visible="isPreviewVisible || isDragging"
      :position="isDragging ? dragProgress : previewProgress"
      :time="previewTime"
      :progress-bar-width="progressBarWidth"
      @seek="handleThumbnailSeek"
    />
  </div>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, onUnmounted, shallowRef, watch, nextTick } from 'vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import Thumbnail from '../Thumbnail/index.vue'

/** 样式抽象 */
const styles = {
  timeMarker: {  
  base: [  
    'absolute top-0 bottom-0 w-1.5',  
    'bg-yellow-400 z-20 transform -translate-x-1/2',  
    'pointer-events-none opacity-80' 
  ]  
},
  progressBar: {
    root: 'relative',
    wrapper: 'py-2 cursor-pointer relative',
    track:
      'h-1 bg-base-content/30 relative transition-[height] duration-100 ease-linear shadow-xl/60',
  },
  thumb: {
    current:
      'absolute h-full bg-primary transition-[width] duration-100 linear',
    dragging: 'transition-none',
    hover: 'absolute h-full bg-primary pointer-events-none',
  },
  handle: {
    container: 'absolute h-full -translate-x-1/2',
    base: [
      'absolute top-1/2 left-1/2 size-3.5',
      'bg-primary rounded-full drop-shadow-xs/60',
      '-translate-x-1/2 -translate-y-1/2 scale-0',
      'transition-all duration-100 ease-linear pointer-events-none',
    ],
    visible: 'scale-100',
    dragging: '!scale-80 bg-base-content! duration-450 ring-4 ring-primary',
    original: '!bg-white/50 !scale-100',
  },
}

const { progressBar, playerCore: player, controls } = usePlayerContext()

// 时间标记数据  
const timeMarkers = shallowRef([])  
  
// 解析网页标题中的时间点   
function parseTimeMarkersFromTitle() {  
  const title = document.title  
  const isFC2 = title.includes('FC2')  
    
  // 更新正则表达式支持 *h*m*s 格式，其中h和s可选  
  const timeRegex = /(\d+h)?(\d+m)(初|末)?(\d+s)?/g  
  const markers = []  
  let match  
    
  while ((match = timeRegex.exec(title)) !== null) {  
    const hours = match[1] ? parseInt(match[1]) : 0  
    const minutes = match[2] ? parseInt(match[2]) : 0  
    const seconds = match[4] ? parseInt(match[4]) : 0  
    const suffix = match[3] // 初、末  
      
    let totalSeconds = hours * 3600 + minutes * 60 + seconds  
      
    // FC2特殊处理  
    if (isFC2 && suffix) {  
      if (suffix === '初') {  
        totalSeconds = hours * 3600 + minutes * 60 + 0 // *h*m0s  
      } else if (suffix === '末') {  
        totalSeconds = hours * 3600 + minutes * 60 + 40 // *h*m40s  
      }  
    } else if (isFC2 && !suffix && !match[4]) {  
      // FC2且没有后缀和秒数，默认为20秒  
      totalSeconds = hours * 3600 + minutes * 60 + 20 // *h*m20s  
    }  
      
    if (totalSeconds > 0 && duration.value > 0) {  
      const position = (totalSeconds / duration.value) * 100  
      if (position <= 100) {  
        markers.push({  
          time: totalSeconds,  
          position: position,  
          label: match[0]  
        })  
      }  
    }  
  }  
    
  timeMarkers.value = markers  
}
  
// 格式化时间显示  
function formatTime(seconds) {  
  const hours = Math.floor(seconds / 3600)  
  const minutes = Math.floor((seconds % 3600) / 60)  
  const secs = Math.floor(seconds % 60)  
    
  if (hours > 0) {  
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`  
  }  
  return `${minutes}:${secs.toString().padStart(2, '0')}`  
}

const progressValue = computed(() => {
  return (
    ((player.value?.currentTime ?? 0) / (player.value?.duration ?? 1)) * 100
  )
})

const duration = computed(() => player.value?.duration ?? 0)
// 在第116行duration计算属性之后添加  
watch(  
  [() => player.value?.canplay, () => duration.value, () => controls.visible.value],  
  ([canplay, dur, visible]) => {  
    // 当播放器准备就绪、有时长、控制栏可见且时间标记为空时，解析时间标记  
    if (canplay && dur > 0 && visible && timeMarkers.value.length === 0) {  
      nextTick(() => {  
        parseTimeMarkersFromTitle()  
      })  
    }  
  },  
  { immediate: true }  
)
/** 进度条容器 */
const progressBarWrapperRef = shallowRef<HTMLElement | null>(null)
/** 进度条宽度 - 使用 useElementSize 替代 */
const { width: progressBarWidth } = useElementSize(progressBarWrapperRef)
/** 是否在拖拽 */
const isDragging = progressBar.isDragging
/** 是否在进度条内 */
const isInProgressBar = shallowRef(false)
/** 是否悬停 */
const isHovering = computed(() => isInProgressBar.value || isDragging.value)
/** 拖拽进度 */
const dragProgress = shallowRef(0)
/** 原始进度 */
const originalProgress = shallowRef(0)
/** 预览时间 */
const previewTime = shallowRef(0)
/** 预览进度 */
const previewProgress = shallowRef(0)
/** 预览是否可见 */
const isPreviewVisible = shallowRef(false)

/** 计算鼠标位置对应的进度 */
function calculatePosition(event: MouseEvent, element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const position = (event.clientX - rect.left) / rect.width
  return Math.min(Math.max(position, 0), 1)
}

/** BarWrapper 鼠标按下 */
function handleBarWrapperMouseDown(event: MouseEvent) {
  if (!progressBarWrapperRef.value)
    return
  const position = calculatePosition(event, progressBarWrapperRef.value)
  startDragging(position)
}

/** BarWrapper 鼠标进入 */
function handleBarWrapperMouseEnter() {
  isInProgressBar.value = true
  if (!isPreviewVisible.value) {
    showPreview()
  }
}

/** BarWrapper 鼠标移动 */
function handleBarWrapperMouseMove(event: MouseEvent) {
  if (!progressBarWrapperRef.value)
    return
  const position = calculatePosition(event, progressBarWrapperRef.value)
  updatePreview(position)
}

/** BarWrapper 鼠标离开 */
function handleBarWrapperMouseLeave() {
  isInProgressBar.value = false
  hidePreview()
}

/** 全局鼠标移动 */
function handleGlobalMouseMove(event: MouseEvent) {
  if (!progressBarWrapperRef.value)
    return
  const position = calculatePosition(event, progressBarWrapperRef.value)
  updateDragging(position)
}

/** 全局鼠标松开 */
function handleGlobalMouseUp(event: MouseEvent) {
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
  if (!progressBarWrapperRef.value)
    return
  const position = calculatePosition(event, progressBarWrapperRef.value)
  stopDragging(position)
  if (!isInProgressBar.value) {
    hidePreview()
  }
}

/** 更新预览位置 */
function updatePreview(position: number) {
  previewProgress.value = position * 100
  previewTime.value = position * duration.value
}

/** 开始拖拽 */
function startDragging(position: number) {
  controls.addDisabledAutoHide()
  controls.setDisabledHideOnMouseLeave(true)
  isDragging.value = true
  originalProgress.value = progressValue.value
  dragProgress.value = position * 100
  previewTime.value = position * duration.value
  document.addEventListener('mousemove', handleGlobalMouseMove)
  document.addEventListener('mouseup', handleGlobalMouseUp)
}

/** 更新拖拽 */
function updateDragging(position: number) {
  if (!isDragging.value)
    return
  dragProgress.value = position * 100
  previewTime.value = position * duration.value
}

/** 停止拖拽 */
function stopDragging(position: number) {
  if (isDragging.value) {
    const finalTime = position * duration.value
    player.value?.seek(finalTime)
    previewProgress.value = position * 100
    previewTime.value = finalTime
  }
  isDragging.value = false
  controls.removeDisabledAutoHide()
  controls.setDisabledHideOnMouseLeave(false)
}

/** 显示预览 */
function showPreview() {
  isPreviewVisible.value = true
}

/** 隐藏预览 */
function hidePreview() {
  if (!isDragging.value) {
    isPreviewVisible.value = false
    // 重置预览进度和时间
    previewProgress.value = 0
    previewTime.value = 0
  }
}

/** 处理缩略图点击跳转事件 */
function handleThumbnailSeek(time: number) {
  // 直接跳转到缩略图时间点
  player.value?.seek(time)
  isDragging.value = false
  // 隐藏预览
  hidePreview()

  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
})
</script>
