"use client";

import { useEffect, useRef, useState } from "react";
import type { Mesh, MeshStandardMaterial, WebGLRenderer } from "three";

export type OrbitalMaterial = "chrome" | "clay" | "wire";

type OrbitalSceneProps = {
  material: OrbitalMaterial;
  exploded: boolean;
  paused: boolean;
  onReady?: () => void;
};

/** A small, self-contained instrument. Nothing is downloaded until it mounts. */
export default function OrbitalScene(props: OrbitalSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const invalidate = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );

  useEffect(() => {
    latest.current = props;
    invalidate.current?.();
  }, [props]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let released = false;
    let renderer: WebGLRenderer | undefined;
    const resources = new Set<{ dispose: () => void }>();
    const cleanupTasks: (() => void)[] = [];
    const own = <T extends { dispose: () => void }>(resource: T): T => {
      resources.add(resource);
      return resource;
    };
    function release(resource: { dispose: () => void }) {
      resources.delete(resource);
      resource.dispose();
    }
    function teardown() {
      if (released) return;
      released = true;
      invalidate.current = null;
      // One failed driver cleanup must not prevent the remaining resources releasing.
      const tasks = [
        ...cleanupTasks.reverse(),
        ...Array.from(resources)
          .reverse()
          .map((resource) => () => resource.dispose()),
        () => renderer?.dispose(),
        () => renderer?.forceContextLoss(),
        () => renderer?.domElement.remove(),
      ];
      tasks.forEach((cleanup) => {
        try {
          cleanup();
        } catch {
          /* Continue releasing the other resources. */
        }
      });
      resources.clear();
    }

    async function initialize() {
      try {
        const [THREE, { RoomEnvironment }] = await Promise.all([
          import("three"),
          import("three/addons/environments/RoomEnvironment.js"),
        ]);
        if (disposed || !element) return;

        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        const webgl = renderer;
        webgl.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
        webgl.setClearColor(0x11120f, 0);
        webgl.outputColorSpace = THREE.SRGBColorSpace;
        webgl.toneMapping = THREE.ACESFilmicToneMapping;
        webgl.toneMappingExposure = 1.05;
        webgl.domElement.setAttribute("aria-hidden", "true");
        webgl.domElement.style.cssText =
          "display:block;width:100%;height:100%;position:absolute;inset:0;";
        element.appendChild(webgl.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
        camera.position.set(0, 0.22, 10.3);
        camera.lookAt(0, 0, 0);
        const pmrem = own(new THREE.PMREMGenerator(webgl));
        const room = own(new RoomEnvironment());
        const environment = own(pmrem.fromScene(room, 0.035));
        scene.environment = environment.texture;
        release(room);
        release(pmrem);

        const sculpture = new THREE.Group();
        scene.add(sculpture);
        const chrome = own(
          new THREE.MeshStandardMaterial({
            color: 0xc9cdc7,
            metalness: 1,
            roughness: 0.19,
            envMapIntensity: 1.4,
          }),
        );
        const dark = own(
          new THREE.MeshStandardMaterial({
            color: 0x292c25,
            metalness: 0.9,
            roughness: 0.29,
            envMapIntensity: 1.2,
          }),
        );
        const orange = own(
          new THREE.MeshStandardMaterial({
            color: 0xff650f,
            metalness: 0.38,
            roughness: 0.28,
            emissive: 0xf44400,
            emissiveIntensity: 0.3,
          }),
        );
        const lightMetal = own(
          new THREE.MeshStandardMaterial({
            color: 0xe2e4cf,
            metalness: 0.84,
            roughness: 0.25,
          }),
        );
        const metalMeshes: Mesh[] = [];

        function ring(
          radius: number,
          tube: number,
          material: MeshStandardMaterial,
          parent: import("three").Object3D,
        ) {
          const mesh = new THREE.Mesh(
            own(new THREE.TorusGeometry(radius, tube, 12, 128)),
            material,
          );
          parent.add(mesh);
          if (material === chrome) metalMeshes.push(mesh);
          return mesh;
        }

        function collar(radius: number, width: number, depth: number) {
          const shape = new THREE.Shape();
          shape.absarc(0, 0, radius + width / 2, 0, Math.PI * 2, false);
          const hole = new THREE.Path();
          hole.absarc(0, 0, radius - width / 2, 0, Math.PI * 2, true);
          shape.holes.push(hole);
          const geometry = own(
            new THREE.ExtrudeGeometry(shape, {
              depth,
              bevelEnabled: true,
              bevelSegments: 3,
              steps: 1,
              bevelSize: 0.025,
              bevelThickness: 0.025,
              curveSegments: 100,
            }),
          );
          geometry.translate(0, 0, -depth / 2);
          return geometry;
        }

        const orbitalRings: import("three").Group[] = [];
        const configurations = [
          {
            radius: 2.18,
            x: 0.84,
            y: -0.47,
            z: 0.18,
            width: 0.19,
            depth: 0.19,
          },
          {
            radius: 1.77,
            x: -0.91,
            y: 0.35,
            z: -0.55,
            width: 0.18,
            depth: 0.16,
          },
          { radius: 1.33, x: 0.2, y: 1.05, z: 0.55, width: 0.16, depth: 0.19 },
        ];
        const markerGeometry = own(new THREE.BoxGeometry(0.022, 0.092, 0.013));
        const screwGeometry = own(
          new THREE.CylinderGeometry(0.033, 0.033, 0.018, 12),
        );
        configurations.forEach((config, index) => {
          const group = new THREE.Group();
          group.rotation.set(config.x, config.y, config.z);
          sculpture.add(group);
          orbitalRings.push(group);
          const body = new THREE.Mesh(
            collar(config.radius, config.width, config.depth),
            chrome,
          );
          group.add(body);
          metalMeshes.push(body);
          const backRail = ring(config.radius, 0.035, dark, group);
          backRail.position.z = -config.depth * 0.62;
          const faceRail = ring(
            config.radius + config.width * 0.49,
            0.012,
            lightMetal,
            group,
          );
          faceRail.position.z = config.depth * 0.63;
          const markers = own(
            new THREE.InstancedMesh(markerGeometry, lightMetal, 96),
          );
          const marker = new THREE.Object3D();
          for (let tick = 0; tick < 96; tick++) {
            const angle = (tick / 96) * Math.PI * 2;
            marker.position.set(
              Math.sin(angle) * config.radius,
              Math.cos(angle) * config.radius,
              config.depth / 2 + 0.027,
            );
            marker.rotation.z = -angle;
            marker.scale.y = tick % 4 === 0 ? 1 : 0.42;
            marker.updateMatrix();
            markers.setMatrixAt(tick, marker.matrix);
            markers.setColorAt(
              tick,
              new THREE.Color(tick % 12 === 0 ? 0xff650f : 0x282d23),
            );
          }
          group.add(markers);
          const rivets = own(
            new THREE.InstancedMesh(screwGeometry, lightMetal, 8),
          );
          const rivet = new THREE.Object3D();
          for (let screw = 0; screw < 8; screw++) {
            const angle = (screw / 8) * Math.PI * 2 + 0.16;
            rivet.rotation.x = Math.PI / 2;
            rivet.position.set(
              Math.sin(angle) * config.radius,
              Math.cos(angle) * config.radius,
              config.depth / 2 + 0.027,
            );
            rivet.updateMatrix();
            rivets.setMatrixAt(screw, rivet.matrix);
          }
          group.add(rivets);
          // The orange bearing blocks break the perfect circles into engineered parts.
          for (let bearing = 0; bearing < 2; bearing++) {
            const angle = bearing * Math.PI + 0.37 + index;
            const block = new THREE.Mesh(
              own(new THREE.BoxGeometry(0.29, 0.17, config.depth + 0.09)),
              orange,
            );
            block.position.set(
              Math.cos(angle) * config.radius,
              Math.sin(angle) * config.radius,
              0,
            );
            block.rotation.z = angle;
            group.add(block);
            const pin = new THREE.Mesh(
              own(new THREE.CylinderGeometry(0.072, 0.072, 0.32, 20)),
              dark,
            );
            pin.rotation.x = Math.PI / 2;
            pin.position.copy(block.position);
            group.add(pin);
          }
        });

        const core = new THREE.Group();
        sculpture.add(core);
        const coreMaterial = own(
          new THREE.MeshPhysicalMaterial({
            color: 0xff640b,
            metalness: 0.45,
            roughness: 0.22,
            emissive: 0xff3000,
            emissiveIntensity: 0.18,
            envMapIntensity: 0.55,
            clearcoat: 1,
            clearcoatRoughness: 0.12,
          }),
        );
        const heart = new THREE.Mesh(
          own(new THREE.IcosahedronGeometry(0.63, 3)),
          coreMaterial,
        );
        core.add(heart);
        const equator = ring(0.647, 0.034, dark, core);
        equator.rotation.x = Math.PI / 2;
        const coreMeridian = ring(0.655, 0.014, lightMetal, core);
        coreMeridian.rotation.y = 0.3;
        const capGeometry = own(
          new THREE.CylinderGeometry(0.15, 0.23, 0.12, 32),
        );
        [-1, 1].forEach((direction) => {
          const cap = new THREE.Mesh(capGeometry, chrome);
          cap.position.y = direction * 0.62;
          if (direction < 0) cap.rotation.z = Math.PI;
          core.add(cap);
          metalMeshes.push(cap);
        });

        const satellites = new THREE.Group();
        sculpture.add(satellites);
        const satellitePositions = [
          [-2.27, 0.77, 0.65],
          [1.62, -1.42, 0.75],
          [0.65, 2.2, -0.4],
        ];
        satellitePositions.forEach(([x, y, z], index) => {
          const group = new THREE.Group();
          group.position.set(x, y, z);
          const sphere = new THREE.Mesh(
            own(new THREE.SphereGeometry(index === 0 ? 0.19 : 0.12, 24, 16)),
            chrome,
          );
          group.add(sphere);
          metalMeshes.push(sphere);
          const seam = ring(index === 0 ? 0.19 : 0.12, 0.011, orange, group);
          seam.rotation.x = 1.2;
          satellites.add(group);
        });

        scene.add(new THREE.HemisphereLight(0xf5f2df, 0x1f251b, 1.4));
        const key = new THREE.DirectionalLight(0xffffff, 3);
        key.position.set(-3, 5, 4);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xff8b44, 4);
        rim.position.set(4, -1, -2);
        scene.add(rim);
        const coreLight = new THREE.PointLight(0xff6200, 8, 4, 2);
        coreLight.position.set(0, 0, 0.3);
        scene.add(coreLight);

        const clay = own(
          new THREE.MeshStandardMaterial({
            color: 0xe6ddc6,
            metalness: 0.05,
            roughness: 0.76,
          }),
        );
        const wire = own(
          new THREE.MeshStandardMaterial({
            color: 0xcdd5bf,
            metalness: 0.4,
            roughness: 0.45,
            wireframe: true,
          }),
        );
        const motionPreference = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        );
        let reducedMotion = motionPreference.matches;
        let visible = true;
        let frame = 0;
        cleanupTasks.push(() => cancelAnimationFrame(frame));
        let lastTime = 0;
        let rotationX = -0.13;
        let rotationY = -0.24;
        let currentX = rotationX;
        let currentY = rotationY;
        let explosion = latest.current.exploded ? 1 : 0;
        let appliedMaterial: OrbitalMaterial | null = null;
        let pointer: { id: number; x: number; y: number } | null = null;

        function schedule() {
          if (!disposed && !released && !frame && visible && !document.hidden)
            frame = requestAnimationFrame(render);
        }
        function render(time: number) {
          frame = 0;
          if (disposed || released || !visible || document.hidden) return;
          const delta = Math.min((time - (lastTime || time)) / 1000, 0.04);
          lastTime = time;
          const state = latest.current;
          const autoplay = !state.paused && !reducedMotion && !pointer;
          if (autoplay) rotationY += delta * 0.075;
          const easing = reducedMotion ? 1 : Math.min(1, delta * 9 + 0.01);
          currentX += (rotationX - currentX) * easing;
          currentY += (rotationY - currentY) * easing;
          explosion += ((state.exploded ? 1 : 0) - explosion) * easing;
          if (Math.abs(rotationX - currentX) < 0.001) currentX = rotationX;
          if (Math.abs(rotationY - currentY) < 0.001) currentY = rotationY;
          if (Math.abs((state.exploded ? 1 : 0) - explosion) < 0.001)
            explosion = state.exploded ? 1 : 0;
          sculpture.rotation.set(currentX, currentY, -0.075);
          orbitalRings.forEach((group, index) => {
            group.position.y = explosion * (1 - index) * 0.64;
            group.position.z = explosion * (index - 1) * 0.47;
            group.scale.setScalar(1 + explosion * index * 0.07);
          });
          satellites.scale.setScalar(1 + explosion * 0.15);
          if (appliedMaterial !== state.material) {
            const material =
              state.material === "clay"
                ? clay
                : state.material === "wire"
                  ? wire
                  : chrome;
            metalMeshes.forEach((mesh) => {
              mesh.material = material;
            });
            appliedMaterial = state.material;
          }
          webgl.render(scene, camera);
          const moving =
            Math.abs(rotationX - currentX) +
              Math.abs(rotationY - currentY) +
              Math.abs((state.exploded ? 1 : 0) - explosion) >
            0.001;
          if (autoplay || moving) schedule();
        }
        invalidate.current = schedule;

        function resize() {
          if (!element) return;
          const { width, height } = element.getBoundingClientRect();
          if (!width || !height) return;
          webgl.setSize(width, height, false);
          camera.aspect = width / height;
          camera.position.z = camera.aspect < 0.85 ? 11.9 : 10.3;
          camera.updateProjectionMatrix();
          schedule();
        }
        const resizeObserver = new ResizeObserver(resize);
        cleanupTasks.push(() => resizeObserver.disconnect());
        resizeObserver.observe(element);
        const intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            if (!visible) {
              cancelAnimationFrame(frame);
              frame = 0;
              lastTime = 0;
            } else schedule();
          },
          { rootMargin: "80px" },
        );
        cleanupTasks.push(() => intersectionObserver.disconnect());
        intersectionObserver.observe(element);
        function visibilityChanged() {
          if (document.hidden) {
            cancelAnimationFrame(frame);
            frame = 0;
            lastTime = 0;
          } else schedule();
        }
        function motionChanged(event: MediaQueryListEvent) {
          reducedMotion = event.matches;
          schedule();
        }
        function pointerDown(event: PointerEvent) {
          if (event.button !== 0 || pointer) return;
          pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
          element?.setPointerCapture(event.pointerId);
          if (element) element.style.cursor = "grabbing";
        }
        function pointerMove(event: PointerEvent) {
          if (!pointer || pointer.id !== event.pointerId) return;
          rotationY += (event.clientX - pointer.x) * 0.009;
          rotationX = Math.max(
            -1.3,
            Math.min(1.3, rotationX + (event.clientY - pointer.y) * 0.007),
          );
          pointer.x = event.clientX;
          pointer.y = event.clientY;
          schedule();
        }
        function pointerUp(event: PointerEvent) {
          if (pointer?.id !== event.pointerId) return;
          if (element?.hasPointerCapture(event.pointerId))
            element.releasePointerCapture(event.pointerId);
          pointer = null;
          if (element) element.style.cursor = "grab";
          schedule();
        }
        function keyDown(event: KeyboardEvent) {
          if (
            ![
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "Home",
            ].includes(event.key)
          )
            return;
          event.preventDefault();
          if (event.key === "ArrowLeft") rotationY -= 0.2;
          if (event.key === "ArrowRight") rotationY += 0.2;
          if (event.key === "ArrowUp")
            rotationX = Math.max(-1.3, rotationX - 0.2);
          if (event.key === "ArrowDown")
            rotationX = Math.min(1.3, rotationX + 0.2);
          if (event.key === "Home") {
            rotationX = -0.13;
            rotationY = -0.24;
          }
          currentX = rotationX;
          currentY = rotationY;
          schedule();
        }
        function contextLost(event: Event) {
          event.preventDefault();
          setStatus("fallback");
          teardown();
        }
        const events = new AbortController();
        cleanupTasks.push(() => events.abort());
        const eventOptions = { signal: events.signal };
        webgl.domElement.addEventListener(
          "webglcontextlost",
          contextLost,
          eventOptions,
        );
        element.addEventListener("pointerdown", pointerDown, eventOptions);
        element.addEventListener("pointermove", pointerMove, eventOptions);
        element.addEventListener("pointerup", pointerUp, eventOptions);
        element.addEventListener("pointercancel", pointerUp, eventOptions);
        element.addEventListener("lostpointercapture", pointerUp, eventOptions);
        element.addEventListener("keydown", keyDown, eventOptions);
        document.addEventListener(
          "visibilitychange",
          visibilityChanged,
          eventOptions,
        );
        motionPreference.addEventListener(
          "change",
          motionChanged,
          eventOptions,
        );
        cleanupTasks.push(() => {
          if (pointer && element.hasPointerCapture(pointer.id))
            element.releasePointerCapture(pointer.id);
          element.style.cursor = "grab";
        });
        resize();
        setStatus("ready");
        latest.current.onReady?.();
      } catch {
        teardown();
        if (!disposed) setStatus("fallback");
      }
    }
    void initialize();
    return () => {
      disposed = true;
      teardown();
    };
  }, []);

  return (
    <div
      ref={host}
      className="orbital-scene"
      role="group"
      aria-label="Interactive orbital sculpture. Drag or use arrow keys to rotate. Press Home to reset."
      tabIndex={0}
      data-scene-status={status}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 300,
        touchAction: "pan-y",
        cursor: "grab",
        outlineOffset: -4,
      }}
    >
      <div className="orbital-halo" aria-hidden="true" />
      {status !== "ready" && (
        <div className="orbital-fallback" aria-hidden="true">
          <i />
          <i />
          <i />
          <b />
        </div>
      )}
      <span className="orbital-sr-only" aria-live="polite">
        {status === "fallback"
          ? "Static sculpture preview. Interactive 3D is unavailable in this browser."
          : ""}
      </span>
      <style jsx>{`
        .orbital-halo {
          position: absolute;
          inset: 14%;
          border-radius: 50%;
          background: radial-gradient(
            ellipse,
            rgba(227, 95, 24, 0.085),
            transparent 67%
          );
          pointer-events: none;
        }
        .orbital-fallback {
          position: absolute;
          width: 67%;
          aspect-ratio: 1;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          perspective: 800px;
        }
        .orbital-fallback i {
          position: absolute;
          inset: 0;
          border: 17px solid #adb0a6;
          border-top-color: #f3f0de;
          border-bottom-color: #44483e;
          border-radius: 50%;
          transform: rotateX(53deg) rotateY(-20deg) rotateZ(-25deg);
          box-shadow:
            inset 0 0 0 2px #1c2119,
            0 0 0 2px #494d42;
        }
        .orbital-fallback i:nth-child(2) {
          inset: 12%;
          transform: rotateX(-35deg) rotateY(45deg) rotateZ(20deg);
          border-width: 13px;
        }
        .orbital-fallback i:nth-child(3) {
          inset: 24%;
          transform: rotateX(20deg) rotateY(55deg) rotateZ(-30deg);
          border-width: 11px;
        }
        .orbital-fallback b {
          position: absolute;
          inset: 38%;
          border-radius: 50%;
          background: radial-gradient(
            circle at 30% 25%,
            #ffb061,
            #ff5c0a 45%,
            #81340b
          );
          box-shadow: 0 0 55px #f65c1026;
        }
        .orbital-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  );
}
