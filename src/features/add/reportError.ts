/**
 * Unexpected errors of the add flow (file, database, camera). No error screen
 * is designed yet: they are logged and the flow stays usable.
 */
export function reportError(error: unknown): void {
  console.warn('Burst add error', error);
}
