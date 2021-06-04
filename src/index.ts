//Make endpoints available for import by other modules

export { default as IManifest } from './interfaces/IManifest';
export { default as ISolidSimple } from './interfaces/ISolidSimple';
export { default as ISsnFileEntry } from './interfaces/ISsnFileEntry';
export { default as Product } from './interfaces/Product';
export { default as findReleasePath } from './ssn/findReleasePath';
export { default as getManifest } from './ssn/getManifest';
export { default as getPatchZip } from './ssn/getPatchZip';
export { default as getSolidpkg } from './ssn/getSolidpkg';
export { default as installPatch } from './ssn/installPatch';
export { default as verifyProductName } from './ssn/verify/verifyProductName';

//added by Tormak
export { default as extractFileAsStream } from './ssn/extractFileAsStream';
export { default as parseBencode } from './ssn/reader/bencodeParser';
export { default as readSsnFile } from './ssn/reader/readSsnFile';
export { default as arrayBufferToStream } from './ssn/streams/arrayBufferToStream';
export { default as readLocalFileHeader } from './ssn/streams/readLocalFileHeader';
export { default as streamToArrayBuffer } from './ssn/streams/streamToArrayBuffer';
export { default as verifySolidpkg } from './ssn/verify/verifySolidpkg';

export { default as parsePatchmanifest } from './ssn/reader/parsePatchmanifest';
export { default as streamToString } from './ssn/streams/streamToString';
export { default as verifyPatchmanifest } from './ssn/verify/verifyPatchmanifest';

export { default as verifyPatch } from './ssn/verify/verifyPatch';
