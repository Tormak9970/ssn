import * as xmlJs from 'xml-js';
import Product from '../../interfaces/Product';

/** Receives a JSON-converted version of the manifest.xml file, and verifies that all required elements and attributes are present, and nothing more */
export default function verifyPatchmanifest(manifestFile: xmlJs.Element, product: Product): void {
  //<?xml version="1.0" encoding="utf-8"?>
  if (manifestFile.declaration === undefined || manifestFile.declaration.attributes === undefined || Object.keys(manifestFile.declaration.attributes).length !== 2 || manifestFile.declaration.attributes.version !== '1.0' || manifestFile.declaration.attributes.encoding !== 'utf-8') {
    throw new Error('Expected declaration with version 1.0 and utf-8 encoding.');
  }

  //<PatchManifest xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  if (manifestFile.elements === undefined || manifestFile.elements.length !== 1) {
    throw new Error('Expected one root element.');
  }
  const PatchManifest = manifestFile.elements[0];
  if (PatchManifest.type !== 'element' || PatchManifest.name !== 'PatchManifest') {
    throw new Error(`Expected root element to be called PatchManifest but it was "${PatchManifest.name}".`);
  }
  if (PatchManifest.attributes === undefined || Object.keys(PatchManifest.attributes).length !== 2 || PatchManifest.attributes['xmlns:xsi'] !== 'http://www.w3.org/2001/XMLSchema-instance' || PatchManifest.attributes['xmlns:xsd'] !== 'http://www.w3.org/2001/XMLSchema') {
    throw new Error(`Expected root element to have attributes xmlns:xsi and xmlns:xsd.`);
  }
  if (PatchManifest.elements === undefined) {
    throw new Error(`Expected child elements under PatchManifest but there were none.`);
  }
  if (PatchManifest.elements.length !== 9) {
    throw new Error(`Expected 9 child elements under PatchManifest but there were ${PatchManifest.elements.length}.`);
  }

  //<Dependencies />
  const Dependencies = PatchManifest.elements[0];
  if (Dependencies.type !== 'element' || Dependencies.name !== 'Dependencies' || Dependencies.attributes !== undefined) {
    throw new Error('Expected Dependencies element with no attributes.');
  }
  const hasDependencies = product.startsWith('retailclient_');
  if (Dependencies.elements !== undefined && !hasDependencies) {
    throw new Error('Expected Dependencies element with no child elements.');
  }
  if (hasDependencies) {
    for (const Dependency of (Dependencies.elements as xmlJs.Element[])) {
      if (Dependency.type !== 'element' || Dependency.name !== 'Dependency' || Dependency.attributes !== undefined) {
        throw new Error('Expected Dependency element with no attributes.');
      }
      //TODO: check text nodes
    }
  }

  //<Name>assets_swtor_de_de</Name>
  const Name = PatchManifest.elements[1];
  if (Name.type !== 'element' || Name.name !== 'Name' || Name.attributes !== undefined || Name.elements === undefined || Name.elements.length !== 1 || Name.elements[0].type !== 'text' || Name.elements[0].text !== product) {
    throw new Error('Expected Name element with one child element equal to product and no attributes.');
  }

  //<RequiredRelease>289</RequiredRelease>
  const RequiredRelease = PatchManifest.elements[2];
  if (RequiredRelease.type !== 'element' || RequiredRelease.name !== 'RequiredRelease' || RequiredRelease.attributes !== undefined || RequiredRelease.elements === undefined) {
    throw new Error('Expected RequiredRelease element.');
  }
  if (RequiredRelease.elements.length !== 1 || RequiredRelease.elements[0].type !== 'text' || typeof RequiredRelease.elements[0].text !== 'string' || String(RequiredRelease.elements[0].text).match(/^(?:0|[1-9][0-9]*)$/) === null) {
    throw new Error('Expected integer in RequiredRelease element.');
  }

  //<UpcomingRelease>-1</UpcomingRelease>
  const UpcomingRelease = PatchManifest.elements[3];
  if (UpcomingRelease.type !== 'element' || UpcomingRelease.name !== 'UpcomingRelease' || UpcomingRelease.attributes !== undefined || UpcomingRelease.elements === undefined) {
    throw new Error('Expected UpcomingRelease element.');
  }
  if (UpcomingRelease.elements.length !== 1 || UpcomingRelease.elements[0].type !== 'text' || UpcomingRelease.elements[0].text !== '-1') {
    throw new Error('Expected -1 in UpcomingRelease element.');
  }

  //<TargetDirectory>{ModulePath}</TargetDirectory>
  const TargetDirectory = PatchManifest.elements[4];
  if (TargetDirectory.type !== 'element' || TargetDirectory.name !== 'TargetDirectory' || TargetDirectory.attributes !== undefined || TargetDirectory.elements === undefined) {
    throw new Error('Expected TargetDirectory element.');
  }
  if (TargetDirectory.elements.length !== 1 || TargetDirectory.elements[0].type !== 'text' || TargetDirectory.elements[0].text !== '{ModulePath}') {
    throw new Error('Expected {ModulePath} in TargetDirectory element.');
  }

  //<RequiresElevation>false</RequiresElevation>
  const RequiresElevation = PatchManifest.elements[5];
  if (RequiresElevation.type !== 'element' || RequiresElevation.name !== 'RequiresElevation' || RequiresElevation.attributes !== undefined || RequiresElevation.elements === undefined) {
    throw new Error('Expected RequiresElevation element.');
  }
  if (RequiresElevation.elements.length !== 1 || RequiresElevation.elements[0].type !== 'text' || (RequiresElevation.elements[0].text !== 'false' && product !== 'retailclient_squadron157')) {
    throw new Error('Expected false in RequiresElevation element.');
  }

  //<Maintenance>false</Maintenance>
  const Maintenance = PatchManifest.elements[6];
  if (Maintenance.type !== 'element' || Maintenance.name !== 'Maintenance' || Maintenance.attributes !== undefined || Maintenance.elements === undefined) {
    throw new Error('Expected Maintenance element.');
  }
  if (Maintenance.elements.length !== 1 || Maintenance.elements[0].type !== 'text' || Maintenance.elements[0].text !== 'false') {
    throw new Error('Expected false in Maintenance element.');
  }

  //<Releases>
  const Releases = PatchManifest.elements[7];
  if (Releases.type !== 'element' || Releases.name !== 'Releases' || Releases.attributes !== undefined || Releases.elements === undefined) {
    throw new Error('Expected Releases element.');
  }
  for (const Release of Releases.elements) {
    //<Release>
    if (Release.type !== 'element' || Release.name !== 'Release' || Release.attributes !== undefined || Release.elements === undefined || Release.elements.length !== 3) {
      throw new Error('Expected Release element.');
    }
    //<Id>0</Id>
    const Id = Release.elements[0];
    if (Id.type !== 'element' || Id.name !== 'Id' || Id.attributes !== undefined || Id.elements === undefined || Id.elements.length !== 1 || Id.elements[0].type !== 'text' || typeof Id.elements[0].text !== 'string' || String(Id.elements[0].text).match(/^(?:0|[1-9][0-9]*)$/) === null) {
      throw new Error('Expected Id element.');
    }
    //<ReleaseName>53678f8057e52896a8145dca5c188ab3f24fa55f</SHA1>
    const Sha1 = Release.elements[1];
    if (Sha1.type !== 'element' || Sha1.name !== 'SHA1' || Sha1.attributes !== undefined || Sha1.elements === undefined || Sha1.elements.length !== 1 || Sha1.elements[0].type !== 'text' || typeof Sha1.elements[0].text !== 'string' || String(Sha1.elements[0].text).match(/^[0-9a-z]{40}$/) === null) {
      throw new Error('Expected SHA1 element.');
    }
    //<Name>assets_swtor_de_de_0</Name>
    const ReleaseName = Release.elements[2];
    if (ReleaseName.type !== 'element' || ReleaseName.name !== 'Name' || ReleaseName.attributes !== undefined || ReleaseName.elements === undefined || ReleaseName.elements.length !== 1 || ReleaseName.elements[0].type !== 'text' || ReleaseName.elements[0].text !== `${product}_${Id.elements[0].text}`) {
      throw new Error('Expected Release->Name element.');
    }
  }

  //<ReleaseUpdatePaths>
  const ReleaseUpdatePaths = PatchManifest.elements[8];
  if (ReleaseUpdatePaths.type !== 'element' || ReleaseUpdatePaths.name !== 'ReleaseUpdatePaths' || ReleaseUpdatePaths.attributes !== undefined || ReleaseUpdatePaths.elements === undefined) {
    throw new Error('Expected ReleaseUpdatePaths element.');
  }
  for (const ReleaseUpdatePath of ReleaseUpdatePaths.elements) {
    //<ReleaseUpdatePath>
    if (ReleaseUpdatePath.type !== 'element' || ReleaseUpdatePath.name !== 'ReleaseUpdatePath' || ReleaseUpdatePath.attributes !== undefined || ReleaseUpdatePath.elements === undefined || ReleaseUpdatePath.elements.length !== 3) {
      throw new Error('Expected ReleaseUpdatePath element.');
    }
    //<From>289</From>
    const From = ReleaseUpdatePath.elements[0];
    if (From.type !== 'element' || From.name !== 'From' || From.attributes !== undefined || From.elements === undefined || From.elements.length !== 1 || From.elements[0].type !== 'text' || typeof From.elements[0].text !== 'string') {
      throw new Error('Expected From element.');
    }
    const fromNum = From.elements[0].text;
    if (String(fromNum).match(/^(?:-1|0|[1-9][0-9]*)$/) === null) {
      throw new Error(`Expected From element to be a number but it was ${fromNum}.`);
    }
    //<To>285</To>
    const To = ReleaseUpdatePath.elements[1];
    if (To.type !== 'element' || To.name !== 'To' || To.attributes !== undefined || To.elements === undefined || To.elements.length !== 1 || To.elements[0].type !== 'text' || typeof To.elements[0].text !== 'string') {
      throw new Error('Expected To element.');
    }
    const toNum = To.elements[0].text;
    if (String(toNum).match(/^(?:0|[1-9][0-9]*)$/) === null) {
      throw new Error(`Expected To element to be a number but it was ${toNum}.`);
    }
    //TODO: check if From and To are valid relations
    //<ExtraData>
    const ExtraData = ReleaseUpdatePath.elements[2];
    if (ExtraData.type !== 'element' || ExtraData.name !== 'ExtraData' || ExtraData.attributes !== undefined) {
      throw new Error(`Expected ExtraData element in patch ${fromNum}to${toNum}.`);
    }
    const noExtraData: Array<[Product, number, number]> = [
      ['assets_swtor_fr_fr', 132, 130],
      ['assets_swtor_test_de_de', 260, 261],
      ['assets_swtor_test_de_de', 0, 261],
      ['assets_swtor_test_de_de', 261, 260],
      ['assets_swtor_test_fr_fr', 109, 110],
      ['assets_swtor_test_fr_fr', 105, 110],
      ['assets_swtor_test_fr_fr', 90, 110],
      ['assets_swtor_test_main', 261, 262],
      ['assets_swtor_test_main', 0, 262],
      ['assets_swtor_test_main', 262, 260],
    ];
    const isPatchWithoutExtraData = noExtraData.some((entry) => product === entry[0] && fromNum === String(entry[1]) && toNum === String(entry[2]));
    if (ExtraData.elements === undefined && !isPatchWithoutExtraData) {
      throw new Error(`Expected ExtraData element with children in patch ${fromNum}to${toNum} but it had no children.`);
    }
    if (ExtraData.elements !== undefined && isPatchWithoutExtraData) {
      throw new Error(`Expected ExtraData element without children in patch ${fromNum}to${toNum} but it had children.`);
    }
    if (!isPatchWithoutExtraData) {
      for (const ExtraDataItem of (ExtraData.elements as xmlJs.Element[])) {
        //<ExtraDataItem>
        if (ExtraDataItem.type !== 'element' || ExtraDataItem.name !== 'ExtraDataItem' || ExtraDataItem.attributes !== undefined || ExtraDataItem.elements === undefined || ExtraDataItem.elements.length !== 2) {
          throw new Error('Expected ExtraDataItem element.');
        }
        //<Key>MetafileUrl</Key>
        const Key = ExtraDataItem.elements[0];
        if (Key.type !== 'element' || Key.name !== 'Key' || Key.attributes !== undefined || Key.elements === undefined || Key.elements.length !== 1 || Key.elements[0].type !== 'text') {
          throw new Error('Expected Key element.');
        }
        const keyName = String(Key.elements[0].text);
        if (!['SSN_VERSION', 'MetafileUrl', 'ConfigurationUrl'].includes(keyName)) {
          throw new Error(`Expected valid Key in patch ${fromNum}to${toNum} but "${keyName}" is not a valid key.`);
        }
        //<Value>http://cdn-patch.swtor.com/patch/assets_swtor_de_de/assets_swtor_de_de_289to285.solidpkg</Value>
        const Value = ExtraDataItem.elements[1];
        if (Value.type !== 'element' || Value.name !== 'Value' || Value.attributes !== undefined || Value.elements === undefined || Value.elements.length !== 1 || Value.elements[0].type !== 'text') {
          throw new Error('Expected Value element.');
        }
        //parse Key and Value
        const valueName = String(Value.elements[0].text);
        switch (keyName) {
          case 'SSN_VERSION':
            if (valueName.match(/^[0-9](?:\.[0-9])+$/) === null) {
              throw new Error(`Expected valid Value for Key "SSN_VERSION" in patch ${fromNum}to${toNum} but it was "${valueName}".`);
            }
            break;
          case 'MetafileUrl':
            if (valueName !== `http://cdn-patch.swtor.com/patch/${product.startsWith('retailclient_') ? `${product.substring(13)}/` : ''}${product}/${product}_${fromNum}to${toNum}.solidpkg`) {
              throw new Error(`Expected valid Value for Key "MetafileUrl" in patch ${fromNum}to${toNum} but it was "${valueName}".`);
            }
            break;
          case 'ConfigurationUrl':
            if (valueName !== '{AppContentUrl}download.solidconfig') {
              throw new Error(`Expected valid Value for Key "ConfigurationUrl" in patch ${fromNum}to${toNum} but it was "${valueName}".`);
            }
            break;
          default: //do nothing
        }
      }
    }
  }
}
