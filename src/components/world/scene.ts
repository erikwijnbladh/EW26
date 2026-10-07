import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

import type { Stop } from "./stops";

/** Procedural artwork: no external model or texture downloads. */
export function createWorld(
  host: HTMLDivElement,
  onSelect: (stop: Stop) => void,
  onHover: (stop: Stop | null) => void,
  reduced: boolean,
) {
  const scene = new T.Scene();
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute(
    "aria-label",
    "Interactive island. Drag to orbit, or use the location buttons to explore.",
  );
  host.appendChild(renderer.domElement);
  const camera = new T.PerspectiveCamera(36, 1, 0.1, 100);
  const home = new T.Vector3(13, 12, 17);
  camera.position.copy(home);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.7, 0);
  controls.enableDamping = !reduced;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.4;
  controls.maxPolarAngle = Math.PI / 2.25;
  controls.minAzimuthAngle = -Math.PI / 2;
  controls.maxAzimuthAngle = Math.PI / 2;
  const ambient = new T.HemisphereLight(0xfff4df, 0x84957a, 2.8);
  scene.add(ambient);
  const sun = new T.DirectionalLight(0xffeed3, 4);
  sun.position.set(-5, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 });
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  const blue = new T.PointLight(0x7dccff, 0, 12);
  blue.position.set(-1.8, 2.5, -1.3);
  scene.add(blue);
  const island = new T.Group();
  scene.add(island);
  const materials = new Map<string, T.MeshStandardMaterial>();
  function material(color: string) {
    if (!materials.has(color))
      materials.set(
        color,
        new T.MeshStandardMaterial({ color, roughness: 0.7 }),
      );
    return materials.get(color)!;
  }
  function box(
    parent: T.Object3D,
    size: number[],
    pos: number[],
    color: string,
    radius = 0.05,
  ) {
    const mesh = new T.Mesh(
      new RoundedBoxGeometry(size[0], size[1], size[2], 2, radius),
      material(color),
    );
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(
    parent: T.Object3D,
    top: number,
    bottom: number,
    height: number,
    pos: number[],
    color: string,
    segments = 32,
  ) {
    const mesh = new T.Mesh(
      new T.CylinderGeometry(top, bottom, height, segments),
      material(color),
    );
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function sphere(
    parent: T.Object3D,
    radius: number,
    pos: number[],
    color: string,
  ) {
    const mesh = new T.Mesh(
      new T.IcosahedronGeometry(radius, 1),
      material(color),
    );
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const textures: T.Texture[] = [];
  function sign(
    parent: T.Object3D,
    lines: string[],
    pos: number[],
    width: number,
    ink = "#f8f4e9",
    background = "#263c3b",
    aspect = 2,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024 / aspect;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold " + (lines.length > 1 ? 84 : 90) + "px monospace";
    lines.forEach((line, i) =>
      ctx.fillText(
        line,
        512,
        canvas.height / 2 + (i - (lines.length - 1) / 2) * 115,
      ),
    );
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    textures.push(texture);
    const mesh = new T.Mesh(
      new T.PlaneGeometry(width, width / aspect),
      new T.MeshBasicMaterial({ map: texture }),
    );
    mesh.position.set(pos[0], pos[1], pos[2]);
    parent.add(mesh);
    return mesh;
  }
  const objects = new Map<Stop, T.Group>();
  function station(id: Stop, x: number, z: number) {
    const group = new T.Group();
    group.position.set(x, 0.2, z);
    group.userData.stop = id;
    island.add(group);
    objects.set(id, group);
    return group;
  }
  box(island, [10, 0.65, 8], [0, -0.35, 0], "#cd7459", 0.2);
  box(island, [10.08, 0.2, 8.08], [0, 0.06, 0], "#eae3d2", 0.1);
  for (let x = -4.5; x < 5; x++)
    for (let z = -3.5; z < 4; z++) {
      box(
        island,
        [0.985, 0.025, 0.985],
        [x, 0.18, z],
        Math.round(x + z) % 2 === 0 ? "#e7dfcb" : "#ddd4bd",
        0.01,
      );
    }
  box(island, [10, 0.13, 0.15], [0, 0.28, -3.85], "#fff5db");
  box(island, [0.15, 0.13, 8], [-4.85, 0.28, 0], "#fff5db");
  const work = station("work", -1.4, -1.4);
  box(work, [3.7, 0.2, 1.65], [0, 1.55, 0], "#497e71");
  for (const x of [-1.5, 1.5])
    for (const z of [-0.55, 0.55])
      box(work, [0.13, 1.5, 0.13], [x, 0.75, z], "#284f48");
  box(work, [0.7, 0.13, 0.5], [0, 1.72, 0], "#d9d2b9");
  box(work, [0.2, 0.4, 0.2], [0, 1.9, 0], "#d9d2b9");
  box(work, [1.65, 1.22, 0.75], [0, 2.44, -0.12], "#f3e8ce", 0.13);
  box(work, [1.39, 0.9, 0.05], [0, 2.46, 0.28], "#233e3c");
  sign(
    work,
    ["HELLO, WORLD.", "I’M ERIK :)"],
    [0, 2.47, 0.313],
    1.3,
    "#bdebad",
  );
  box(work, [1.3, 0.08, 0.4], [0, 1.72, 0.58], "#f3e8ce");
  for (let x = 0; x < 10; x++)
    for (let z = 0; z < 3; z++)
      box(
        work,
        [0.09, 0.025, 0.07],
        [-0.54 + x * 0.12, 1.77, 0.48 + z * 0.1],
        "#b9b8a1",
        0.01,
      );
  cylinder(work, 0.17, 0.14, 0.3, [1.15, 1.8, 0.4], "#ee7c43");
  cylinder(work, 0.13, 0.13, 0.01, [1.15, 1.96, 0.4], "#473429");
  cylinder(work, 0.23, 0.3, 0.06, [-1.35, 1.7, -0.3], "#eab951");
  box(work, [0.05, 0.9, 0.05], [-1.35, 2.13, -0.3], "#eab951");
  cylinder(work, 0.12, 0.35, 0.32, [-1.35, 2.58, -0.3], "#eab951");
  cylinder(work, 0.48, 0.48, 0.17, [0, 0.8, 1.25], "#e48055");
  for (const x of [-0.3, 0.3])
    box(work, [0.09, 0.75, 0.09], [x, 0.38, 1.25], "#9c5840");
  const about = station("about", -3.45, 1.55);
  cylinder(about, 0.45, 0.34, 0.65, [-0.25, 0.32, -0.4], "#c16b4c");
  cylinder(about, 0.095, 0.13, 2, [-0.25, 1.4, -0.4], "#78583e", 10);
  sphere(about, 0.75, [-0.25, 2.65, -0.4], "#708959");
  sphere(about, 0.53, [-0.7, 2.15, -0.4], "#98a46a");
  sphere(about, 0.5, [0.25, 2.4, -0.4], "#869659");
  box(about, [0.53, 0.65, 0.35], [0.75, 0.92, 0.3], "#355e68", 0.13);
  sphere(about, 0.27, [0.75, 1.53, 0.3], "#e4b38a");
  cylinder(about, 0.27, 0.28, 0.17, [0.75, 1.74, 0.3], "#ec7044");
  for (const x of [0.58, 0.93]) {
    box(about, [0.15, 0.53, 0.18], [x, 0.4, 0.3], "#2d4548");
    box(about, [0.19, 0.13, 0.34], [x, 0.12, 0.37], "#f4edd9");
  }
  const music = station("music", 2.4, -2.15);
  box(music, [1.7, 1.2, 1.05], [0, 0.6, 0], "#b56a49");
  box(music, [1.78, 0.12, 1.12], [0, 1.26, 0], "#e3ab73");
  box(music, [1.2, 0.14, 0.8], [0, 1.4, 0], "#e7d5b3");
  const record = cylinder(
    music,
    0.35,
    0.35,
    0.03,
    [-0.13, 1.49, 0],
    "#263b3b",
    48,
  );
  cylinder(record, 0.12, 0.12, 0.035, [0, 0.025, 0], "#e47a43");
  box(record, [0.04, 0.006, 0.22], [0.2, 0.025, 0], "#516463");
  box(music, [0.04, 0.05, 0.5], [0.4, 1.52, -0.03], "#645c4a").rotation.y =
    -0.35;
  for (const x of [-1.1, 1.1]) {
    box(music, [0.42, 0.8, 0.4], [x, 1.67, 0], "#344542");
    cylinder(music, 0.135, 0.135, 0.03, [x, 1.62, 0.22], "#ab9d79").rotation.x =
      Math.PI / 2;
  }
  for (let i = 0; i < 8; i++)
    box(
      music,
      [0.11, 0.68, 0.72],
      [-0.55 + i * 0.15, 0.54, 0.16],
      ["#577c72", "#e2b355", "#dc784f"][i % 3],
    );
  sign(music, ["HEAVY", "ROTATION"], [0, 2.65, -0.3], 1.6, "#e8ddbd");
  const skate = station("elsewhere", 1.65, 1.6);
  box(skate, [2.65, 0.08, 2.1], [0, 0.04, 0], "#b7bbae");
  const shape = new T.Shape();
  shape.moveTo(-1, 0);
  shape.lineTo(1, 0);
  shape.lineTo(1, 1.15);
  shape.lineTo(0.7, 1.15);
  shape.quadraticCurveTo(0.55, 0.1, -1, 0.1);
  shape.closePath();
  const ramp = new T.Mesh(
    new T.ExtrudeGeometry(shape, {
      depth: 1.6,
      bevelEnabled: false,
      curveSegments: 20,
    }),
    material("#d5ad76"),
  );
  ramp.position.set(0, 0.1, -0.8);
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  skate.add(ramp);
  box(skate, [0.07, 0.08, 1.67], [0.72, 1.27, 0], "#587b76");
  const board = new T.Group();
  board.position.set(-0.55, 0.35, 0.25);
  board.rotation.y = -0.5;
  skate.add(board);
  box(board, [0.35, 0.07, 0.95], [0, 0, 0], "#df643b", 0.12);
  for (const x of [-0.2, 0.2])
    for (const z of [-0.3, 0.3])
      cylinder(
        board,
        0.085,
        0.085,
        0.09,
        [x, -0.1, z],
        "#faf0d5",
        16,
      ).rotation.z = Math.PI / 2;
  const mail = station("contact", 3.8, 0.25);
  box(mail, [0.16, 1.55, 0.16], [0, 0.77, 0], "#425e59");
  box(mail, [0.8, 0.65, 0.95], [0, 1.8, 0], "#edb747", 0.2);
  box(mail, [0.5, 0.06, 0.035], [0, 1.84, 0.49], "#6c5938");
  box(mail, [0.055, 0.65, 0.05], [0.46, 2, 0], "#db633b");
  box(mail, [0.28, 0.2, 0.04], [0.57, 2.3, 0], "#db633b");
  box(island, [3.2, 3.5, 0.13], [-2.5, 1.95, -3.6], "#4a7165");
  sign(
    island,
    ["MAKE GOOD", "THINGS."],
    [-2.5, 2.95, -3.52],
    2.8,
    "#f4e7c3",
    "#4a7165",
  );
  for (let i = 0; i < 12; i++) {
    const x = -4.4 + i * 0.77;
    cylinder(island, 0.02, 0.025, 0.25, [x, 0.4, -3.25], "#738664", 5);
    sphere(island, 0.09, [x, 0.55, -3.25], i % 2 ? "#eab94b" : "#e98260");
  }
  sign(
    island,
    ["EST. STOCKHOLM / 59° N"],
    [0, -0.32, 4.015],
    3.8,
    "#f8e9d5",
    "#cd7459",
    8,
  );
  const ground = new T.Mesh(
    new T.PlaneGeometry(200, 200),
    new T.ShadowMaterial({ opacity: 0.12 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.4;
  ground.receiveShadow = true;
  scene.add(ground);
  const raycaster = new T.Raycaster();
  const pointer = new T.Vector2();
  let hovered: Stop | null = null;
  let down = { x: 0, y: 0 };
  let disposed = false;
  let frame = 0;
  let paused = false;
  function pick(e: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...objects.values()], true);
    if (!hits.length) return null;
    let object: T.Object3D | null = hits[0].object;
    while (object && !object.userData.stop) object = object.parent;
    return (object?.userData.stop as Stop) ?? null;
  }
  function move(e: PointerEvent) {
    const next = pick(e);
    if (next !== hovered) {
      hovered = next;
      onHover(next);
      renderer.domElement.style.cursor = next ? "pointer" : "grab";
      invalidate();
    }
  }
  function press(e: PointerEvent) {
    down = { x: e.clientX, y: e.clientY };
  }
  function release(e: PointerEvent) {
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 7) {
      const id = pick(e);
      if (id) onSelect(id);
    }
  }
  function leave() {
    hovered = null;
    onHover(null);
    invalidate();
  }
  renderer.domElement.addEventListener("pointermove", move);
  renderer.domElement.addEventListener("pointerdown", press);
  renderer.domElement.addEventListener("pointerup", release);
  renderer.domElement.addEventListener("pointerleave", leave);
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.fov = width < 640 ? 39 : 36;
    camera.updateProjectionMatrix();
    invalidate();
  });
  resize.observe(host);
  const clock = new T.Clock();
  function render() {
    if (disposed || paused || document.hidden) return;
    const t = clock.getElapsedTime();
    if (!reduced) {
      record.rotation.y = t * 0.6;
      board.position.y = 0.35 + Math.sin(t * 1.8) * 0.07;
      board.rotation.z = Math.sin(t * 1.8) * 0.06;
    }
    for (const [id, object] of objects) {
      const target = hovered === id ? 1.045 : 1;
      object.scale.setScalar(
        reduced ? target : T.MathUtils.lerp(object.scale.x, target, 0.12),
      );
    }
    controls.update();
    renderer.render(scene, camera);
    if (!reduced) frame = requestAnimationFrame(render);
  }
  function invalidate() {
    if (reduced) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    }
  }
  controls.addEventListener("change", invalidate);
  function visibility() {
    cancelAnimationFrame(frame);
    if (!document.hidden) render();
  }
  document.addEventListener("visibilitychange", visibility);
  render();
  return {
    pause(value: boolean) {
      paused = value;
      cancelAnimationFrame(frame);
      if (!paused) render();
    },
    night(value: boolean) {
      ambient.intensity = value ? 1.1 : 2.8;
      sun.intensity = value ? 1.2 : 4;
      sun.color.set(value ? "#9eb9ec" : "#ffeed3");
      blue.intensity = value ? 14 : 0;
      renderer.shadowMap.needsUpdate = true;
      invalidate();
    },
    reset() {
      camera.position.copy(home);
      controls.target.set(0, 0.7, 0);
      controls.update();
      invalidate();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      controls.removeEventListener("change", invalidate);
      controls.dispose();
      renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerdown", press);
      renderer.domElement.removeEventListener("pointerup", release);
      renderer.domElement.removeEventListener("pointerleave", leave);
      scene.traverse((object) => {
        if (object instanceof T.Mesh) {
          object.geometry.dispose();
          const list = Array.isArray(object.material)
            ? object.material
            : [object.material];
          list.forEach((m) => m.dispose());
        }
      });
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
