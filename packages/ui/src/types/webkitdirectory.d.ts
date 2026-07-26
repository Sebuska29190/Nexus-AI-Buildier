declare module "react" {
  interface InputHTMLAttributes<T> {
    /**
     * Non-standard directory picker attribute used by folder upload inputs.
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/webkitdirectory
     */
    webkitdirectory?: string;
  }
}
