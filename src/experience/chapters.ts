import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export type ChapterStatus = "live" | "in-progress";

export interface Chapter {
  id: string;
  index: string;
  title: string;
  /** French subtitle shown in the navigation. */
  label: string;
  status: ChapterStatus;
  /** Scroll length of the chapter, in viewport heights. */
  length: number;
  Scene?: LazyExoticComponent<ComponentType>;
}

/**
 * Chapter registry. To add a chapter: add an entry here and a folder in
 * src/scenes/. Scenes are lazy-loaded so each one ships as its own chunk.
 */
export const chapters: Chapter[] = [
  {
    id: "beginning",
    index: "01",
    title: "The Beginning",
    label: "Le commencement",
    status: "live",
    length: 7,
    Scene: lazy(() => import("@/scenes/01-beginning/BeginningScene")),
  },
  {
    id: "inspiration",
    index: "02",
    title: "The Inspiration",
    label: "L'inspiration",
    status: "live",
    length: 8,
    Scene: lazy(() => import("@/scenes/02-inspiration/InspirationScene")),
  },
  {
    id: "creation",
    index: "03",
    title: "The Creation",
    label: "La création",
    status: "live",
    length: 10,
    Scene: lazy(() => import("@/scenes/03-creation/CreationScene")),
  },
  {
    id: "signature",
    index: "04",
    title: "The Signature Piece",
    label: "La pièce signature",
    status: "live",
    length: 11,
    Scene: lazy(() => import("@/scenes/04-signature/SignatureScene")),
  },
  {
    id: "collection",
    index: "05",
    title: "The Collection",
    label: "La collection",
    status: "live",
    length: 10,
    Scene: lazy(() => import("@/scenes/05-collection/CollectionScene")),
  },
  {
    id: "message",
    index: "06",
    title: "The Message",
    label: "Le message",
    status: "live",
    length: 7,
    Scene: lazy(() => import("@/scenes/06-message/MessageScene")),
  },
];
