import type { PlayerContext } from './usePlayerProvide'
import { useLocalStorage } from '@vueuse/core'

/**
 * 播放设置
 */
export function usePlaySettings(ctx: PlayerContext) {
  /** 播放时保持进度条可见（当有时间标记时） */
  const keepProgressBarVisible = useLocalStorage('xplayer_keep_progressbar_visible', false)

  /** 切换自动播放 */
  const toggleAutoPlay = () => {
    ctx.rootPropsVm.autoPlay.value = !ctx.rootPropsVm.autoPlay.value
  }

  /** 切换保持进度条可见 */
  const toggleKeepProgressBarVisible = () => {
    keepProgressBarVisible.value = !keepProgressBarVisible.value
  }

  return {
    // 状态
    autoPlay: ctx.rootPropsVm.autoPlay,
    keepProgressBarVisible,
    // 方法
    toggleAutoPlay,
    toggleKeepProgressBarVisible,
  }
}
