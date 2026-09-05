import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PALETTE = ['#c7f300', '#ff2ea6', '#2ee6ff'];

function makeSprite(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

// Ambient WebGL backdrop for the login screen — the one moment in this
// operational tool where a bit of visual flair earns its place. Every other
// screen stays flat and dense since staff live in those for hours.
export function LoginScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const sprite = makeSprite();
    const count = 220;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = PALETTE.map((hex) => new THREE.Color(hex));
    for (let i = 0; i < count; i++) {
      const r = 2.5 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi) - 3;
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particles = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({
        size: 0.16,
        map: sprite,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(particles);

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.7, 0.14, 140, 14, 2, 3),
      new THREE.MeshBasicMaterial({ color: 0xf4b93c, wireframe: true, transparent: true, opacity: 0.25 }),
    );
    scene.add(knot);

    function resize() {
      const el = canvas!.parentElement;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    let mouseX = 0;
    let mouseY = 0;
    function onMove(e: PointerEvent) {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    }
    window.addEventListener('pointermove', onMove);

    let running = true;
    function onVisibility() {
      running = document.visibilityState === 'visible';
    }
    document.addEventListener('visibilitychange', onVisibility);

    const clock = new THREE.Clock();
    let frame: number;
    function animate() {
      frame = requestAnimationFrame(animate);
      if (!running) return;
      const t = clock.getElapsedTime();
      particles.rotation.y = t * 0.04;
      particles.rotation.x = t * 0.015;
      knot.rotation.x = t * 0.13;
      knot.rotation.y = t * 0.09;
      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
      particleGeo.dispose();
      knot.geometry.dispose();
      (knot.material as THREE.Material).dispose();
      sprite.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="login-scene" aria-hidden="true" />;
}
