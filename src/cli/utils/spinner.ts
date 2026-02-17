import ora, { type Ora } from "ora";

/** Create an ora spinner with default project styling */
export function createSpinner(text: string): Ora {
	return ora({ text, spinner: "dots" });
}

/** Stop spinner with a green success symbol and optional text override */
export function spinnerSuccess(spinner: Ora, text?: string): void {
	spinner.succeed(text);
}

/** Stop spinner with a red fail symbol and optional text override */
export function spinnerFail(spinner: Ora, text?: string): void {
	spinner.fail(text);
}
