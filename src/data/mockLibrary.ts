export interface Book {
  id: string
  title: string
  author: string
  spineColor: string
  spineDark: string
  readingProgress: number
  width: number
  height: number
  tilt: number
}

export interface Shelf {
  id: string
  label: string
  books: Book[]
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function makeBook(id: string, title: string, author: string, spine: string, dark: string, progress: number): Book {
  return {
    id,
    title,
    author,
    spineColor: spine,
    spineDark: dark,
    readingProgress: progress,
    width: rand(40, 70),
    height: rand(180, 260),
    tilt: (Math.random() - 0.5) * 12,
  }
}

export const library: Shelf[] = [
  {
    id: 's1',
    label: '玄幻经典',
    books: [
      makeBook('b01', '苍穹之上', '辰东', '#c0392b', '#8e2018', 0.72),
      makeBook('b02', '斗破苍穹', '天蚕土豆', '#8e44ad', '#5e2d7a', 1.0),
      makeBook('b03', '完美世界', '辰东', '#16a085', '#0e6e5c', 0.45),
      makeBook('b04', '遮天', '辰东', '#d35400', '#943a00', 0.88),
      makeBook('b05', '圣墟', '辰东', '#c0392b', '#7a2418', 0.33),
      makeBook('b06', '大主宰', '天蚕土豆', '#2980b9', '#1a5276', 0.60),
      makeBook('b07', '武动乾坤', '天蚕土豆', '#f39c12', '#b87308', 0.15),
      makeBook('b08', '元尊', '天蚕土豆', '#27ae60', '#1a7a42', 0.0),
    ],
  },
  {
    id: 's2',
    label: '仙侠奇缘',
    books: [
      makeBook('b09', '凡人修仙传', '忘语', '#27ae60', '#1a7a42', 0.95),
      makeBook('b10', '一念永恒', '耳根', '#e67e22', '#a85a18', 0.40),
      makeBook('b11', '仙逆', '耳根', '#34495e', '#1a2530', 0.78),
      makeBook('b12', '我欲封天', '耳根', '#9b59b6', '#6c3a80', 0.55),
      makeBook('b13', '道君', '跃千愁', '#16a085', '#0e6e5c', 0.20),
      makeBook('b14', '万古神帝', '飞天鱼', '#e74c3c', '#a02c1e', 0.67),
      makeBook('b15', '伏天氏', '净无痕', '#9b59b6', '#6c3a80', 0.82),
    ],
  },
  {
    id: 's3',
    label: '诡秘悬疑',
    books: [
      makeBook('b16', '诡秘之主', '爱潜水的乌贼', '#2c3e50', '#1a252e', 1.0),
      makeBook('b17', '超神机械师', '齐佩甲', '#2c3e50', '#1a252e', 0.60),
      makeBook('b18', '牧神记', '宅猪', '#1abc9c', '#117a65', 0.35),
      makeBook('b19', '天道图书馆', '横扫天涯', '#8e44ad', '#5e2d7a', 0.50),
      makeBook('b20', '全职法师', '乱', '#d35400', '#943a00', 0.90),
      makeBook('b21', '万族之劫', '老鹰吃小鸡', '#3498db', '#1f6fa5', 0.25),
      makeBook('b22', '夜的命名术', '会说话的肘子', '#2980b9', '#1a5276', 0.10),
    ],
  },
  {
    id: 's4',
    label: '江湖武侠',
    books: [
      makeBook('b23', '剑来', '烽火戏诸侯', '#2980b9', '#1a5276', 0.85),
      makeBook('b24', '雪中悍刀行', '烽火戏诸侯', '#bdc3c7', '#808a90', 1.0),
      makeBook('b25', '大奉打更人', '卖报小郎君', '#c0392b', '#8e2018', 0.70),
      makeBook('b26', '我师兄实在太稳健了', '言归正传', '#2ecc71', '#1ea85a', 0.45),
      makeBook('b27', '一世之尊', '爱潜水的乌贼', '#34495e', '#1a2530', 0.30),
      makeBook('b28', '大道朝天', '猫腻', '#e67e22', '#a85a18', 0.55),
      makeBook('b29', '择天记', '猫腻', '#1abc9c', '#117a65', 0.80),
      makeBook('b30', '庆余年', '猫腻', '#f39c12', '#b87308', 1.0),
    ],
  },
  {
    id: 's5',
    label: '科幻未来',
    books: [
      makeBook('b31', '深空彼岸', '辰东', '#2c3e50', '#1a252e', 0.18),
      makeBook('b32', '不朽', '净无痕', '#8e44ad', '#5e2d7a', 0.42),
      makeBook('b33', '星域四万年', '卧牛真人', '#2980b9', '#1a5276', 0.65),
      makeBook('b34', '吞噬星空', '我吃西红柿', '#e74c3c', '#a02c1e', 1.0),
      makeBook('b35', '修真聊天群', '圣骑士的传说', '#27ae60', '#1a7a42', 0.50),
      makeBook('b36', '飞剑问道', '我吃西红柿', '#d35400', '#943a00', 0.75),
      makeBook('b37', '星辰变', '我吃西红柿', '#f39c12', '#b87308', 1.0),
    ],
  },
]
