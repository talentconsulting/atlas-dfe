// Shared Cytoscape helpers: mounting a diagram, layout positions, selection, hover tooltips and zoom controls.
import { $ } from './dom.js';
import { state } from './state.js';

export function ringLayout(group, center, radiusX, radiusY, angleOffset = 0) {
  return group.map((dependency, index) => {
    const angle = (Math.PI * 2 * index / group.length) - Math.PI / 2 + angleOffset;
    return { ...dependency, x: center.x + Math.cos(angle) * radiusX, y: center.y + Math.sin(angle) * radiusY };
  });
}

export function positionFor(positions, id, computed) {
  if (!positions.has(id)) positions.set(id, { x: computed.x, y: computed.y });
  return positions.get(id);
}

export function destroyCy() {
  if (state.cy) {
    try { state.cy.destroy(); } catch { /* already gone */ }
    state.cy = null;
  }
}

export const CY_STYLE = [
  { selector: 'node', style: { 'background-opacity': 0, 'border-width': 0, 'label': '', 'shape': 'round-rectangle', 'width': 'data(width)', 'height': 'data(height)' } },
  { selector: 'node:parent', style: {
      'background-color': '#dce8ff', 'background-opacity': 0.04,
      'border-width': 1.5, 'border-style': 'dashed', 'border-color': '#5a6690', 'border-opacity': 1,
      'label': 'data(label)', 'color': '#9ba7cc', 'text-valign': 'top', 'text-halign': 'left',
      'font-size': 11, 'text-margin-y': -10, 'text-margin-x': 10, 'padding': '46px'
  } },
  { selector: 'edge', style: {
      'width': 2, 'line-color': '#4a5f9e', 'target-arrow-color': '#4a5f9e', 'target-arrow-shape': 'triangle',
      'arrow-scale': 1.1, 'curve-style': 'bezier', 'text-rotation': 'autorotate',
      'label': 'data(label)', 'font-size': 10, 'color': '#9ba7cc',
      'text-background-color': '#000a2b', 'text-background-opacity': 0.9, 'text-background-padding': '3px', 'text-background-shape': 'roundrectangle'
  } },
  { selector: 'edge.inbound', style: { 'line-color': '#95b9ff', 'target-arrow-color': '#95b9ff' } },
  { selector: 'edge.jumpable', style: { 'line-style': 'solid', 'width': 2.5 } },
  { selector: 'edge.returning', style: { 'line-style': 'dashed', 'width': 1.5 } }
];

export function mountCy({ container, elements, layout, htmlLabels, onTapNode, onTapEdge, onDragFree }) {
  destroyCy();
  const cy = cytoscape({ container, elements, style: CY_STYLE, layout, wheelSensitivity: 0.25, minZoom: 0.15, maxZoom: 3 });
  if (htmlLabels) cy.nodeHtmlLabel(htmlLabels);
  if (onTapNode) cy.on('tap', 'node', (event) => { if (!event.target.isParent()) onTapNode(event.target); });
  if (onTapEdge) cy.on('tap', 'edge', (event) => onTapEdge(event.target));
  if (onDragFree) cy.on('dragfree', 'node', (event) => onDragFree(event.target));
  state.cy = cy;
  return cy;
}

export function markCySelection(containerEl, selectedId) {
  containerEl?.querySelectorAll('[data-node-id]').forEach((el) => {
    el.classList.toggle('selected', el.dataset.nodeId === selectedId);
  });
}

// Detail panels render below a (often tall) diagram, so clicking a node can update content
// that's already scrolled off screen. `block: 'nearest'` only moves the page the minimum
// needed to bring it into view — a no-op if it's already visible, never jarring.
export function scrollDetailIntoView(elementId) {
  document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function wireNodeHoverTooltip(cy, container, buildContent) {
  if (!cy || !container) return;
  let tooltip = null;
  let hideTimer = null;

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.className = 'node-tooltip';
    tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    tooltip.addEventListener('mouseleave', scheduleHide);
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function positionTooltip(node) {
    const rect = container.getBoundingClientRect();
    const pos = node.renderedPosition();
    const halfHeight = (node.renderedHeight ? node.renderedHeight() : 48) / 2;
    const spaceAbove = rect.top + pos.y - halfHeight;
    tooltip.style.left = `${rect.left + pos.x}px`;
    if (spaceAbove < 160) {
      tooltip.style.top = `${rect.top + pos.y + halfHeight + 10}px`;
      tooltip.style.transform = 'translate(-50%, 0)';
    } else {
      tooltip.style.top = `${spaceAbove - 10}px`;
      tooltip.style.transform = 'translate(-50%, -100%)';
    }
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (tooltip) tooltip.style.display = 'none'; }, 150);
  }

  cy.on('mouseover', 'node', (event) => {
    const node = event.target;
    if (node.isParent()) return;
    const html = buildContent(node);
    if (!html) return;
    clearTimeout(hideTimer);
    ensureTooltip().innerHTML = html;
    positionTooltip(node);
    tooltip.style.display = 'block';
  });
  cy.on('mouseout', 'node', scheduleHide);
  cy.on('pan zoom drag', () => { if (tooltip) tooltip.style.display = 'none'; });
  cy.on('destroy', () => { tooltip?.remove(); tooltip = null; });
  // Cytoscape's synthetic node mouseout doesn't reliably fire when the pointer leaves the
  // canvas entirely (only when moving to another node or empty canvas space), so back it
  // with a native DOM listener on the container itself.
  container.addEventListener('mouseleave', scheduleHide);
}

export function diagramControlsHtml() {
  return `<button id="auto-arrange" class="plain-button" type="button">Auto arrange</button><div class="diagram-zoom" role="group" aria-label="Diagram zoom"><button id="zoom-out" type="button" aria-label="Zoom out">−</button><button id="zoom-fit" type="button">Fit</button><button id="zoom-in" type="button" aria-label="Zoom in">+</button></div>`;
}

export function wireDiagramControls(onAutoArrange) {
  const zoomOut = $('#zoom-out'), zoomIn = $('#zoom-in'), zoomFit = $('#zoom-fit'), autoArrange = $('#auto-arrange');
  if (zoomOut) zoomOut.onclick = () => { const cy = state.cy; if (cy) cy.zoom({ level: Math.max(cy.minZoom(), cy.zoom() / 1.25), renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }); };
  if (zoomIn) zoomIn.onclick = () => { const cy = state.cy; if (cy) cy.zoom({ level: Math.min(cy.maxZoom(), cy.zoom() * 1.25), renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }); };
  if (zoomFit) zoomFit.onclick = () => { state.cy?.fit(undefined, 40); };
  if (autoArrange) autoArrange.onclick = () => onAutoArrange();
}
