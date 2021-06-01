export default interface IManifestRelease {
  /** SHA1 hash of this release. */
  sha1: string;
  /** List of releases from where we can patch to this release. */
  from: number[];
  /** List of releases that this release can be patched to. */
  to: number[];
}
