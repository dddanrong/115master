import type { PlayerContext } from './usePlayerProvide'  
import { shallowRef, watch, type Ref } from 'vue'  
  
// 添加时间标记类型定义  
interface TimeMarker {  
  time: number  
  position: number  
  label: string  
  text: string  
  width: number  
}  
  
/**  
 * 进度条  
 */  
export function useProgressBar(_ctx: PlayerContext) {  
  /** 拖拽 */  
  const isDragging = shallowRef(false)  
  /** 长按拖拽 */  
  const isLongPressDragging = shallowRef(false)  
  /** 时间标记数据 */  
  const timeMarkers = shallowRef<TimeMarker[]>([])  

  /** 长按计时器 */
  let longPressTimer: ReturnType<typeof setTimeout> | null = null
  /** 长按阈值 */
  const LONG_PRESS_THRESHOLD = 300

  // 监听拖拽状态变化
  watch(isDragging, (newValue, oldValue) => {
    if (newValue && !oldValue) {
      // 开始拖拽时启动长按计时器
      longPressTimer = setTimeout(() => {
        isLongPressDragging.value = true
      }, LONG_PRESS_THRESHOLD)
    }
    else if (!newValue && oldValue) {
      // 结束拖拽时清除计时器和长按状态
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
      isLongPressDragging.value = false
    }
  })

  /** 等待拖拽结束 */
  const waitDragEnd = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const unwatch = watch(isDragging, (value) => {
        if (!value) {
          resolve(true)
          unwatch()
        }
      })
    })
  }

  return {
    isDragging,
    isLongPressDragging,
    waitDragEnd,  
    timeMarkers, // 添加这一行  
  }
}
