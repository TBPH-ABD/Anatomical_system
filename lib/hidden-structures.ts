import type {AnatomyModel} from '@/app/anatomy';

/** External genital structures are left out of this teaching build at the
 * request of the course. Meshes are named by their BodyParts3D identifier, so
 * the list is exact and reversible: empty it to restore them.
 *
 * FJ3132/FJ3133/FJ3134  corpus cavernosum, corpus spongiosum, glans penis
 * FJ3138/FJ3142         left and right testis
 * FJ3136/FJ3141         left and right epididymis
 * the rest              the dorsal arteries and veins of the penis, which would
 *                       otherwise be left hanging in empty space
 */
export const HIDDEN_MESHES = new Set([
  'FJ3132',
  'FJ3133',
  'FJ3134',
  'FJ3136',
  'FJ3138',
  'FJ3141',
  'FJ3142',
  'FJ2056',
  'FJ2208',
  'FJ3426',
  'FJ3637',
  'FJ3496',
  'FJ3497',
  'FJ3592',
  'FJ3593',
]);

/** Drops the hidden meshes and any concept left with nothing to show. The
 * source model file is never modified; this is a view over it. */
export function filterModel(model: AnatomyModel): AnatomyModel {
  if (!HIDDEN_MESHES.size) return model;
  const parts = model.parts.filter((part) => !HIDDEN_MESHES.has(part.id));
  if (parts.length === model.parts.length) return model;
  const kept = new Set(parts.map((part) => part.id));
  const concepts = model.concepts
    .map((concept) => ({...concept, elements: concept.elements.filter((id) => kept.has(id))}))
    .filter((concept) => concept.elements.length > 0);
  return {...model, parts, concepts};
}
