import * as xmlJs from 'xml-js';
import IManifest from '../../interfaces/IManifest';
import IManifestRelease from '../../interfaces/IManifestRelease';

/** Given an xmlJs element, returns the child elements, or an empty array if it has no children. */
function getChildren(ele: xmlJs.Element): xmlJs.Element[] {
  return ele.elements !== undefined ? ele.elements : [];
}
/** Given an xmlJs element, returns the child at the given index. Throws an error if that element does not exist. */
function getChild(ele: xmlJs.Element, index: number): xmlJs.Element {
  return (ele.elements as xmlJs.Element[])[index] as xmlJs.Element;
}
/** Given an xmlJs element, returns the text contents. */
function getContent(ele: xmlJs.Element): string {
  const childElements = getChildren(ele);
  return (childElements.length > 0) ? String(childElements[0].text) : '';
}

/** Receives a JSON-converted version of the manifest.xml file, and returns an easier to read JSON file */
export default function parsePatchManifest(manifestFile: xmlJs.Element): IManifest {
  const out: IManifest = { current: -1, releases: {} };

  const PatchManifest = getChild(manifestFile, 0);

  //<RequiredRelease>289</RequiredRelease>
  const RequiredRelease = getChild(PatchManifest, 2);
  out.current = Number(getContent(RequiredRelease));

  //<Releases><Release><Id>0</Id><SHA1>53678f8057e52896a8145dca5c188ab3f24fa55f</SHA1></Release></Releases>
  const Releases = getChild(PatchManifest, 7);
  getChildren(Releases).forEach(function(Release: xmlJs.Element) {
    const id = getContent(getChild(Release, 0));
    const sha1 = getContent(getChild(Release, 1));
    out.releases[id] = { sha1, from: [], to: [] };
  });

  //<ReleaseUpdatePaths><ReleaseUpdatePath><From>287</From><To>288</To><ExtraDataItem>...</ExtraDataItem></ReleaseUpdatePath></ReleaseUpdatePaths
  const ReleaseUpdatePaths = getChild(PatchManifest, 8);
  getChildren(ReleaseUpdatePaths).forEach(function(ReleaseUpdatePath: xmlJs.Element) {
    const from = getContent(getChild(ReleaseUpdatePath, 0));
    const to = getContent(getChild(ReleaseUpdatePath, 1));
    //Release -1 does not exist but is a valid "from", e.g. for -1to0
    if (from !== '-1') {
      out.releases[from].to.push(Number(to));
    }
    out.releases[to].from.push(Number(from));
  });

  //freeze values to prevent modification
  Object.values(out).forEach(function(entry: IManifestRelease) {
    Object.freeze(entry.from);
    Object.freeze(entry.to);
    Object.freeze(entry);
  });
  Object.freeze(out);

  return out;
}
