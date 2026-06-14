const pages = [
  'pages/home/index',
  'pages/settings/index',
  'pages/login/index'
]

export default defineAppConfig({
  pages,
  tabBar: {
    list: [
      {
        pagePath: 'pages/home/index',
        text: '简报',
        iconPath: './assets/icons/home_unselected.png',
        selectedIconPath: './assets/icons/home_selected.png'
      },
      {
        pagePath: 'pages/settings/index',
        text: '设置',
        iconPath: './assets/icons/profile_unselected.png',
        selectedIconPath: './assets/icons/profile_selected.png'
      }
    ],
    color: '#666666',
    selectedColor: '#1A1A1A',
    backgroundColor: '#F7F7F5',
    borderStyle: 'white'
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F7F7F5',
    navigationBarTitleText: '公众号内容聚合助手',
    navigationBarTextStyle: 'black'
  }
})
