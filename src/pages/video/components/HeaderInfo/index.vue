<template>  
  <div v-if="fileInfo.error" :class="styles.container.error">  
    <div>❌ 获取文件信息失败</div>  
    <div>{{ fileInfo.error }}</div>  
  </div>  
  <div v-else-if="fileInfo.isLoading || (!fileInfo.isLoading && !fileInfo.isReady)" :class="styles.container.loading">  
    <div class="skeleton w-80 h-7 rounded-lg" />  
  </div>  
  <div v-else :class="styles.container.main">  
    <div :class="styles.fileInfo.container">  
      <div :class="styles.fileInfo.file">  

<!-- 文件名 - 可编辑版本 -->  
<textarea  
  v-if="isEditing"  
  v-model="editingName"  
  :class="[  
    'font-bold text-base-content text-xl text-shadow-xs/60',  
    'bg-transparent border-b border-white/50 outline-none',  
    'w-full resize-none'  
  ]"  
  style="  
    white-space: normal;   
    overflow: visible;   
    min-height: 1.5em;  
    max-height: 6em;  
    line-height: 1.5;  
  "  
  @blur="handleSave"   
  @keyup.escape="cancelEdit"  
  @keydown="handleKeyDown"  
  @input="autoResize"  
  ref="nameInput"  
  rows="1"  
/>

        <span  
          v-else  
          :class="[styles.fileInfo.name, 'cursor-pointer']"  
          @dblclick="startEdit"  
        >  
          {{ fileInfo.state?.file_name?.toUpperCase() }}  
        </span>  
          
        <!-- 文件大小 -->  
        <span :class="styles.fileInfo.size">  
          {{ formatFileSize(Number(fileInfo.state?.file_size)) }}  
        </span>  
      </div>  
  
      <!-- 目录 -->  
      <div :class="styles.fileInfo.path.container">  
        <ul>  
          <li v-for="item in path" :key="item.cid" @click="handleOpenFolder(item.cid)">  
            <a>  
              {{ item.name }}  
            </a>  
          </li>  
        </ul>  
      </div>  
    </div>  
  </div>  
</template>  
  
<script setup lang="ts">  
import type { useDataFileInfo } from '../../data/useDataFileInfo'  
import type { useDataPlaylist } from '../../data/useDataPlaylist'  
import { computed, ref, nextTick } from 'vue'  
import { formatFileSize } from '../../../../utils/format'  

// 处理编辑模式下的按键事件  
const handleKeyDown = (event: KeyboardEvent) => {  
  // 阻止所有按键事件冒泡到播放器  
  event.stopPropagation()  
    
  // 特别处理回车键：阻止换行，直接确认保存  
  if (event.key === 'Enter') {  
    event.preventDefault()  
    handleSave()  
  }  
}

// 自动调整 textarea 高度  
const autoResize = () => {  
  const textarea = nameInput.value  
  if (textarea) {  
    textarea.style.height = 'auto'  
    textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px' // 最大6行  
  }  
}  
  
// 修改 startEdit 函数  
const startEdit = () => {  
    
  if (!props.fileInfo.state?.file_id) {  
    return  
  }  
    
  isEditing.value = true   
    
  const fullFileName = props.fileInfo.state?.file_name || ''  
  // 分离文件名和扩展名  
  const lastDotIndex = fullFileName.lastIndexOf('.')  
  const nameWithoutExtension = lastDotIndex > 0 ? fullFileName.substring(0, lastDotIndex) : fullFileName  
    
  editingName.value = nameWithoutExtension  
    
  nextTick(() => {    
    nameInput.value?.focus()    
    nameInput.value?.select()    
    autoResize() // 初始化时调整高度    
  })    
}

// 保存文件名  
const handleSave = async () => {    
  const trimmedName = editingName.value.trim()    
    
  if (!props.fileInfo.state?.file_id || !trimmedName) {    
    cancelEdit()    
    return    
  }  
    
  // 获取原始扩展名  
  const originalFileName = props.fileInfo.state?.file_name || ''  
  const lastDotIndex = originalFileName.lastIndexOf('.')  
  const extension = lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : ''  
    
  // 组合新的完整文件名  
  const newFullFileName = trimmedName + extension  
    
  if (newFullFileName === originalFileName) {    
    cancelEdit()    
    return    
  }  
    
  try {    
    const params = new URLSearchParams()    
    params.append(`files_new_name[${props.fileInfo.state.file_id}]`, newFullFileName)  
      
    const response = await fetch('https://webapi.115.com/files/batch_rename', {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/x-www-form-urlencoded',  
      },  
      body: params.toString(),  
      credentials: 'include'  
    })  
      
    if (response.ok) {  
      const result = await response.json()  
        
      if (result.state === true && result.errno === 0) {  
        const fileId = props.fileInfo.state.file_id  
        const newFileName = result.data[fileId]  
          
        if (newFileName && props.fileInfo.state) {  
          props.fileInfo.state.file_name = newFileName  
        }  
      }  
    }  
  } catch (error) {  
    console.error('重命名失败:', error)  
  }  
    
  cancelEdit()  
}  

const props = defineProps<{  
  /** 文件信息 */  
  fileInfo: ReturnType<typeof useDataFileInfo>  
  /** 播放列表 */  
  playlist: ReturnType<typeof useDataPlaylist>  
}>()  
  
// 编辑状态  
const isEditing = ref(false)  
const editingName = ref('')  
const nameInput = ref<HTMLInputElement>()  
  
// 取消编辑  
const cancelEdit = () => {  
  isEditing.value = false  
  editingName.value = ''  
}  
  

  
const styles = {  
  /** 容器样式 */  
  container: {  
    main: 'flex items-center gap-4 w-full mx-2',  
    error: 'text-red-400',  
    loading: 'flex items-center',  
  },  
  /** 文件信息样式 */  
  fileInfo: {  
    container: 'flex flex-col flex-1',  
    file: 'flex flex-wrap items-center gap-2',  
    name: 'font-bold text-base-content text-xl text-shadow-xs/60 line-clamp-2',  
    size: 'text-base-content/70 font-semibold text-shadow-xs/60 whitespace-nowrap flex-shrink-0',  
    path: {  
      container: ['breadcrumbs text-sm text-base-content/80'],  
    },  
    folder: {  
      btn: 'btn btn-sm btn-ghost btn-circle tooltip tooltip-bottom',  
      icon: 'size-4',  
    },  
  },  
}  
  
const path = computed(() => {  
  return (props.playlist.state?.path ?? []).filter(  
    item => Number(item.cid) !== 0,  
  )  
})  
  
function handleOpenFolder(id: string) {  
  window.open(`https://115.com/?cid=${id}&offset=0&mode=wangpan`, '_blank')  
}  

// 暴露方法给父组件  
defineExpose({  
  startEdit  
})
</script>