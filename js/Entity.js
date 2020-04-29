class Entity {
  constructor({ model, color, wireframe = false }) {
    this.projected = {}; // 将存储2D投影数据
    this.model = model;
    this.vertices = cloneVertices(this.model.vertices);
    this.polys = this.model.polys.map(p => ({
      vertices: p.vIndexes.map(vIndex => this.vertices[vIndex]),
      color,
      wireframe,
      strokeWidth: wireframe ? 2 : 0,
      strokeColor: colorToHex(color),
      strokeColorDark: shadeColor(color, .4),
      depth: 0,
      middle: { x: 0, y: 0, z: 0 },
      normalWorld: { x: 0, y: 0, z: 0 },
      normalCamera: { x: 0, y: 0, z: 0 }
    }));
    this.shadowVertices = cloneVertices(this.model.vertices);
    this.shadowPolys = this.model.polys.map(p => ({
      vertices: p.vIndexes.map(vIndex => this.shadowVertices[vIndex]),
      wireframe,
      normalWorld: { x: 0, y: 0, z: 0 }
    }));
    this.reset();
  }
  // 更好的名字:resetEntity, resetTransform, resetEntityTransform
  reset() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.xD = 0;
    this.yD = 0;
    this.zD = 0;
    this.rotateX = 0;
    this.rotateY = 0;
    this.rotateZ = 0;
    this.rotateXD = 0;
    this.rotateYD = 0;
    this.rotateZD = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.scaleZ = 1;
    this.projected.x = 0;
    this.projected.y = 0;
  }
  transform() {
    transformVertices(
      this.model.vertices,
      this.vertices,
      {
        x: this.x,
        y: this.y,
        z: this.z
      },
      {
        x: this.rotateX,
        y: this.rotateY,
        z: this.rotateZ
      },
      {
        x: this.scaleX,
        y: this.scaleY,
        z: this.scaleZ
      }
    );
    copyVerticesTo(this.vertices, this.shadowVertices);
  }
  // 项目起点，存储为“投影”属性。
  project() {
    projectVertexTo(this, this.projected);
  }
}
