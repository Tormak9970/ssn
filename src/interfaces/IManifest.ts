import IManifestRelease from './IManifestRelease';

/** A patch manifest, containing a list of releases, how to patch them, and which one the current release is. */
export default interface IManifest {
  /** Current release. */
  current: number;
  /** List of releases. */
  releases: {
    [s: string]: IManifestRelease;
};
}
