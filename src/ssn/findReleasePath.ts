import Product from '../interfaces/Product';
import verifyProductName from './verify/verifyProductName';

/** For the given release in the given product, returns from which releases we can patch to this release. */
function getFromList({ product, to: releaseTo}: {product: Product, to: number}) {
  if (releaseTo < 0) {
    return [];
  }

  //The launcher (patcher, patcher2014, patcher2017) is always installing from -1, never from a previous version
  if (product.startsWith('patcher')) {
    return [-1];
  } else {
    const fromList: number[] = [];

    //Always X-1toX
    fromList.push(releaseTo - 1);

    //Also 0toX, unless X is 0. And no need to add 0to1 a second time.
    if (releaseTo >= 2) { fromList.push(0); }

    if ((releaseTo % 5) === 0) {
      //Also X-5toX if X % 5
      if (releaseTo >= 10) { fromList.push(releaseTo - 5); }
      //Also X-20toX if X % 5
      if (releaseTo >= 25) { fromList.push(releaseTo - 20); }
      //Also downgrade from the following four releases
      fromList.push(releaseTo + 1);
      fromList.push(releaseTo + 2);
      fromList.push(releaseTo + 3);
      fromList.push(releaseTo + 4);
    } else { //For some of the older releases, an update from _5 or _0 is possible
      /*
      e.g. in asset_swtor_main:
      5to7, 5to8, 5to9,
      10to12, 10to13, 10to14,
      15to17, 15to18, 15to19,
      20to22, 20to23, 20to24,
      25to27, 25to28, 25to29,
      30to32, 30to33, 30to34,
      35to37, etc.  , 85to87
      */
      if (releaseTo >= 7 && (releaseTo % 5) > 1) { fromList.push(releaseTo - (releaseTo % 5)); }
    }

    return fromList;
  }
}

/**
 * Checks whether there is a valid path between our current release and the release we want to update to, and returns an array with
 * the release path, or an empty array if no path exists.
 * E.g. for `{ from: 21, to: 24 }`, it returns [[21, 22], [22, 23], [23, 24]].
 * Does not actually look at the manifest.xml file but theorizes on possible patches based on the usually created patches, allowing
 * us to find release paths for products that have not been released yet.
 */
export default function findReleasePath({ product, from, to }: {product: Product, from: number, to: number}): Array<[number, number]> {
  //Verify function arguments
  if (!verifyProductName(product)) {
    throw new Error(`"${product}" is not a valid product.`);
  }

  //We assume that "from < to" is true for all patches
  if (from >= to) {
    throw new Error('Cannot patch backwards; to must be greater than from.');
  }

  const fromList = getFromList({ product, to });

  //If we can patch, return immediately
  if (fromList.includes(from)) {
    return [[from, to]];
  }

  //Otherwise, check all from values recursively, by checking interim releases
  const smallerFromList = fromList.filter((num) => num > from);
  //Always prefer shortest release paths (e.g. 1->3 vs. 1->2->3) by ensuring we check smallest from values first
  smallerFromList.sort((a, b) => (a < b) ? -1 : (a > b) ? 1 : 0);

  for (let i = 0, il = smallerFromList.length; i < il; i += 1) {
    const interim = smallerFromList[i];
    const releasePath = findReleasePath({ product, from, to: interim} );
    if (releasePath.length > 0) {
      return [...releasePath, [interim, to]];
    }
  }

  return [];
}
