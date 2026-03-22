// ✰ webmeji 桌宠配置 ✰
// 基于 webmeji 开源项目改造
// 所有图片路径使用站点根目录绝对路径，确保在任何子页面中都能正确加载

// NOTE: 自动探测 assets 目录的基础路径
// 通过当前脚本的 src 向上推导，确保在 file:// 协议和服务器环境下都能正确工作
const scriptSrc = document.currentScript ? document.currentScript.src : '';
const assetsPath = scriptSrc ? scriptSrc.substring(0, scriptSrc.indexOf('/js/webmeji-config.js')) : '/assets';

const WEBMEJI_BASE_PATH = `${assetsPath}/webmeji/shimeji`;

/**
 * 辅助函数：生成精灵图完整路径
 * @param name 精灵图文件名（不含路径）
 * @returns 完整的绝对路径
 */
function shimePath(name) {
  return `${WEBMEJI_BASE_PATH}/${name}`;
}

const MIKU_BASE_PATH = `${assetsPath}/webmeji/miku`;
function mikuPath(name) {
  return `${MIKU_BASE_PATH}/${name}`;
}

// 生成配置 - 每个页面只生成 1 个桌宠实例
window.SPAWNING = [
  { id: 'webmeji-0', config: 'SHIMEJI_CONFIG' },
  { id: 'webmeji-1', config: 'MIKU_CONFIG' }
];

// shimeji 角色配置
window.SHIMEJI_CONFIG = {
  // pet   = 悬停动画（移动端不可用，但保留兼容）
  // drag  = 点击或触摸拖拽
  // top / left / right = 允许跳跃到对应边缘
  // bottom 必须始终开启
  ALLOWANCES: ['pet', 'drag', 'bottom', 'top', 'left', 'right'],

  // 移动和物理参数（像素/秒）
  walkspeed: 50,
  fallspeed: 200,
  jumpspeed: 150,

  // 摔倒后站起来的等待时间（毫秒）
  gettingupspeed: 2000,

  // 底部行走/站立/坐下等常用动画
  walk: {
    frames: [shimePath('shime1.png'), shimePath('shime2.png'), shimePath('shime3.png'), shimePath('shime2.png')],
    interval: 175, loops: 6
  },

  stand: {
    frames: [shimePath('shime1.png')],
    interval: 200, loops: 1
  },

  sit: {
    frames: [shimePath('shime11.png')],
    interval: 1000, loops: 1,
    randomizeDuration: true, min: 3000, max: 11000
  },

  spin: {
    frames: [shimePath('shime1.png')],
    interval: 150, loops: 3
  },

  dance: {
    frames: [shimePath('shime5.png'), shimePath('shime6.png'), shimePath('shime1.png')],
    interval: 200, loops: 5
  },

  trip: {
    frames: [shimePath('shime20.png'), shimePath('shime21.png'), shimePath('shime21.png'), shimePath('shime20.png'), shimePath('shime21.png'), shimePath('shime21.png')],
    interval: 250, loops: 1
  },

  // 行为流控制 - 防止尴尬的动画过渡
  forcewalk: {
    loops: 6
  },

  forcethink: {
    frames: [shimePath('shime27.png'), shimePath('shime28.png')],
    interval: 500, loops: 2
  },

  // 用户交互动画
  pet: {
    frames: [shimePath('shime15.png'), shimePath('shime16.png'), shimePath('shime17.png')],
    interval: 75
  },

  drag: {
    frames: [shimePath('shime5.png'), shimePath('shime7.png'), shimePath('shime5.png'), shimePath('shime6.png'), shimePath('shime8.png'), shimePath('shime6.png')],
    interval: 210
  },

  // 坠落和恢复动画
  falling: {
    frames: [shimePath('shime4.png')],
    interval: 200, loops: 2
  },

  fallen: {
    frames: [shimePath('shime19.png'), shimePath('shime18.png')],
    interval: 250, loops: 1
  },

  // 动作频率和决策逻辑 - 出现次数越多越容易被选中
  ORIGINAL_ACTIONS: [
    'walk', 'walk', 'walk', 'walk', 'walk', 'walk',
    'walk', 'walk', 'walk', 'walk', 'walk', 'walk',
    'spin', 'spin', 'spin',
    'sit', 'sit',
    'dance', 'dance',
    'trip'
  ],

  EDGE_ACTIONS: [
    'hang', 'hang',
    'climb', 'climb', 'climb', 'climb',
    'fall', 'fall'
  ],

  // 底部时跳跃到边缘的概率（0-1）
  JUMP_CHANCE: 0.05,

  // 边缘相关动画
  climbSide: {
    frames: [shimePath('shime13.png'), shimePath('shime14.png')],
    interval: 200, loops: 2
  },

  hangstillSide: {
    frames: [shimePath('shime12.png')],
    interval: 200, loops: 2,
    randomizeDuration: true, min: 3000, max: 11000
  },

  climbTop: {
    frames: [shimePath('shime24.png'), shimePath('shime25.png')],
    interval: 200, loops: 6
  },

  hangstillTop: {
    frames: [shimePath('shime23.png')],
    interval: 200, loops: 2,
    randomizeDuration: true, min: 3000, max: 11000
  },

  jump: {
    frames: [shimePath('shime22.png')],
    interval: 200
  }
};

// miku 角色配置
window.MIKU_CONFIG = {
  ALLOWANCES: ['pet', 'drag', 'bottom', 'top', 'left', 'right'],

  walkspeed: 50,
  fallspeed: 150,
  jumpspeed: 200,
  gettingupspeed: 3500,

  walk: {
    frames: [mikuPath('shime1.png'), mikuPath('shime2.png'), mikuPath('shime3.png'), mikuPath('shime2.png')], 
    interval: 175, loops: 6
  },
  stand: {
    frames: [mikuPath('shime1.png')], 
    interval: 1000, loops: 1
  },
  sit: {
    frames: [mikuPath('shime11.png')], 
    interval: 1000, loops: 1,
    randomizeDuration: true, min: 3000, max: 11000
  },
  spin: {
    frames: [mikuPath('shime1.png')], 
    interval: 150, loops: 3
  },
  dance: {
    frames: [mikuPath('shime5.png'), mikuPath('shime6.png'), mikuPath('shime1.png')], 
    interval: 200, loops: 2
  },
  trip: {
    frames: [mikuPath('shime18.png'), mikuPath('shime19.png'), mikuPath('shime19.png')], 
    interval: 250, loops: 1
  },

  forcewalk: {
    loops: 6
  },
  forcethink: {
    frames: [mikuPath('shime27.png'), mikuPath('shime28.png')], 
    interval: 500, loops: 2
  },

  pet: {
    frames: [mikuPath('shime15.png'), mikuPath('shime16.png'), mikuPath('shime17.png')], 
    interval: 400
  },
  drag: {
    frames: [mikuPath('shime7.png'), mikuPath('shime5.png'), mikuPath('shime8.png'), mikuPath('shime6.png')], 
    interval: 210
  },

  falling: {
    frames: [mikuPath('shime10.png'), mikuPath('shime18.png')], 
    interval: 200, loops: 2
  },
  fallen: {
    frames: [mikuPath('shime9.png'), mikuPath('shime4.png'), mikuPath('shime19.png')], 
    interval: 250, loops: 1
  },

  ORIGINAL_ACTIONS: [
    'walk','walk','walk','walk','walk','walk',
    'spin','spin','spin',
    'sit','sit',
    'dance','dance','dance','dance','dance',
    'trip'
  ],
  EDGE_ACTIONS: [
    'hang','hang',
    'climb','climb','climb','climb','climb',
    'fall'
  ],
  JUMP_CHANCE: 0.1,

  climbSide: {
    frames: [mikuPath('shime13.png'), mikuPath('shime14.png')], 
    interval: 200, loops: 2
  },
  hangstillSide: {
    frames: [mikuPath('shime12.png')], 
    interval: 200, loops: 2,
    randomizeDuration: true, min: 3000, max: 11000
  },
  climbTop: {
    frames: [mikuPath('shime24.png'), mikuPath('shime25.png')], 
    interval: 200, loops: 8
  },
  hangstillTop: {
    frames: [mikuPath('shime23.png')], 
    interval: 200, loops: 2,
    randomizeDuration: true, min: 3000, max: 11000
  },
  jump: {
    frames: [mikuPath('shime22.png')], 
    interval: 200
  }
};
