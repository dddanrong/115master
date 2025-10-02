<template>
  <div class="relative" :class="[timeMarkers.length > 0 ? 'pb-[35px]' : '']">
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

        <!-- 时间标记 -->
        <template v-for="marker in timeMarkers" :key="marker.time">
          <div
            class="absolute top-0 bottom-0 w-1.5 bg-yellow-400 z-20 transform -translate-x-1/2 pointer-events-none opacity-80"
            :style="{ left: `${marker.position}%` }"
          />

          <div
            class="absolute top-full mt-1 text-xs z-10 pointer-events-none leading-tight"
            :style="{
              left: `${marker.position}%`,
              maxWidth: `${marker.width * (progressBarWidth / 100)}px`,
            }"
          >
            <span
              class="text-white bg-black/75 px-1 py-0.2 rounded shadow-sm"
              style="box-decoration-break: clone; -webkit-box-decoration-break: clone;"
            >
              {{ marker.text }}
            </span>
          </div>
        </template>

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
import { computed, nextTick, onUnmounted, shallowRef, watch } from 'vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import Thumbnail from '../Thumbnail/index.vue'

/** 样式抽象 */
const styles = {
  progressBar: {
    wrapper: 'py-2 cursor-pointer relative',
    track: 'h-1 bg-base-content/30 relative transition-[height] duration-100 ease-linear shadow-xl/60',
  },
  thumb: {
    current: 'absolute h-full bg-primary transition-[width] duration-100 linear',
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
  timeMarker: {
    base: [
      'absolute top-0 bottom-0 w-1.5',
      'bg-yellow-400 z-20 transform -translate-x-1/2',
      'pointer-events-none opacity-80',
    ],
  },
  markerTextLabel: {
    base: [
      'absolute top-full left-0 mt-1',
      'text-white bg-black/75 px-1 py-0.5 rounded text-xs',
      'z-10 pointer-events-none',
      'shadow-sm leading-tight',
      'whitespace-normal overflow-visible', // 允许文本换行和溢出显示
    ],
  },
}

const { progressBar, playerCore: player, controls } = usePlayerContext()

const progressValue = computed(() => {
  return (
    ((player.value?.currentTime ?? 0) / (player.value?.duration ?? 1)) * 100
  )
})

const duration = computed(() => player.value?.duration ?? 0)
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

/** 时间标记类型定义 */
interface TimeMarker {
  time: number
  position: number
  label: string
  text: string
  width: number
}

/** 时间匹配结果类型 */
interface TimeMatch {
  match: string
  index: number
  hours: number
  minutes: number
  seconds: number
  suffix?: string
}

/** 时间标记数据 */
const timeMarkers = shallowRef<TimeMarker[]>([])
/** 上次解析的标题 */
const lastParsedTitle = shallowRef('')

/** 解析标题中的时间点 */
function parseTimeMarkers() {
  const title = document.title.replace(/\.(mp4|avi|mkv|mov|wmv|flv|webm|m4v|3gp|ts|m2ts)$/i, '')

  /** 如果标题没有变化，不重复解析 */
  if (title === lastParsedTitle.value) {
    return
  }

  lastParsedTitle.value = title
  const isFC2 = title.includes('FC2')
  const timeRegex = /(\d+h)?(\d+m)(初|末)?(\d+s)?/g
  const markers: TimeMarker[] = []
  const matches: TimeMatch[] = []
  let match: RegExpExecArray | null = null

  // eslint-disable-next-line no-cond-assign
  while ((match = timeRegex.exec(title)) !== null) {
    matches.push({
      match: match[0],
      index: match.index,
      hours: match[1] ? parseInt(match[1]) : 0,
      minutes: match[2] ? parseInt(match[2]) : 0,
      seconds: match[4] ? parseInt(match[4]) : 0,
      suffix: match[3],
    })
  }

  matches.forEach((current, index) => {
    const nextMatch = matches[index + 1]
    let totalSeconds = current.hours * 3600 + current.minutes * 60 + current.seconds

    /** FC2特殊处理 */
    if (isFC2) {
      if (current.suffix === '初') {
        totalSeconds = current.hours * 3600 + current.minutes * 60 + 0
      }
      else if (current.suffix === '末') {
        totalSeconds = current.hours * 3600 + current.minutes * 60 + 40
      }
      else if (!current.suffix && !current.seconds) {
        totalSeconds = current.hours * 3600 + current.minutes * 60 + 20
      }
    }

    if (totalSeconds >= 0 && duration.value > 0) {
      const position = (totalSeconds / duration.value) * 100
      if (position <= 100) {
        /** 计算下一个时间点的完整秒数 */
        let nextTotalSeconds = duration.value
        if (nextMatch) {
          nextTotalSeconds = nextMatch.hours * 3600 + nextMatch.minutes * 60 + nextMatch.seconds
          if (isFC2) {
            if (nextMatch.suffix === '初') {
              nextTotalSeconds = nextMatch.hours * 3600 + nextMatch.minutes * 60 + 0
            }
            else if (nextMatch.suffix === '末') {
              nextTotalSeconds = nextMatch.hours * 3600 + nextMatch.minutes * 60 + 40
            }
            else if (!nextMatch.suffix && !nextMatch.seconds) {
              nextTotalSeconds = nextMatch.hours * 3600 + nextMatch.minutes * 60 + 20
            }
          }
        }

        const nextPosition = (nextTotalSeconds / duration.value) * 100
        const startIndex = current.index + current.match.length
        const endIndex = nextMatch ? nextMatch.index : title.length
        const text = title.substring(startIndex, endIndex).replace(/^[，；。！？、\s]+/, '').replace(/[，；。！？、\s]+$/, '')

        markers.push({
          time: totalSeconds,
          position,
          label: current.match,
          text,
          width: nextPosition - position,
        })
      }
    }
  })

  timeMarkers.value = markers
}

/** 计算鼠标位置对应的进度 */
function calculatePosition(event: MouseEvent, element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const position = (event.clientX - rect.left) / rect.width
  return Math.min(Math.max(position, 0), 1)
}

/** 监听播放器状态变化 */
watch(
  [() => player.value?.canplay, () => duration.value, () => controls.visible.value],
  ([canplay, dur, visible]) => {
    if (canplay && dur > 0 && visible) {
      nextTick(() => parseTimeMarkers())
    }
  },
  { immediate: true },
)

/** 监听标题变化 */
const titleObserver = new MutationObserver(() => {
  if (player.value?.canplay && duration.value > 0 && controls.visible.value) {
    nextTick(() => parseTimeMarkers())
  }
})

titleObserver.observe(document.querySelector('title')!, {
  subtree: true,
  characterData: true,
  childList: true,
})

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
  titleObserver.disconnect()
})

// 暴露 timeMarkers 给上下文
if (progressBar) {
  progressBar.timeMarkers = timeMarkers
}
</script>
