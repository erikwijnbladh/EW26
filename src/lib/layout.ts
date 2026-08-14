/**
 * The nav owns the site's horizontal rail. Lists begin on its dot; ordinary
 * content uses `pl-5`, exactly the width of the 12px dot and its 8px gap, to
 * begin on the nav name instead.
 *
 * The rail is the one place the page's width is decided — nothing downstream
 * sets its own cap, so narrowing this narrows the nav and the prose together
 * and they can't drift out of line.
 */
export const PAGE_RAIL = "mx-auto w-full max-w-lg px-5";

/**
 * The portrait, which is a photograph of a person and not a hero image.
 *
 * Capped well inside the rail on purpose. At the column's full width a face is
 * the first and largest thing on the page, which is a bolder claim than the
 * writing underneath it makes; at this size it reads as a byline.
 */
export const PORTRAIT = "w-full max-w-60";
