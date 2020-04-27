let spawnTime = 0;
const maxSpawnX = 450;
const pointerDelta = { x: 0, y: 0 };
const pointerDeltaScaled = { x: 0, y: 0 };
// 临时slowmo状态。一旦稳定下来就应该重新安置。
const slowmoDuration = 1500;
let slowmoRemaining = 0;
let spawnExtra = 0;
const spawnExtraDelay = 300;
let targetSpeed = 1;
function tick(width, height, simTime, simSpeed, lag) {
  PERF_START("frame");
  PERF_START("tick");
  state.game.time += simTime;
  if (slowmoRemaining > 0) {
    slowmoRemaining -= simTime;
    slowmoRemaining = Math.max(slowmoRemaining, 0);
    targetSpeed = pointerIsDown ? .075 : .3;
  } else targetSpeed = isMenuVisible() && pointerIsDown ? .025 : 1;
  renderSlowmoStatus(slowmoRemaining / slowmoDuration);

  gameSpeed += (targetSpeed - gameSpeed) / 22 * lag;
  gameSpeed = clamp(gameSpeed, 0, 1);
  const centerX = width / 2;
  const centerY = height / 2;
  const simAirDrag = 1 - (airDrag * simSpeed);
  const simAirDragSpark = 1 - (airDragSpark * simSpeed);
  // 指针跟踪
  // -------------------
  // 计算速度和x/y增量。
  // 也有一个“缩放”变量考虑到游戏速度。这有两个目的:
  // - 延迟不会造成速度/增量的大的峰值
  // - 在慢动作中，速度按比例增加，以符合“现实”。如果没有这种刺激，你会觉得你的行动在慢动作中被抑制了。
  const forceMultiplier = 1 / (simSpeed * .75 + .25);
  pointerDelta.x = 0;
  pointerDelta.y = 0;
  pointerDeltaScaled.x = 0;
  pointerDeltaScaled.y = 0;
  const lastPointer = touchPoints[touchPoints.length - 1];
  if (pointerIsDown && lastPointer && !lastPointer.touchBreak) {
    pointerDelta.x = (pointerScene.x - lastPointer.x);
    pointerDelta.y = (pointerScene.y - lastPointer.y);
    pointerDeltaScaled.x = pointerDelta.x * forceMultiplier;
    pointerDeltaScaled.y = pointerDelta.y * forceMultiplier;
  }
  const pointerSpeed = Math.hypot(pointerDelta.x, pointerDelta.y);
  const pointerSpeedScaled = pointerSpeed * forceMultiplier;
  // 跟踪点为以后的计算，包括绘图跟踪。
  touchPoints.forEach(p => p.life -= simTime);
  if (pointerIsDown) {
    touchPoints.push({
      x: pointerScene.x,
      y: pointerScene.y,
      life: touchPointLife
    });
  }
  while (touchPoints[0] && touchPoints[0].life <= 0) {
    touchPoints.shift();
  }
  // 实体操作
  // --------------------
  PERF_START("entities");
  // 生成目标
  spawnTime -= simTime;
  if (spawnTime <= 0) {
    if (spawnExtra > 0) {
      spawnExtra--;
      spawnTime = spawnExtraDelay;
    } else {
      spawnTime = getSpawnDelay();
    }
    const target = getTarget();
    const spawnRadius = Math.min(centerX * .8, maxSpawnX);
    target.x = Math.random() * spawnRadius * 2 - spawnRadius;
    target.y = centerY + targetHitRadius;
    target.z = Math.random() * targetRadius * 2 - targetRadius;
    target.xD = Math.random() * target.x * -2 / 120;
    target.yD = -20;
    targets.push(target);
  }
  // 动画目标和删除时，离线
  const leftBound = targetRadius - centerX;
  const rightBound = centerX - targetRadius;
  const ceiling = -centerY - 120;
  const boundDamping = .4;
  targetLoop: for (let i = targets.length - 1; i >= 0; i--) {
    const target = targets[i];
    target.x += target.xD * simSpeed;
    target.y += target.yD * simSpeed;
    if (target.y < ceiling) {
      target.y = ceiling;
      target.yD = 0;
    }
    if (target.x < leftBound) {
      target.x = leftBound;
      target.xD *= -boundDamping;
    } else if (target.x > rightBound) {
      target.x = rightBound;
      target.xD *= -boundDamping;
    }
    if (target.z < backboardZ) {
      target.z = backboardZ;
      target.zD *= -boundDamping;
    }
    target.yD += gravity * simSpeed;
    target.rotateX += target.rotateXD * simSpeed;
    target.rotateY += target.rotateYD * simSpeed;
    target.rotateZ += target.rotateZD * simSpeed;
    target.transform();
    target.project();
    // 如果在屏幕之外
    if (target.projected.y > centerY + targetHitRadius * 2) {
      targets.splice(i, 1);
      returnTarget(target);
      if (isInGame())
        isCasualGame()
          ? incrementScore(-25)
          : endGame();
      continue;
    }
    // 如果指针移动非常快，我们想要在路径上命中多个点。
    // 我们不能使用缩放的指针速度来确定这一点，因为我们关心的是实际屏幕覆盖的距离。
    const hitTestCount = Math.ceil(pointerSpeed / targetRadius * 2);
    // 从" 1 "开始循环，并使用" <= "检查，所以我们跳过0%，以100%结束。
    // 这将省略前面的点位置，并包含最近的点位置。
    for (let j = 1; j <= hitTestCount; j++) {
      const percent = 1 - (j / hitTestCount);
      const hitX = pointerScene.x - pointerDelta.x * percent;
      const hitY = pointerScene.y - pointerDelta.y * percent;
      const distance = Math.hypot(hitX - target.projected.x, hitY - target.projected.y);
      if (distance <= targetHitRadius) {
        // 打击!(尽管我们不想让点击多个连续帧)
        if (!target.hit) {
          target.hit = true;
          target.xD += pointerDeltaScaled.x * hitDampening;
          target.yD += pointerDeltaScaled.y * hitDampening;
          target.rotateXD += pointerDeltaScaled.y * .001;
          target.rotateYD += pointerDeltaScaled.x * .001;
          const sparkSpeed = 7 + pointerSpeedScaled * .125;
          if (pointerSpeedScaled > minPointerSpeed) {
            target.health--;
            incrementScore(10);
            if (target.health <= 0) {
              incrementCubeCount(1);
              createBurst(target, forceMultiplier);
              sparkBurst(hitX, hitY, 8, sparkSpeed);
              if (target.wireframe) {
                slowmoRemaining = slowmoDuration;
                spawnTime = 0;
                spawnExtra = 2;
              }
              targets.splice(i, 1);
              returnTarget(target);
            }
            else {
              sparkBurst(hitX, hitY, 8, sparkSpeed);
              glueShedSparks(target);
              updateTargetHealth(target, 0);
            }
          }
          else {
            incrementScore(5);
            sparkBurst(hitX, hitY, 3, sparkSpeed);
          }
        }
        // 断开当前循环，继续外部循环。
        // 这将跳转到处理下一个目标。
        continue targetLoop;
      }
    }
    // 此代码仅在目标未被“命中”的情况下运行。
    target.hit = false;
  }
  // 动画碎片和删除时，离线。
  const fragBackboardZ = backboardZ + fragRadius;
  // 允许碎片离开屏幕向两边移动一段时间，因为阴影仍然可见。
  const fragLeftBound = -width;
  const fragRightBound = width;
  for (let i = frags.length - 1; i >= 0; i--) {
    const frag = frags[i];
    frag.x += frag.xD * simSpeed;
    frag.y += frag.yD * simSpeed;
    frag.z += frag.zD * simSpeed;
    frag.xD *= simAirDrag;
    frag.yD *= simAirDrag;
    frag.zD *= simAirDrag;
    if (frag.y < ceiling) {
      frag.y = ceiling;
      frag.yD = 0;
    }
    if (frag.z < fragBackboardZ) {
      frag.z = fragBackboardZ;
      frag.zD *= -boundDamping;
    }
    frag.yD += gravity * simSpeed;
    frag.rotateX += frag.rotateXD * simSpeed;
    frag.rotateY += frag.rotateYD * simSpeed;
    frag.rotateZ += frag.rotateZD * simSpeed;
    frag.transform();
    frag.project();
    // 删除条件
    if (
      // 屏幕的底部
      frag.projected.y > centerY + targetHitRadius ||
      // 屏幕的边
      frag.projected.x < fragLeftBound ||
      frag.projected.x > fragRightBound ||
      // 离屏幕太近
      frag.z > cameraFadeEndZ) {
      frags.splice(i, 1);
      returnFrag(frag);
      continue;
    }
  }
  // 2D 火花
  for (let i = sparks.length - 1; i >= 0; i--) {
    const spark = sparks[i];
    spark.life -= simTime;
    if (spark.life <= 0) {
      sparks.splice(i, 1);
      returnSpark(spark);
      continue;
    }
    spark.x += spark.xD * simSpeed;
    spark.y += spark.yD * simSpeed;
    spark.xD *= simAirDragSpark;
    spark.yD *= simAirDragSpark;
    spark.yD += gravity * simSpeed;
  }
  PERF_END("entities");
  // 3D 转换
  PERF_START("3D");
  // 聚集所有的场景顶点/多边形
  allVertices.length = 0;
  allPolys.length = 0;
  allShadowVertices.length = 0;
  allShadowPolys.length = 0;
  targets.forEach(entity => {
    allVertices.push(...entity.vertices);
    allPolys.push(...entity.polys);
    allShadowVertices.push(...entity.shadowVertices);
    allShadowPolys.push(...entity.shadowPolys);
  });
  frags.forEach(entity => {
    allVertices.push(...entity.vertices);
    allPolys.push(...entity.polys);
    allShadowVertices.push(...entity.shadowVertices);
    allShadowPolys.push(...entity.shadowPolys);
  });
  // 现场计算/转换
  allPolys.forEach(p => computePolyNormal(p, "normalWorld"));
  allPolys.forEach(computePolyDepth);
  allPolys.sort((a, b) => b.depth - a.depth);
  // 透视投影
  allVertices.forEach(projectVertex);
  allPolys.forEach(p => computePolyNormal(p, "normalCamera"));
  PERF_END("3D");
  PERF_START("shadows");
  // 将阴影顶点旋转到光源角度
  transformVertices(allShadowVertices, allShadowVertices, 0, 0, 0, TAU / 8, 0, 0, 1, 1, 1);
  allShadowPolys.forEach(Poly => computePolyNormal(Poly, "normalWorld"));
  for (let i = 0; i < allShadowVertices.length; i++) 
    allShadowVertices[i].z -= Math.hypot(1, 1) * (allVertices[i].z - backboardZ);
  transformVertices(allShadowVertices, allShadowVertices, 0, 0, 0, -TAU / 8, 0, 0, 1, 1, 1);
  allShadowVertices.forEach(projectVertex);
  PERF_END("shadows");
  PERF_END("tick");
}
