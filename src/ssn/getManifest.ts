import * as xmlJs from 'xml-js';
import getUrlContents from '../cdn/getUrlContents';
import IManifest from '../interfaces/IManifest';
import Product from '../interfaces/Product';
import extractFileAsStream from './extractFileAsStream';
import parsePatchmanifest from './reader/parsePatchmanifest';
import readSsnFile from './reader/readSsnFile';
import arrayBufferToStream from './streams/arrayBufferToStream';
import readLocalFileHeader from './streams/readLocalFileHeader';
import streamToString from './streams/streamToString';
import verifyPatchmanifest from './verify/verifyPatchmanifest';
import verifyProductName from './verify/verifyProductName';

/** Downloads the .patchmanifest file for the given product,
 * extracts the manifest.xml file inside and returns it in
 * JSON format.
 */
export default async function getManifest(product: Product): Promise<IManifest> {
  //Verify function arguments
  if (!verifyProductName(product)) {
    throw new TypeError(`"${product}" is not a valid product.`);
  }

  //Download .patchmanifest file
  const ssnFile = await getUrlContents({ host: 'manifest.swtor.com', path: `/patch/${product}.patchmanifest` });

  //Parse .patchmanifest file
  const fileEntries = readSsnFile(ssnFile);

  //Verify .patchmanifest file
  if (fileEntries.length !== 1) {
    throw new Error(`Expected .patchmanifest to contain 1 file but it had "${fileEntries.length}" files.`);
  }

  const firstFile = fileEntries[0];
  if (firstFile.name !== 'manifest.xml') {
    throw new Error(`Expected .patchmanifest to contain a file called manifest.xml but it is called "${firstFile.name}".`);
  }

  const stream = arrayBufferToStream(ssnFile, firstFile.offset);

  //Extract manifest.xml file
  await readLocalFileHeader(stream, true);
  const patchmanifestStream = await extractFileAsStream(firstFile, stream);

  //Convert ArrayBuffer to string
  const patchmanifestXml = await streamToString(patchmanifestStream);

  //convert XML to JSON-converted XML
  const patchManifestJson = xmlJs.xml2js(patchmanifestXml) as xmlJs.Element;

  //verify that XML file contains all required elements and attributes
  verifyPatchmanifest(patchManifestJson, product);

  //convert JSON-converted XML to an easier to read JSON
  const patchManifestSimple = parsePatchmanifest(patchManifestJson);

  return patchManifestSimple;
}
