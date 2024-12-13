// index.ts
// 获取应用实例
import { apiService } from '../../services/api'

interface PageData {
  prompt: string
  negativePrompt: string
  imageSize: string
  steps: number
  generatingImage: boolean
  previewImage: string
  saveLoading: boolean
}

Page<PageData>({
  data: {
    prompt: '',
    negativePrompt: '',
    imageSize: '512x512',
    steps: 20,
    generatingImage: false,
    previewImage: '',
    saveLoading: false
  },

  onLoad() {
    // 从缓存加载最近使用的参数
    this.loadRecentParams()
  },

  // 加载最近使用的参数
  async loadRecentParams() {
    try {
      const recentParams = await wx.getStorage({ key: 'recent_params' })
      if (recentParams.data) {
        const { prompt, negativePrompt, imageSize, steps } = recentParams.data
        this.setData({
          prompt: prompt || '',
          negativePrompt: negativePrompt || '',
          imageSize: imageSize || '512x512',
          steps: steps || 20
        })
      }
    } catch (error) {
      // 无缓存数据，使用默认值
    }
  },

  // 保存最近使用的参数
  async saveRecentParams() {
    const { prompt, negativePrompt, imageSize, steps } = this.data
    await wx.setStorage({
      key: 'recent_params',
      data: { prompt, negativePrompt, imageSize, steps }
    })
  },

  // 输入提示词
  onPromptInput(e: any) {
    this.setData({ prompt: e.detail.value })
  },

  // 输入反向提示词
  onNegativePromptInput(e: any) {
    this.setData({ negativePrompt: e.detail.value })
  },

  // 选择图片尺寸
  onSizeChange(e: any) {
    this.setData({ imageSize: e.detail.value })
  },

  // 调整步数
  onStepsChange(e: any) {
    this.setData({ steps: parseInt(e.detail.value) })
  },

  // 生成图片
  async onGenerate() {
    if (!this.data.prompt) {
      wx.showToast({
        title: '请输入提示词',
        icon: 'none'
      })
      return
    }

    if (this.data.generatingImage) {
      return
    }

    try {
      this.setData({ generatingImage: true })
      wx.showLoading({ title: '生成中...' })

      // 保存最近使用的参数
      await this.saveRecentParams()

      const [width, height] = this.data.imageSize.split('x').map(Number)
      const response = await apiService.generateImage({
        prompt: this.data.prompt,
        negativePrompt: this.data.negativePrompt,
        width,
        height,
        steps: this.data.steps
      })

      if (response.code === 0 && response.data) {
        this.setData({ previewImage: response.data.url })
        wx.showToast({
          title: '生成成功',
          icon: 'success'
        })
      } else {
        throw new Error(response.message || '生成失败')
      }
    } catch (error) {
      wx.showToast({
        title: error.message || '生成失败',
        icon: 'error'
      })
    } finally {
      this.setData({ generatingImage: false })
      wx.hideLoading()
    }
  },

  // 保存到画廊
  async onSaveToGallery() {
    if (!this.data.previewImage || this.data.saveLoading) {
      return
    }

    try {
      this.setData({ saveLoading: true })
      wx.showLoading({ title: '保存中...' })

      const [width, height] = this.data.imageSize.split('x').map(Number)
      const response = await apiService.saveToGallery({
        url: this.data.previewImage,
        prompt: this.data.prompt,
        negativePrompt: this.data.negativePrompt,
        params: {
          width,
          height,
          steps: this.data.steps
        }
      })

      if (response.code === 0) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        // 清空预览图
        this.setData({ previewImage: '' })
      } else {
        throw new Error(response.message || '保存失败')
      }
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'error'
      })
    } finally {
      this.setData({ saveLoading: false })
      wx.hideLoading()
    }
  },

  // 预览图片
  onPreviewImage() {
    if (!this.data.previewImage) {
      return
    }

    wx.previewImage({
      urls: [this.data.previewImage],
      current: this.data.previewImage
    })
  }
})
