/**
 * Lazy PDF templates.
 *
 * Tool pages build `<XSummaryTemplate formState={…} />` elements on render and
 * hand them to ExportDialog / QuickExportButton. Importing the real template
 * modules statically pulled @react-pdf/renderer (~1.5 MB) into every tool
 * page's chunk, even though it is only needed at the moment of export.
 *
 * `lazyPdfTemplate` returns a stand-in component with the same props type.
 * Creating an element from it costs nothing; `resolvePdfTemplate` swaps it
 * for the real template (loading the module and the renderer on demand)
 * immediately before `pdf(element).toBlob()`.
 *
 * This module must never import @react-pdf/renderer.
 */

import { createElement, type ComponentType, type ReactElement } from "react";

type TemplateModule<P> = { default: ComponentType<P> };

export type LazyPdfTemplate<P> = ComponentType<P> & {
  loadPdfTemplate: () => Promise<ComponentType<P>>;
};

export function lazyPdfTemplate<P>(
  loader: () => Promise<TemplateModule<P>>,
): LazyPdfTemplate<P> {
  // Never mounted in the DOM: it only travels as a prop to the export UI.
  const Stub = (() => null) as unknown as LazyPdfTemplate<P>;
  Stub.loadPdfTemplate = () => loader().then((m) => m.default);
  return Stub;
}

function isLazy(type: unknown): type is LazyPdfTemplate<Record<string, unknown>> {
  return typeof type === "function" && "loadPdfTemplate" in type;
}

/** Replace a lazy template element with the real one. Non-lazy elements pass through. */
export async function resolvePdfTemplate(element: ReactElement): Promise<ReactElement> {
  if (!isLazy(element.type)) return element;
  const Real = await element.type.loadPdfTemplate();
  return createElement(Real, { ...(element.props as Record<string, unknown>), key: element.key });
}
