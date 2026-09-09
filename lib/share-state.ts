import type {SceneState, SystemId, View} from '@/app/anatomy';

/** The camera pose the scene reports and a shared link restores. */
export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export interface ShareState {
  visible: SystemId[];
  selected: string[];
  isolate: boolean;
  explode: number;
  view: View;
  concept?: string;
  camera?: CameraPose;
}

const VIEWS: View[] = ['three-quarter', 'front', 'back', 'side'];
const round = (value: number) => Math.round(value * 1000) / 1000;

/** A short, readable query string — no base64, so a shared link stays legible. */
export function encodeShareState(state: ShareState): string {
  const params = new URLSearchParams();
  if (state.visible.length) params.set('sys', state.visible.join('.'));
  if (state.concept) params.set('c', state.concept);
  if (state.selected.length) params.set('sel', state.selected.join('.'));
  if (state.isolate) params.set('iso', '1');
  if (state.explode > 0.001) params.set('x', String(round(state.explode)));
  if (state.view !== 'three-quarter') params.set('v', state.view);
  if (state.camera) {
    // Coordinates are decimals, so they cannot share the '.' list separator.
    params.set('cam', [...state.camera.position, ...state.camera.target].map(round).join('_'));
  }
  return params.toString();
}

export function decodeShareState(search: string): Partial<ShareState> | null {
  const params = new URLSearchParams(search);
  if (![...params.keys()].some((key) => ['sys', 'sel', 'c', 'iso', 'x', 'v', 'cam'].includes(key))) return null;
  const state: Partial<ShareState> = {};
  const systems = params.get('sys');
  if (systems) state.visible = systems.split('.').filter(Boolean) as SystemId[];
  const selected = params.get('sel');
  if (selected) state.selected = selected.split('.').filter(Boolean);
  const concept = params.get('c');
  if (concept) state.concept = concept;
  state.isolate = params.get('iso') === '1';
  const explode = Number(params.get('x'));
  if (Number.isFinite(explode) && explode > 0) state.explode = Math.min(1, explode);
  const view = params.get('v');
  if (view && VIEWS.includes(view as View)) state.view = view as View;
  const camera = params.get('cam')?.split('_').map(Number);
  // Six finite numbers or nothing: a malformed camera must not break the scene.
  if (camera?.length === 6 && camera.every(Number.isFinite)) {
    state.camera = {position: [camera[0], camera[1], camera[2]], target: [camera[3], camera[4], camera[5]]};
  }
  return state;
}

export function shareUrl(state: ShareState, locale: string): string {
  const query = encodeShareState(state);
  const url = new URL(location.href);
  url.search = query ? `${query}&lang=${locale}` : `lang=${locale}`;
  url.hash = '';
  return url.toString();
}

/** Merge a decoded link into the scene state without losing defaults. */
export function applyShareState(base: SceneState, share: Partial<ShareState>): SceneState {
  return {
    ...base,
    visible: share.visible ?? base.visible,
    selected: share.selected ?? base.selected,
    isolate: share.isolate ?? base.isolate,
    explode: share.explode ?? base.explode,
    view: share.view ?? base.view,
  };
}
