import pc from "picocolors";

/** Green text for success messages */
export const success = (msg: string): string => pc.green(msg);

/** Red text for error messages */
export const error = (msg: string): string => pc.red(msg);

/** Yellow text for warning messages */
export const warn = (msg: string): string => pc.yellow(msg);

/** Cyan text for informational messages */
export const info = (msg: string): string => pc.cyan(msg);

/** Gray text for dimmed/secondary messages */
export const dim = (msg: string): string => pc.gray(msg);

/** Bold text for emphasis */
export const bold = (msg: string): string => pc.bold(msg);
