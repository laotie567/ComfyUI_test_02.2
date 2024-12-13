// pages/settings/settings.js
const app = getApp()

Page({
  data: {
    apiUrl: '',
    apiKey: '',
    defaultSizeIndex: 0,
    defaultSteps: 30,
    sizeOptions: ['512x512', '768x768', '1024x1024'],
  },

  onLoad() {
    this.loadSettings()
  },

  // 加载设置
  loadSettings() {
    const settings = wx.getStorageSync('settings') || {}
    this.setData({
      apiUrl: settings.apiUrl || '',
      apiKey: settings.apiKey || '',
      defaultSizeIndex: settings.defaultSizeIndex || 0,
      defaultSteps: settings.defaultSteps || 30,
    })
  },

  // API地址输入
  onApiUrlInput(e) {
    this.setData({
      apiUrl: e.detail.value
    })
  },

  // API密钥输入
  onApiKeyInput(e) {
    this.setData({
      apiKey: e.detail.value
    })
  },

  // 默认尺寸选择
  onDefaultSizeChange(e) {
    this.setData({
      defaultSizeIndex: parseInt(e.detail.value)
    })
  },

  // 默认步数调整
  onDefaultStepsChange(e) {
    this.setData({
      defaultSteps: e.detail.value
    })
  },

  // 清理缓存
  async clearCache() {
    try {
      await wx.showLoading({
        title: '清理中...',
      })

      // 清理本地存储的临时文件
      const res = await wx.getSavedFileList()
      for (const file of res.fileList) {
        await wx.removeSavedFile({
          filePath: file.filePath
        })
      }

      // 清理本地数据缓存
      await wx.clearStorage()

      // 重新加载默认设置
      this.loadSettings()

      wx.hideLoading()
      wx.showToast({
        title: '清理成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('清理缓存失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: '清理失败',
        icon: 'error'
      })
    }
  },

  // 保存设置
  saveSettings() {
    const settings = {
      apiUrl: this.data.apiUrl,
      apiKey: this.data.apiKey,
      defaultSizeIndex: this.data.defaultSizeIndex,
      defaultSteps: this.data.defaultSteps,
    }

    wx.setStorageSync('settings', settings)
    
    wx.showToast({
      title: '保存成功',
      icon: 'success',
      duration: 2000
    })
  }
})
