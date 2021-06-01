import Product from '../../interfaces/Product';

const allowedProducts: Product[] = [
  'assets_swtor_de_de',
  'assets_swtor_en_us',
  'assets_swtor_fr_fr',
  'assets_swtor_main',
  'assets_swtor_test_de_de',
  'assets_swtor_test_en_us',
  'assets_swtor_test_fr_fr',
  'assets_swtor_test_main',
  'eualas',
  'movies_de_de',
  'movies_en_us',
  'movies_fr_fr',
  'patcher2014',
  'patcher2017',
  'retailclient_betatest',
  'retailclient_cstraining',
  'retailclient_liveeptest',
  'retailclient_liveqatest',
  'retailclient_publictest',
  'retailclient_squadron157',
  'retailclient_swtor',
];

export default function verifyProductName(name: string) {
  return allowedProducts.includes(name as Product);
}
