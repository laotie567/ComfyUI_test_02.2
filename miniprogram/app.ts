// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 加载系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;

    // 加载保存的设置
    try {
      const settings = wx.getStorageSync('settings');
      if (settings) {
        this.globalData.settings = settings;
      } else {
        // 默认设置
        this.globalData.settings = {
          apiUrl: 'http://localhost:3000/api',
          apiKey: '',
          defaultSize: '512x512',
          defaultSteps: 30
        };
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }

    // 登录
    wx.login({
      success: res => {
        console.log('登录成功', res);
      },
    });
  },
})