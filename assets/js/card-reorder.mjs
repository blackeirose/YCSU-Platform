import { movedOrder, orderPayload } from './registry-order.mjs';

const INTERACTIVE = 'a,button,summary,details,input,select,textarea,label,[contenteditable],[role="button"],[role="link"]';
export function createCardReorder({ grid, status, save }) {
  let products = [], allowed = false, busy = false, gesture = null, frame = 0, suppressClick = false;
  const ids = () => [...grid.querySelectorAll('.card')].map(c => c.dataset.productId);
  const announce = text => { status.textContent = text; };
  const apply = order => {
    const cards = new Map([...grid.children].map(c => [c.dataset.productId, c]));
    order.forEach(id => { if (cards.has(id)) grid.append(cards.get(id)); });
  };
  function handles() {
    grid.classList.toggle('can-reorder', allowed && !busy);
    grid.querySelectorAll('.reorder-handle').forEach(b => b.remove());
    if (!allowed || busy) return;
    grid.querySelectorAll('.card').forEach(card => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'reorder-handle'; button.textContent = '⠿';
      button.setAttribute('aria-label', `Reorder ${card.querySelector('h2').textContent}`);
      button.title = 'Drag to reorder with a mouse; hold on touch. Arrow keys move one position; Home/End move to first/last.';
      // A dedicated handle is the only interactive element permitted to initiate drag.
      button.addEventListener('keydown', async event => {
        if (!allowed || busy || gesture) return;
        const order = ids(), index = order.indexOf(card.dataset.productId);
        const offsets = { ArrowUp: index-1, ArrowLeft: index-1, ArrowDown: index+1, ArrowRight: index+1, Home: 0, End: order.length-1 };
        if (!(event.key in offsets)) return;
        event.preventDefault();
        await persist(movedOrder(order, card.dataset.productId, offsets[event.key]), order, card.dataset.productId);
      });
      card.append(button);
    });
  }
  async function persist(next, previous, focusId) {
    if (next.join() === previous.join()) { announce('Order unchanged.'); return; }
    busy = true; handles(); apply(next); announce('Saving order…');
    try {
      const result = await save(orderPayload(products, next));
      if (!Array.isArray(result.order) || result.order.length !== products.length ||
          new Set(result.order.map(p => p.id)).size !== products.length ||
          result.order.some(p => !next.includes(p.id) || !Number.isInteger(p.sortOrder))) throw new Error('Invalid save response');
      const ranks = new Map(result.order.map(p => [p.id, p.sortOrder]));
      products = products.map(p => ({ ...p, sortOrder: ranks.get(p.id) }));
      announce('Order saved.');
    } catch {
      apply(previous); announce('Could not save. Previous order restored. Reload before trying again.');
    } finally {
      busy = false; handles();
      if (focusId) grid.querySelector(`[data-product-id="${focusId}"] .reorder-handle`)?.focus({preventScroll:true});
    }
  }
  function clear(commit = false) {
    if (!gesture) return;
    const g = gesture; gesture = null;
    clearTimeout(g.timer); cancelAnimationFrame(frame);
    g.card.classList.remove('reorder-placeholder'); g.ghost?.remove();
    document.body.classList.remove('is-reordering');
    if (grid.hasPointerCapture?.(g.pointerId)) grid.releasePointerCapture(g.pointerId);
    if (!g.active) return;
    suppressClick = true; setTimeout(() => { suppressClick = false; }, 400);
    if (commit && allowed) void persist(ids(), g.before);
    else { apply(g.before); announce('Reordering cancelled.'); }
  }
  function position() {
    const g = gesture;
    if (!g?.active) return;
    g.ghost.style.transform = `translate(${g.x-g.offsetX}px, ${g.y-g.offsetY}px) scale(1.015)`;
    const under = document.elementFromPoint(g.x, g.y)?.closest('.card');
    if (under && under !== g.card && grid.contains(under)) {
      const r = under.getBoundingClientRect();
      const multiColumn = getComputedStyle(grid).gridTemplateColumns.split(' ').length > 1;
      const after = multiColumn ? g.x > r.left+r.width/2 : g.y > r.top+r.height/2;
      grid.insertBefore(g.card, after ? under.nextSibling : under);
    }
    // Keep tall mobile cards movable across rows without fighting native scrolling.
    const edge = 80;
    const delta = g.y < edge ? -Math.ceil((edge-g.y)/6) : g.y > innerHeight-edge ? Math.ceil((g.y-innerHeight+edge)/6) : 0;
    if (delta) window.scrollBy(0, delta);
    frame = requestAnimationFrame(position);
  }
  function start() {
    const g = gesture;
    if (!g || !allowed || busy) return clear();
    const rect = g.card.getBoundingClientRect();
    g.active = true; g.before = ids(); g.offsetX = g.startX-rect.left; g.offsetY = g.startY-rect.top;
    g.ghost = g.card.cloneNode(true); g.ghost.classList.add('reorder-ghost');
    g.ghost.setAttribute('aria-hidden','true'); g.ghost.inert = true;
    g.ghost.style.width = `${rect.width}px`; g.ghost.style.height = `${rect.height}px`;
    g.ghost.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
    document.body.append(g.ghost); g.card.classList.add('reorder-placeholder');
    document.body.classList.add('is-reordering');
    grid.setPointerCapture(g.pointerId); announce('Reordering… Release to save; Escape to cancel.');
    position();
  }
  grid.addEventListener('pointerdown', event => {
    if (gesture) { clear(); return; }
    if (!allowed || busy || !event.isPrimary || event.button !== 0) return;
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest('.card');
    if (!card || (target.closest(INTERACTIVE) && !target.closest('.reorder-handle'))) return;
    const mouse = event.pointerType === 'mouse';
    const directGrip = mouse && !!target.closest('.reorder-handle');
    // Prevent mouse text selection/native dragging before the hold completes.
    // Touch keeps native scrolling until a long press actually activates reorder.
    if (mouse) { event.preventDefault(); if (directGrip) target.closest('.reorder-handle').focus({preventScroll:true}); }
    gesture = { card, directGrip, pointerId:event.pointerId, x:event.clientX, y:event.clientY, startX:event.clientX, startY:event.clientY, active:false };
    gesture.timer = setTimeout(start, 500);
  });
  window.addEventListener('pointermove', event => {
    const g = gesture; if (!g || event.pointerId !== g.pointerId) return;
    g.x = event.clientX; g.y = event.clientY;
    const distance = Math.hypot(g.x-g.startX,g.y-g.startY);
    if (!g.active && g.directGrip && distance >= 4) { clearTimeout(g.timer); start(); }
    else if (!g.active && distance > 8) clear();
    if (gesture?.active) event.preventDefault();
  }, {passive:false});
  // This listener must be registered before the gesture (including on iOS).
  grid.addEventListener('touchmove', event => { if (gesture?.active) event.preventDefault(); }, {passive:false});
  grid.addEventListener('dragstart', event => { if (gesture) event.preventDefault(); });
  grid.addEventListener('touchstart', event => { if (event.touches.length > 1) clear(); }, {passive:true});
  window.addEventListener('pointerup', event => {
    if (event.pointerId !== gesture?.pointerId) return;
    if (gesture.active) {
      // The final movement may arrive between animation frames. Commit the actual
      // release position instead of cancelling its pending hit test.
      gesture.x = event.clientX; gesture.y = event.clientY;
      cancelAnimationFrame(frame); position();
    }
    clear(true);
  });
  window.addEventListener('pointercancel', () => clear());
  grid.addEventListener('lostpointercapture', event => {
    if (event.target === grid && event.pointerId === gesture?.pointerId) clear();
  });
  window.addEventListener('blur', () => clear());
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  window.addEventListener('keydown', event => { if (event.key === 'Escape') clear(); });
  grid.addEventListener('contextmenu', event => {
    if (gesture && !(event.target.closest(INTERACTIVE) && !event.target.closest('.reorder-handle'))) event.preventDefault();
  });
  grid.addEventListener('click', event => { if (suppressClick) {event.preventDefault();event.stopImmediatePropagation();} }, true);
  return {
    setProducts(value) { clear(); products = value.slice(); handles(); },
    setAllowed(value) { if (!value) clear(); allowed = !!value; handles(); },
  };
}
