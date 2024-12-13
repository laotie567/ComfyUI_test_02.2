Page({
  data: {
    userInfo: {},
    hasUserInfo: false
  },

  onLoad() {
    const app = getApp()
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
  }
}) 