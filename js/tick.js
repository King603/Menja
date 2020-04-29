let spawnTime = 0;
let maxSpawnX = 450;
let pointerDelta = { x: 0, y: 0 };
let pointerDeltaScaled = { x: 0, y: 0 };
// 临时slowmo状态。一旦稳定下来就应该重新安置。
let slowmoDuration = 1500;
let slowmoRemaining = 0;
let spawnExtra = 0;
let spawnExtraDelay = 300;
let targetSpeed = 1;
function tick(width, height, simTime, simSpeed, lag) {
  PERF_START("frame");
  PERF_START("tick");
  state.game.time += simTime;
  if (slowmoRemaining > 0) {
    slowmoRemaining -= simTime;
    slowmoRemaining = Math.max(slowmoRemaining, 0);
    targetSpeed = pointer.isDown ? .075 : .3;
  } else targetSpeed = isMenuVisible() && pointer.isDown ? .025 : 1;
  renderSlowmoStatus(slowmoRemaining / slowmoDuration);

  gameSpeed += (targetSpeed - gameSpeed) / 22 * lag;
  gameSpeed = clamp(gameSpeed, 0, 1);
  let centerX = width / 2;
  let centerY = height / 2;
  let simAirDrag = 1 - (airDrag * simSpeed);
  let simAirDragSpark = 1 - (airDragSpark * simSpeed);
  // 指针跟踪
  // -------------------
  // 计算速度和x/y增量。
  // 也有一个“缩放”变量考虑到游戏速度。这有两个目的:
  // - 延迟不会造成速度/增量的大的峰值
  // - 在慢动作中，速度按比例增加，以符合“现实”。如果没有这种刺激，你会觉得你的行动在慢动作中被抑制了。
  let forceMultiplier = 1 / (simSpeed * .75 + .25);
  pointerDelta.x = 0;
  pointerDelta.y = 0;
  pointerDeltaScaled.x = 0;
  pointerDeltaScaled.y = 0;
  let lastPointer = touchPoints[touchPoints.length - 1];
  if (pointer.isDown && lastPointer && !lastPointer.touchBreak) {
    pointerDelta.x = (pointer.scene.x - lastPointer.x);
    pointerDelta.y = (pointer.scene.y - lastPointer.y);
    pointerDeltaScaled.x = pointerDelta.x * forceMultiplier;
    pointerDeltaScaled.y = pointerDelta.y * forceMultiplier;
  }
  let pointerSpeed = Math.hypot(pointerDelta.x, pointerDelta.y);
  let pointerSpeedScaled = pointerSpeed * forceMultiplier;
  // 跟踪点为以后的计算，包括绘图跟踪。
  touchPoints.forEach(p => p.life -= simTime);
  if (pointer.isDown) {
    touchPoints.push({
      x: pointer.scene.x,
      y: pointer.scene.y,
      life: touchPointLife
    });
  }
  while (touchPoints[0] && touchPoints[0].life <= 0) {
    touchPoints.shift();
  }
  // 实体操作
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
    let target = getTarget();
    let spawnRadius = Math.min(centerX * .8, maxSpawnX);
    target.x = Math.random() * spawnRadius * 2 - spawnRadius;
    target.y = centerY + targetHitRadius;
    target.z = Math.random() * targetRadius * 2 - targetRadius;
    target.xD = Math.random() * target.x * -2 / 120;
    target.yD = -20;
    targets.push(target);
  }
  // 动画目标和删除时，离线
  let leftBound = targetRadius - centerX;
  let rightBound = centerX - targetRadius;
  let ceiling = -centerY - 120;
  let boundDamping = .4;
  targetLoop: for (let i = targets.length - 1; i >= 0; i--) {
    let target = targets[i];
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
    let hitTestCount = Math.ceil(pointerSpeed / targetRadius * 2);
    // 从" 1 "开始循环，并使用" <= "检查，所以我们跳过0%，以100%结束。
    // 这将省略前面的点位置，并包含最近的点位置。
    for (let j = 1; j <= hitTestCount; j++) {
      let percent = 1 - (j / hitTestCount);
      let hitX = pointer.scene.x - pointerDelta.x * percent;
      let hitY = pointer.scene.y - pointerDelta.y * percent;
      let distance = Math.hypot(hitX - target.projected.x, hitY - target.projected.y);
      if (distance <= targetHitRadius) {
        // 打击!(尽管我们不想让点击多个连续帧)
        if (!target.hit) {
          target.hit = true;
          target.xD += pointerDeltaScaled.x * hitDampening;
          target.yD += pointerDeltaScaled.y * hitDampening;
          target.rotateXD += pointerDeltaScaled.y * .001;
          target.rotateYD += pointerDeltaScaled.x * .001;
          let sparkSpeed = 7 + pointerSpeedScaled * .125;
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
  let fragBackboardZ = backboardZ + fragRadius;
  // 允许碎片离开屏幕向两边移动一段时间，因为阴影仍然可见。
  let fragLeftBound = -width;
  let fragRightBound = width;
  for (let i = frags.length - 1; i >= 0; i--) {
    let frag = frags[i];
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
    let spark = sparks[i];
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
  all.vertices.length = 0;
  all.polys.length = 0;
  all.shadow.vertices.length = 0;
  all.shadow.polys.length = 0;
  targets.forEach(entity => runFor(entity));
  frags.forEach(entity => runFor(entity));
  function runFor({ vertices, polys, shadowVertices, shadowPolys }) {
    all.vertices.push(...vertices);
    all.polys.push(...polys);
    all.shadow.vertices.push(...shadowVertices);
    all.shadow.polys.push(...shadowPolys);
  }
  // 现场计算/转换
  all.polys.forEach(p => computePolyNormal(p, "normalWorld"));
  all.polys.forEach(computePolyDepth);
  all.polys.sort((a, b) => b.depth - a.depth);
  // 透视投影
  all.vertices.forEach(projectVertex);
  all.polys.forEach(p => computePolyNormal(p, "normalCamera"));
  PERF_END("3D");
  PERF_START("shadows");
  // 将阴影顶点旋转到光源角度
  let t = { x: 0, y: 0, z: 0 };
  let r = { x: TAU / 8, y: 0, z: 0 };
  let s = { x: 1, y: 1, z: 1 };
  let data = [all.shadow.vertices, all.shadow.vertices, t, r, s];
  transformVertices(...data);
  all.shadow.polys.forEach(Poly => computePolyNormal(Poly, "normalWorld"));
  for (let i = 0; i < all.shadow.vertices.length; i++)
    all.shadow.vertices[i].z -= Math.hypot(1, 1) * (all.vertices[i].z - backboardZ);
  r.x *= -1;
  transformVertices(...data);
  all.shadow.vertices.forEach(projectVertex);
  PERF_END("shadows");
  PERF_END("tick");
}
