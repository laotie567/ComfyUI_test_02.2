interface PageData {
  apiUrl: string;
  apiKey: string;
  sizeOptions: string[];
  defaultSizeIndex: number;
  defaultSteps: number;
}

Page<PageData>({
  data: {
    apiUrl: '',
    apiKey: '',
    sizeOptions: ['512x512', '768x768', '1024x1024'],
    defaultSizeIndex: 0,
    defaultSteps: 30
  },

  onLoad() {
    // 加载保存的设置
    const app = getApp<IAppOption>();
    const settings = app.globalData.settings || {};

    this.setData({
      apiUrl: settings.apiUrl || '',
      apiKey: settings.apiKey || '',
      defaultSteps: settings.defaultSteps || 30,
      defaultSizeIndex: this.data.sizeOptions.indexOf(settings.defaultSize || '512x512')
    });
  },

  onApiUrlInput(e: any) {
    this.setData({
      apiUrl: e.detail.value
    });
  },

  onApiKeyInput(e: any) {
    this.setData({
      apiKey: e.detail.value
    });
  },

  onDefaultSizeChange(e: any) {
    this.setData({
      defaultSizeIndex: e.detail.value
    });
  },

  onDefaultStepsChange(e: any) {
    this.setData({
      defaultSteps: e.detail.value
    });
  },

  async clearCache() {
    try {
      wx.showLoading({ title: '清理中...' });
      
      // 清理本地缓存
      await wx.clearStorage();
      
      // 重新加载默认设置
      this.setData({
        defaultSizeIndex: 0,
        defaultSteps: 30
      });

      wx.showToast({
        title: '清理成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('清理失败:', error);
      wx.showToast({
        title: '清理失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  saveSettings() {
    const settings: AppSettings = {
      apiUrl: this.data.apiUrl,
      apiKey: this.data.apiKey,
      defaultSize: this.data.sizeOptions[this.data.defaultSizeIndex],
      defaultSteps: this.data.defaultSteps
    };

    try {
      // 保存到本地存储
      wx.setStorageSync('settings', settings);

      // 更新全局设置
      const app = getApp<IAppOption>();
      app.globalData.settings = settings;

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  }
});
