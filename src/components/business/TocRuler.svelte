<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { dataState } from '$lib/core/data.svelte';

  // --- 物理参数调优 (调节手感的核心) ---
  const RADIUS = 200;        // 滚轮半径。越大越平坦。
  const ITEM_ANGLE = 18;     // 每个刻度之间的夹角。越小越密集。
  const FRICTION = 0.92;     // 摩擦系数 (0~1)。越小停得越快，越大惯性越大。
  const SNAP_SPEED = 0.3;    // 当速度小于这个值时，开始触发吸附。
  const SNAP_STRENGTH = 0.08;// 吸附力度。越大“咔”得越干脆。

  // --- 核心状态 ---
  let currentAngle = $state(0); // 滚轮当前的绝对角度
  let velocity = $state(0);     // 当前的旋转速度
  let isWheeling = false;       // 是否正在操作滚轮区域
  let rafId: number;

  // 计算当前最接近中心的索引值 (例如 3.4 -> 3, 3.6 -> 4)
  const snappedIndex = $derived(Math.round(currentAngle / ITEM_ANGLE));

  // --- 物理引擎循环 ---
  function loop() {
    // 1. 应用速度
    currentAngle += velocity;

    // 2. 应用摩擦力 (让它慢下来)
    velocity *= FRICTION;

    // 3. 计算吸附目标
    // 目标角度是最近的整数倍 ITEM_ANGLE
    const targetAngle = snappedIndex * ITEM_ANGLE;
    const distToTarget = targetAngle - currentAngle;

    // 4. 应用吸附力
    // 如果速度很慢了，或者已经很接近目标了，就施加吸附力
    if (Math.abs(velocity) < SNAP_SPEED || Math.abs(distToTarget) < 1) {
        velocity += distToTarget * SNAP_STRENGTH;
        
        // 如果非常接近目标且速度极小，强制停止以节省计算，并防止抖动
        if (Math.abs(distToTarget) < 0.01 && Math.abs(velocity) < 0.01) {
            currentAngle = targetAngle;
            velocity = 0;
        }
    }

    rafId = requestAnimationFrame(loop);
  }

  // --- 交互事件处理 ---

  // 鼠标滚轮拨动
  function handleWheel(e: WheelEvent) {
    // 阻止页面默认滚动，让滚轮接管
    e.preventDefault();
    isWheeling = true;
    // 将滚轮的力度转换为旋转速度，除以一个系数让手感更顺滑
    velocity += e.deltaY * 0.03;
  }

  // 点击某个刻度
  function handleClick(index: number) {
    // 点击时给一个指向目标角度的初速度，实现一种“弹过去”的感觉
    const targetAngle = index * ITEM_ANGLE;
    velocity = (targetAngle - currentAngle) * 0.2;
  }

  // 鼠标离开区域，标记结束操作
  function handleMouseLeave() {
    isWheeling = false;
  }

  // --- 页面同步副作用 ---
  // 当物理引擎计算出的 snappedIndex 发生变化，且滚轮基本停稳时，同步页面
  $effect(() => {
    // 确保数据存在且索引有效
    if (!dataState.groups.length || snappedIndex < 0 || snappedIndex >= dataState.groups.length) return;
    
    // 只有当速度很慢（基本对准了）才触发页面滚动，避免页面剧烈抖动
    if (Math.abs(velocity) < 0.5) {
        const targetId = dataState.groups[snappedIndex].id;
        const el = document.querySelector(`[data-dnd-group-id="${targetId}"]`);
        if (el) {
            // 使用 auto 行为，因为滚轮已经提供了动画，页面应该瞬间跟过去
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
    }
  });

  onMount(() => {
    // 启动物理引擎
    rafId = requestAnimationFrame(loop);
    
    // 初始定位：根据当前页面位置设置滚轮初始角度
    setTimeout(() => {
        const winHalf = window.innerHeight / 2;
        let closestIndex = 0;
        let minDiff = Infinity;
        
        dataState.groups.forEach((g, i) => {
            const el = document.querySelector(`[data-dnd-group-id="${g.id}"]`);
            if(el) {
                const rect = el.getBoundingClientRect();
                const center = rect.top + rect.height / 2;
                const diff = Math.abs(center - winHalf);
                if(diff < minDiff) {
                    minDiff = diff;
                    closestIndex = i;
                }
            }
        });
        currentAngle = closestIndex * ITEM_ANGLE;
    }, 500);
  });

  onDestroy(() => {
    cancelAnimationFrame(rafId);
  });
</script>

<aside 
    class="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden xl:block h-[380px] w-40 select-none outline-none cursor-grab active:cursor-grabbing"
    onwheel={handleWheel}
    onmouseleave={handleMouseLeave}
    style="
        perspective: 800px;
        mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%);
    "
>
    <div class="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[44px] border-y-2 border-primary/30 bg-primary/5 pointer-events-none z-0 rounded-[4px] shadow-[0_0_15px_-5px_var(--color-primary)]"></div>

    <div class="relative w-full h-full" style="transform-style: preserve-3d;">
        {#each dataState.groups as group, i (group.id)}
            {@const itemAngleOffset = (i * ITEM_ANGLE) - currentAngle}
            
            {#if Math.abs(itemAngleOffset) < 85}
                {@const normDist = Math.abs(itemAngleOffset) / 85}
                {@const scale = 1.1 - Math.pow(normDist, 1.5) * 0.4; }
                {@const opacity = 1 - Math.pow(normDist, 2); }
                {@const isCentered = i === snappedIndex; }

                <button 
                    onclick={() => handleClick(i)}
                    class="absolute left-0 top-1/2 -mt-[22px] w-full h-[44px] flex items-center justify-end pr-6 gap-3 outline-none group transition-colors"
                    style="
                        /* 核心：绕 X 轴旋转，并向 Z 轴推远，形成圆柱体表面 */
                        transform: rotateX({-itemAngleOffset}deg) translateZ({RADIUS}px) scale({scale});
                        opacity: {opacity};
                        /* 防止背面元素闪烁 */
                        backface-visibility: hidden;
                        z-index: {isCentered ? 10 : 1};
                    "
                >
                    <span class={`
                        text-[12px] font-bold tracking-[0.1em] uppercase text-right truncate transition-colors
                        ${isCentered 
                            ? 'text-primary' 
                            : 'text-text-dim/50'
                        }
                    `}>
                        {group.name}
                    </span>
                </button>
            {/if}
        {/each}
    </div>
</aside>