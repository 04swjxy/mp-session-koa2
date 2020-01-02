//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    isLogin: false,
    testData: '',
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  // 登录
  login(){
    const that = this;
    app.$qcloud.login({
      success(res){
        console.log(res);
        that.setData({ isLogin: true });
      },
      fail(err){
        console.error(err);
      },
    })
  },
  // 获取服务器数据
  getSomeData(){
    const that = this;
    app.$qcloud.request({
      url: app.config.apiUrl + '/testData',
      success(res){
        if (res.statusCode >= 400) {
          wx.showModal({
            title: '发生错误',
            content: `statusCode:${res.statusCode}`,
            showCancel: false,
            confirmColor: '#f44',
          })
          return;
        };
        const { error, testData } = res.data;
        if (error) {
          wx.showModal({
            title: '失败',
            content: error,
            showCancel: false,
            confirmColor: '#f44',
          })
          return;
        }
        wx.showToast({
          title: '成功',
          duration: 800,
        })
        that.setData({ testData });
      },
      fail(err){
        wx.showModal({
          title: '发生错误',
          content: err,
          showCancel: false,
          confirmColor: '#f44',
        })
      },
    })
  },
})
