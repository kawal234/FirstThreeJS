## GRND Shaker — Three.js + GSAP Scroll Experience

Interactive product hero built with Three.js, GSAP (ScrollTrigger/SplitText), and Vite. The page pins a section and animates text while a GLB model of the shaker spins on the right.

### Prerequisites
- Node.js 18+ recommended

### Install
```bash
npm install
npm install three lenis @types/three gsap
```

### Run dev server
```bash
npx vite
```
- Default port is `5173` (Vite will pick another if busy). Open the printed URL.

### Build (optional)
```bash
npx vite build
```

### Project structure
- `index.html` — root document, mounts styles and `script.js`.
- `style.css` — layout/typography; pins product section and positions the model.
- `script.js` — Three.js scene, GLB loader, GSAP scroll/text animations, smooth scrolling (Lenis).
- `shaker.glb` — product model loaded via `GLTFLoader`.

### Assets
- Model path expected at `/shaker.glb` (already in project root).
- Ionicons pulled from CDN in `index.html`.

### Notes / troubleshooting
- If you see “Failed to resolve import”, ensure dependencies are installed (`three`, `lenis`, `gsap`).
- For prod deploys, host the built `dist` folder or configure Vite as needed for your environment.

