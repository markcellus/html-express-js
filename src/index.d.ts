/**
 * Template literal that supports string
 * interpolating in passed HTML.
 *
 * @param {*} strings
 * @param  {...any} data
 * @returns {string} - HTML string
 */
export function html(strings: any, ...data: any[]): string;
/**
 * Returns an object containing both static
 * index handler and the template engine callback.
 *
 * @param {HTMLExpressOptions} [opts]
 * @returns {{
 * staticIndexHandler: HTMLExpressStaticIndexHandler,
 * engine: Parameters<import('express').Application['engine']>[1],
 * }}
 */
export default function _default(opts?: HTMLExpressOptions): {
    staticIndexHandler: HTMLExpressStaticIndexHandler;
    engine: [ext: string, fn: (path: string, options: object, callback: (e: any, rendered?: string) => void) => void][1];
};
export type HTMLExpressBuildStateHandler = (req: import('express').Request) => Record<string, any>;
export type HTMLExpressOptions = {
    /**
     * - The directory that houses any potential index files
     */
    viewsDir: string;
    /**
     * - The directory that houses all of the includes
     * that will be available on the includes property of each static page.
     */
    includesDir?: string;
    /**
     * - The path of a file relative to the views
     * directory that should be served as 404 when no matching index page exists. Defaults to `404/index`.
     */
    notFoundView?: string;
    /**
     * - A callback function that allows for
     * building a state object from request information, that will be merged with default state and made available to all views
     */
    buildRequestState?: HTMLExpressBuildStateHandler;
};
export type HTMLExpressStaticIndexHandler = (options?: HTMLExpressOptions) => import('express').RequestHandler;
declare function staticIndexHandler(options?: HTMLExpressOptions): import('express').RequestHandler;
export {};
