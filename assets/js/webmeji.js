// ✰ webmeji 桌宠主逻辑 ✰
// 基于 webmeji 开源项目 (by Lars de Rooij) 改造
// 主要改动：移动端触摸事件适配、响应式尺寸、pointer-events 防误触
// 原始项目: https://github.com/lars-rooij/webmeji

window.addEventListener('DOMContentLoaded', () => {
  try {
    // NOTE: 判空保护，防止配置未加载时崩溃影响后续脚本
    if (!window.SPAWNING || !Array.isArray(window.SPAWNING)) {
      console.warn('webmeji: SPAWNING 配置未找到，跳过桌宠初始化');
      return;
    }

    if (!document.body) {
      console.warn('webmeji: document.body 不可用，跳过桌宠初始化');
      return;
    }

    // 从 SPAWNING 配置中收集唯一的配置名称
    const configNames = [...new Set(
      window.SPAWNING.map(spawn => spawn.config)
    )];

    // 解析为实际的配置对象
    const configs = configNames
      .map(name => window[name])
      .filter(Boolean);

    if (configs.length === 0) {
      console.warn('webmeji: 未找到有效的精灵配置');
      return;
    }

    // 预加载所有精灵图后再创建桌宠
    Promise.all(configs.map(preloadImages))
      .then(() => {
        console.log('webmeji: 所有精灵图加载完成');

        const creatures = [];
        window.SPAWNING.forEach(({ id, config }) => {
          const cfg = window[config];
          if (!cfg) {
            console.warn(`webmeji: 配置未找到 - ${config}`);
            return;
          }
          creatures.push(new Creature(id, cfg));
        });
      })
      .catch(error => {
        console.error('webmeji: 精灵图加载失败', error);
      });
  } catch (error) {
    console.error('webmeji: 初始化失败', error);
  }
});

/**
 * 预加载配置中的所有帧图片
 * @param config 精灵图配置对象
 * @returns Promise，所有图片加载完成后 resolve
 */
function preloadImages(config) {
  const imagePaths = Object.values(config)
    .flatMap(item => (item.frames && Array.isArray(item.frames)) ? item.frames : []);

  return Promise.all(imagePaths.map(src => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  })));
}

// NOTE: Creature 类 - 每个桌宠实例的核心逻辑
class Creature {
  constructor(containerId, spriteConfig) {
    this.currentEdge = 'bottom';

    // 创建容器 div
    this.container = document.createElement('div');
    this.container.className = 'webmeji-container';
    // NOTE: 判空保护，防止 document.body 不可用时崩溃
    if (!document.body) {
      console.error('webmeji: Creature 初始化失败 - document.body 不可用');
      return;
    }
    document.body.appendChild(this.container);

    // 创建精灵图 img 元素
    this.img = document.createElement('img');
    this.img.id = containerId;
    this.img.src = spriteConfig.walk.frames[0];
    // NOTE: 禁止图片拖拽（浏览器默认行为），避免和桌宠拖拽冲突
    this.img.draggable = false;
    this.container.appendChild(this.img);

    // 存储精灵配置 & 随机化动作序列
    this.spriteConfig = spriteConfig;
    this.actionSequence = this.shuffle([...this.spriteConfig.ORIGINAL_ACTIONS]);
    this.currentActionIndex = 0;
    this.currentAction = null;
    this.frameTimer = null;
    this.dragFrameTimer = null;
    this.actionCompletionTimer = null;
    this.currentFrame = 0;
    this.direction = 1;  // 1 = 右, -1 = 左
    this.facing = 'left';

    // 状态标志
    this.isDragging = false;
    this.isFalling = false;
    this.isPetting = false;
    this.isJumping = false;
    this.tripAfterFallActive = false;
    this.wasActionBeforePet = null;

    // 指针按下状态检测（鼠标 + 触摸）
    this.isPointerDown = false;
    window.addEventListener('mousedown', () => { this.isPointerDown = true; });
    window.addEventListener('mouseup', () => { this.isPointerDown = false; });
    window.addEventListener('touchstart', () => { this.isPointerDown = true; }, { passive: true });
    window.addEventListener('touchend', () => { this.isPointerDown = false; });

    // 获取容器计算尺寸
    const containerStyle = window.getComputedStyle(this.container);
    this.containerWidth = parseFloat(containerStyle.width);
    this.containerHeight = parseFloat(containerStyle.height);

    // 在底部随机位置生成
    this.positionX = Math.random() * (window.innerWidth - this.containerWidth);
    this.positionY = window.innerHeight - this.containerHeight;

    this.container.style.left = `${this.positionX}px`;
    this.container.style.top = `${this.positionY}px`;

    this.maxPos = window.innerWidth - this.containerWidth;
    this.forceWalkAfter = false;
    this.forceThinkAfter = false;

    this.container.style.left = `${this.positionX}px`;
    this.container.style.top = 'auto';
    this.baseBottom = 0;

    this.updateImageDirection();

    // 启动第一个动作
    this.currentAction = this.actionSequence[this.currentActionIndex];
    this.startAction(this.currentAction);

    this.animate = this.animate.bind(this);
    this.animationFrameId = requestAnimationFrame(this.animate);

    // 窗口大小变化时重新计算边界
    this.resizeHandler = () => {
      const style = window.getComputedStyle(this.container);
      this.containerWidth = parseFloat(style.width);
      this.containerHeight = parseFloat(style.height);
      this.maxPos = window.innerWidth - this.containerWidth;
      this.positionX = Math.min(this.positionX, this.maxPos);
      this.container.style.left = `${this.positionX}px`;
    };
    window.addEventListener('resize', this.resizeHandler);

    // 绑定交互事件
    this.enablePetInteraction();
    this.enableDragInteraction();
  }

  /** 随机打乱数组 */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /** 根据朝向翻转精灵图 */
  updateImageDirection() {
    this.img.style.transform = this.facing === 'left' ? 'scaleX(1)' : 'scaleX(-1)';
  }

  /** 根据水平位移更新朝向 */
  setFacingFromDelta(dx) {
    if (dx && !this.isDragging) {
      this.facing = dx < 0 ? 'left' : 'right';
      this.updateImageDirection();
    }
  }

  /** 重置当前动画计时器 */
  resetAnimation() {
    clearInterval(this.frameTimer);
    clearTimeout(this.actionCompletionTimer);
    this.currentFrame = 0;
    this.frameTimer = null;
    this.actionCompletionTimer = null;
  }

  /** 取消所有计时器和动画帧 */
  clearAllTimers() {
    this.resetAnimation();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  isSideEdge(edge) { return edge === 'left' || edge === 'right'; }
  isNonBottomEdge(edge) { return edge !== 'bottom'; }

  /** 更新容器的边缘 CSS 类名 */
  updateEdgeClass() {
    this.container.classList.remove('edge-left', 'edge-right', 'edge-top');
    if (!this.isDragging) {
      this.currentEdge === 'left' && this.container.classList.add('edge-left');
      this.currentEdge === 'right' && this.container.classList.add('edge-right');
      this.currentEdge === 'top' && this.container.classList.add('edge-top');
    }
    this.applyEdgeOffset();
  }

  /** 根据边缘位置应用偏移量（精灵图对齐） */
  applyEdgeOffset() {
    if (this.isDragging) {
      return this.container.style.cssText = `left:${this.positionX}px;top:${this.positionY}px`;
    }

    const offsetX = this.currentEdge === 'left' ? -this.containerWidth / 2 :
      this.currentEdge === 'right' ? this.containerHeight / 2 : 0;
    const offsetY = this.currentEdge === 'top' ? -this.containerHeight / 2 : 0;

    this.container.style.left = `${(this.positionX || 0) + offsetX}px`;
    this.container.style.top = `${(this.positionY || 0) + offsetY}px`;
  }

  /** 跳跃到指定边缘（top/left/right） */
  jumpToEdge(targetEdge) {
    if (this.isFalling || this.isPetting || this.isDragging || this.isJumping) return;
    if (!this.spriteConfig.ALLOWANCES.includes(targetEdge)) return;

    this.isJumping = true;
    this.resetAnimation();

    const jumpConfig = this.spriteConfig.jump;
    if (!jumpConfig) { this.isJumping = false; return; }

    const startX = this.positionX;
    const startY = this.positionY;
    let endX = startX;
    let endY = startY;

    switch (targetEdge) {
      case 'top':
        endY = 0;
        endX = Math.random() * (window.innerWidth - this.containerWidth);
        break;
      case 'left':
        endX = 0;
        endY = Math.random() * (window.innerHeight - this.containerHeight);
        break;
      case 'right':
        endX = window.innerWidth - this.containerWidth;
        endY = Math.random() * (window.innerHeight - this.containerHeight);
        break;
    }

    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) { this.isJumping = false; return; }

    const duration = distance / this.spriteConfig.jumpspeed;
    const startTime = performance.now();

    let frameIndex = 0;
    const totalFrames = jumpConfig.frames.length;
    this.img.src = jumpConfig.frames[frameIndex];

    const frameTimer = setInterval(() => {
      frameIndex = (frameIndex + 1) % totalFrames;
      this.img.src = jumpConfig.frames[frameIndex];
    }, jumpConfig.interval);

    const step = (time) => {
      if (this.isDragging) {
        clearInterval(frameTimer);
        this.isJumping = false;
        return;
      }

      const elapsed = (time - startTime) / 1000;
      const t = Math.min(elapsed / duration, 1);

      this.positionX = startX + dx * t;
      this.positionY = startY + dy * t;

      if (dx !== 0) this.setFacingFromDelta(dx);

      this.container.style.left = `${this.positionX}px`;
      this.container.style.top = `${this.positionY}px`;

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        clearInterval(frameTimer);
        this.isJumping = false;
        this.currentEdge = targetEdge;
        this.updateEdgeClass();
        this.startEdgeIdle();
      }
    };
    requestAnimationFrame(step);
  }

  /** 开始边缘闲置动画 */
  startEdgeIdle() {
    this.updateEdgeClass();
    if (this.currentEdge === 'top') this.startAction('hangstillTop');
    else if (this.isSideEdge(this.currentEdge)) this.startAction('hangstillSide');
  }

  /** 随机选择边缘行为 */
  edgeAction() {
    if (this.isJumping || this.isFalling) return;
    const choice = this.spriteConfig.EDGE_ACTIONS[Math.floor(Math.random() * this.spriteConfig.EDGE_ACTIONS.length)];
    if (choice === 'hang') this.startEdgeIdle();
    else if (choice === 'climb') this.startAction(this.currentEdge === 'top' ? 'climbTop' : 'climbSide');
    else if (choice === 'fall') this.fallToBottom();
  }

  // =====================================================================
  // 用户交互 - 抚摸和拖拽
  // =====================================================================

  /** 启用抚摸交互（鼠标悬停触发） */
  enablePetInteraction() {
    if (!this.spriteConfig.ALLOWANCES?.includes('pet') || !this.spriteConfig.ALLOWANCES?.includes('bottom')) return;

    // NOTE: 事件绑定在 img 上而非 container 上，因为 container 设置了 pointer-events: none
    this.img.addEventListener('mouseenter', () => {
      if (this.isFalling || this.isPointerDown || this.isPetting || this.isJumping || this.currentEdge !== 'bottom') return;
      this.isPetting = true;
      this.wasActionBeforePet = this.currentAction;
      this.startPetAnimation();
    });
    this.img.addEventListener('mouseleave', () => {
      if (this.isFalling || this.isPointerDown || this.isJumping || this.currentEdge === 'top') return;
      this.isPetting = false;
      this.stopPetAnimation();
    });
  }

  /** 启用拖拽交互（鼠标 + 触摸） */
  enableDragInteraction() {
    if (!this.spriteConfig.ALLOWANCES?.includes('drag')) return;
    if (!this.spriteConfig.ALLOWANCES?.includes('bottom')) return;

    // NOTE: 事件绑定在 img 上而非 container 上，因为 container 设置了 pointer-events: none
    this.img.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.startDrag(e.clientX, e.clientY);
    });

    // NOTE: 触摸事件 - touchstart 需要阻止默认行为，防止触发浏览器默认手势
    this.img.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrag(touch.clientX, touch.clientY);
    }, { passive: false });

    // 拖拽核心逻辑
    this.startDrag = (clientX, clientY) => {
      this.resetAnimation();

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      this.isDragging = true;
      this.tripAfterFallActive = false;
      this.isJumping = false;
      this.isFalling = false;
      this.isPetting = false;

      this.currentAction = 'drag';
      this.img.style.transform = this.facing === 'left' ? 'scaleX(1)' : 'scaleX(-1)';

      if (this.dragFrameTimer) clearInterval(this.dragFrameTimer);

      const dragConfig = this.spriteConfig.drag;
      if (dragConfig?.frames?.length) {
        let frame = 0;
        this.img.src = dragConfig.frames[0];

        this.dragFrameTimer = setInterval(() => {
          frame = (frame + 1) % dragConfig.frames.length;
          this.img.src = dragConfig.frames[frame];
        }, dragConfig.interval);
      }

      const rect = this.container.getBoundingClientRect();
      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;

      const onPointerMove = (e) => {
        // NOTE: 阻止默认行为 - 移动端拖拽时防止页面跟随滚动
        e.preventDefault();

        const moveClientX = e.clientX ?? e.touches?.[0]?.clientX;
        const moveClientY = e.clientY ?? e.touches?.[0]?.clientY;

        // HACK: 触摸事件结束时 touches 可能为空，跳过无效坐标
        if (moveClientX === undefined || moveClientY === undefined) return;

        this.positionX = moveClientX - offsetX;
        this.positionY = moveClientY - offsetY;

        // 限制在窗口范围内
        this.positionX = Math.max(0, Math.min(this.positionX, window.innerWidth - this.containerWidth));
        this.positionY = Math.max(0, Math.min(this.positionY, window.innerHeight - this.containerHeight));

        this.container.style.left = this.positionX + 'px';
        this.container.style.top = this.positionY + 'px';
      };

      const onPointerUp = () => {
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        window.removeEventListener('touchend', onPointerUp);

        this.isDragging = false;
        this.isFalling = false;

        if (this.dragFrameTimer) {
          clearInterval(this.dragFrameTimer);
          this.dragFrameTimer = null;
        }

        this.resetAnimation();
        this.fallToBottom();

        this.animationFrameId = requestAnimationFrame(this.animate);
      };

      window.addEventListener('mousemove', onPointerMove);
      // NOTE: passive: false 确保可以调用 e.preventDefault() 阻止触摸滚动
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchend', onPointerUp);
    };
  }

  // =====================================================================
  // 坠落和恢复
  // =====================================================================

  /** 动画坠落到底部 */
  fallToBottom(fallSpeed = this.spriteConfig.fallspeed) {
    if (this.isFalling) return;
    this.tripAfterFallActive = false;
    this.isFalling = true;
    this.currentEdge = 'bottom';
    this.updateEdgeClass();
    this.resetAnimation();

    const cfg = this.spriteConfig.falling;
    if (!cfg) return;

    let frameIndex = 0;
    this.img.src = cfg.frames[0];
    this.frameTimer = setInterval(() => {
      frameIndex = (frameIndex + 1) % cfg.frames.length;
      this.img.src = cfg.frames[frameIndex];
    }, cfg.interval);

    const startY = this.positionY;
    const endY = window.innerHeight - this.containerHeight;
    const distance = endY - startY;

    if (distance <= 0) {
      clearInterval(this.frameTimer);
      this.frameTimer = null;
      this.positionY = endY;
      this.container.style.top = `${endY}px`;
      return this.playTripAfterFall();
    }

    const startTime = performance.now();
    const step = (time) => {
      if (this.isDragging) {
        clearInterval(this.frameTimer);
        this.frameTimer = null;
        return this.animationFrameId = requestAnimationFrame(this.animate);
      }

      const elapsed = (time - startTime) / 1000;
      const deltaY = fallSpeed * elapsed;
      this.positionY = Math.min(startY + deltaY, endY);
      this.container.style.top = `${this.positionY}px`;

      if (this.positionY < endY) {
        requestAnimationFrame(step);
      } else {
        clearInterval(this.frameTimer);
        this.frameTimer = null;
        this.positionY = endY;
        this.container.style.top = `${endY}px`;
        this.playTripAfterFall();
      }
    };
    requestAnimationFrame(step);
  }

  /** 着陆后播放摔倒动画 */
  playTripAfterFall() {
    const tripConfig = this.spriteConfig.fallen;
    if (!tripConfig) {
      this.resumeAfterFallen();
      return;
    }

    this.tripAfterFallActive = true;
    let frame = 0;
    const totalFrames = tripConfig.frames.length;
    this.img.src = tripConfig.frames[0];

    const frameTimer = setInterval(() => {
      frame++;

      if (frame >= totalFrames) {
        clearInterval(frameTimer);
        this.img.src = tripConfig.frames[totalFrames - 1];

        setTimeout(() => {
          if (this.tripAfterFallActive) this.resumeAfterFallen();
        }, this.spriteConfig.gettingupspeed);
      } else {
        this.img.src = tripConfig.frames[frame];
      }
    }, tripConfig.interval);
  }

  /** 摔倒恢复后继续正常动作 */
  resumeAfterFallen() {
    if (this.isDragging) return;
    this.isFalling = false;
    this.isPetting = false;
    this.resetAnimation();
    this.lastTime = performance.now();
    this.currentAction = 'sit';
    this.setNextAction();
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  // =====================================================================
  // 动作选择与动画
  // =====================================================================

  /** 选择下一个动作 */
  setNextAction() {
    if (this.isDragging || this.isFalling) return;

    this.resetAnimation();

    // 如果在边缘，执行边缘行为
    if (['top', 'left', 'right'].includes(this.currentEdge)) {
      this.edgeAction();
      return;
    }

    // 随机决定是否跳跃到边缘
    if (!this.isJumping && this.positionY >= window.innerHeight - this.containerHeight) {
      if (Math.random() < this.spriteConfig.JUMP_CHANCE) {
        const edges = ['top', 'left', 'right']
          .filter(e => this.spriteConfig.ALLOWANCES.includes(e));

        if (edges.length) {
          const target = edges[Math.floor(Math.random() * edges.length)];
          this.jumpToEdge(target);
          return;
        }
      }
    }

    // 强制行走
    if (this.forceWalkAfter) {
      this.forceWalkAfter = false;
      this.startForcedWalk();
      return;
    }

    // 强制思考
    if (this.forceThinkAfter) {
      this.forceThinkAfter = false;
      this.startForceThink();
      return;
    }

    // 从随机序列中取下一个动作
    this.currentActionIndex++;
    if (this.currentActionIndex >= this.actionSequence.length) {
      this.currentActionIndex = 0;
      this.actionSequence = this.shuffle([...this.spriteConfig.ORIGINAL_ACTIONS]);
    }

    this.currentAction = this.actionSequence[this.currentActionIndex];
    this.startAction(this.currentAction);
  }

  /** 强制行走若干回合 */
  startForcedWalk() {
    const { frames, interval } = this.spriteConfig.walk;
    const walkCycles = this.spriteConfig.forcewalk;
    this.currentAction = 'forced-walk';
    this.playAnimation(frames, interval, walkCycles, () => this.setNextAction());
  }

  /** 强制思考动画 */
  startForceThink() {
    const { frames, interval, loops } = this.spriteConfig.forcethink;
    this.currentAction = 'force-think';
    this.playAnimation(frames, interval, loops, () => this.setNextAction());
  }

  /** 抚摸动画循环 */
  startPetAnimation() {
    this.resetAnimation();

    const petConfig = this.spriteConfig.pet;
    if (!petConfig) return;

    this.currentAction = 'pet';
    let frame = 0;
    this.img.src = petConfig.frames[0];

    this.frameTimer = setInterval(() => {
      frame = (frame + 1) % petConfig.frames.length;
      this.img.src = petConfig.frames[frame];
    }, petConfig.interval);
  }

  /** 停止抚摸动画 */
  stopPetAnimation() {
    this.resetAnimation();
    this.currentAction = this.wasActionBeforePet || 'sit';
    this.wasActionBeforePet = null;
    this.setNextAction();
  }

  /** 启动指定动作 */
  startAction(action) {
    if (this.isDragging || this.isFalling) return;
    this.currentAction = action;
    this.resetAnimation();

    if (action === 'climbTop') {
      this.direction = Math.random() < 0.5 ? -1 : 1;
      this.updateImageDirection();
    }
    if (action === 'climbSide') {
      this.direction = Math.random() < 0.5 ? -1 : 1;
    }
    if (this.isJumping) {
      this.animationFrameId = requestAnimationFrame(this.animate);
      return;
    }

    const config = this.spriteConfig[action];
    if (!config) return;

    const { frames, interval, loops = 1 } = config;

    // 静止型动作（坐/挂）
    if (action === 'sit' || action === 'hangstillSide' || action === 'hangstillTop') {
      const duration = config.randomizeDuration
        ? Math.random() * (config.max - config.min) + config.min
        : interval * loops;
      this.img.src = frames[0];
      this.actionCompletionTimer = setTimeout(() => {
        this.forceWalkAfter = true;
        this.setNextAction();
      }, duration);
      return;
    }

    this.playAnimation(frames, interval, loops, () => {
      if (action === 'spin') {
        this.direction *= -1;
        this.facing = this.facing === 'left' ? 'right' : 'left';
        this.updateImageDirection();
      }

      if (['trip', 'spin'].includes(action)) this.forceWalkAfter = true;
      if (action === 'dance') this.forceThinkAfter = true;

      this.setNextAction();
    });
  }

  /** 播放帧动画序列 */
  playAnimation(frames, interval, loops, onComplete) {
    let playCount = 0, f = 0;
    this.currentFrame = 0;
    this.img.src = frames[0];
    if (this.frameTimer) clearInterval(this.frameTimer);

    this.frameTimer = setInterval(() => {
      this.currentFrame = f = (f + 1) % frames.length;
      this.img.src = frames[f];
      if (f === frames.length - 1 && ++playCount >= loops) {
        clearInterval(this.frameTimer);
        this.frameTimer = null;
        this.currentAction = null;
        this.actionCompletionTimer = setTimeout(onComplete, 0);
      }
    }, interval);
  }

  // =====================================================================
  // 主动画循环（移动逻辑）
  // =====================================================================

  /** requestAnimationFrame 回调 - 处理桌宠移动 */
  animate(time) {
    if (!this.lastTime) this.lastTime = time;
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (this.isDragging || this.isFalling) {
      this.animationFrameId = requestAnimationFrame(this.animate);
      return;
    }

    // 水平移动的动作
    const movingActions = ['walk', 'forced-walk', 'climbTop'];
    if (movingActions.includes(this.currentAction)) {
      const dx = this.direction * this.spriteConfig.walkspeed * delta;
      this.positionX += dx;
      this.setFacingFromDelta(dx);

      // 到达边界时反转方向
      if (this.positionX <= 0) {
        this.positionX = 0;
        this.direction = 1;
        this.facing = 'right';
        this.updateImageDirection();
      } else if (this.positionX >= this.maxPos) {
        this.positionX = this.maxPos;
        this.direction = -1;
        this.facing = 'left';
        this.updateImageDirection();
      }
      this.applyEdgeOffset();
    }

    // 侧边攀爬（垂直移动）
    if (this.currentAction === 'climbSide') {
      this.positionY += this.direction * this.spriteConfig.walkspeed * delta;

      if (this.currentEdge === 'left') {
        this.facing = 'left';
      } else if (this.currentEdge === 'right') {
        this.facing = 'right';
      }
      this.updateImageDirection();

      const maxY = window.innerHeight - this.containerHeight;
      if (this.positionY <= 0) {
        this.positionY = 0;
        this.direction = 1;
      } else if (this.positionY >= maxY) {
        this.positionY = maxY;
        this.direction = -1;
      }
      this.applyEdgeOffset();
    }

    this.animationFrameId = requestAnimationFrame(this.animate);
  }
}
