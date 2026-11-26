// Input: keyboard plus click-drag steering on the canvas.
// Keys: W/S or Up/Down pitch, A/D or Left/Right throttle, SPACE
// action, P pause, R restart, M mute, 1/2/3 pick a mission on the
// title screen, Enter start. Dragging up/down pitches, left/right
// throttles; the drag vector is read fresh every frame.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    pitch: 0,
    throttle: 0,
    actionPressed: false, // true only on the frame SPACE went down
    pausedPressed: false,
    restartPressed: false,
    mutePressed: false,
    startPressed: false,
    missionKey: null, // '1' | '2' | '3' on the frame it was pressed
    drag: { active: false, dx: 0, dy: 0 },
  };

  const down = (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    if (e.repeat) return;
    keys.add(k);
    if (k === ' ') state.actionPressed = true;
    if (k === 'p' || k === 'Escape') state.pausedPressed = true;
    if (k === 'r') state.restartPressed = true;
    if (k === 'm') state.mutePressed = true;
    if (k === 'Enter') state.startPressed = true;
    if (k === '1' || k === '2' || k === '3') state.missionKey = k;
  };
  const up = (e) => {
    keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  };

  let dragStart = null;
  const onPointerDown = (e) => {
    dragStart = { x: e.clientX, y: e.clientY };
    state.drag.active = true;
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragStart) return;
    state.drag.dx = e.clientX - dragStart.x;
    state.drag.dy = e.clientY - dragStart.y;
  };
  const onPointerUp = () => {
    dragStart = null;
    state.drag.active = false;
    state.drag.dx = 0;
    state.drag.dy = 0;
  };

  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  // Read the held keys into a control vector for this frame. The
  // drag overrides the keyboard pitch/throttle while it is active.
  function poll() {
    let pitch = 0;
    let throttle = 0;
    if (keys.has('w') || keys.has('ArrowUp')) pitch += 1;
    if (keys.has('s') || keys.has('ArrowDown')) pitch -= 1;
    if (keys.has('d') || keys.has('ArrowRight')) throttle += 1;
    if (keys.has('a') || keys.has('ArrowLeft')) throttle -= 1;
    if (state.drag.active) {
      pitch = Math.max(-1, Math.min(1, -state.drag.dy / 70));
      throttle = Math.max(-1, Math.min(1, state.drag.dx / 90));
    }
    return { pitch, throttle, action: state.actionPressed };
  }

  // Edge-triggered flags are consumed once per frame.
  function consumeEdges() {
    const edges = {
      action: state.actionPressed,
      paused: state.pausedPressed,
      restart: state.restartPressed,
      mute: state.mutePressed,
      start: state.startPressed,
      missionKey: state.missionKey,
    };
    state.actionPressed = false;
    state.pausedPressed = false;
    state.restartPressed = false;
    state.mutePressed = false;
    state.startPressed = false;
    state.missionKey = null;
    return edges;
  }

  return { poll, consumeEdges };
}
