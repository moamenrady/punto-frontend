/**
 * @typedef {'admin' | 'user'} UserRole
 * @typedef {'In Stock' | 'Low Stock' | 'Out of Stock'} AssetStatus
 * @typedef {Object} Asset
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {number} quantity
 * @property {AssetStatus} status
 * @property {number} value
 * @property {string} sku
 */

export const getAssetStatus = (quantity) => {
  if (quantity === 0) return 'Out of Stock';
  if (quantity <= 5) return 'Low Stock';
  return 'In Stock';
};

export const mockAssets = [
  {
    id: 'ASSET-001',
    name: 'Dell Latitude 7420',
    category: 'Computers',
    quantity: 12,
    status: getAssetStatus(12),
    value: 1500,
    sku: 'DL7420-001'
  },
  {
    id: 'ASSET-002',
    name: 'HP ProDesk 400',
    category: 'Hardware',
    quantity: 4,
    status: getAssetStatus(4),
    value: 850,
    sku: 'HP400-002'
  },
  {
    id: 'ASSET-003',
    name: 'Dell USB-C Dock',
    category: 'Accessories',
    quantity: 0,
    status: getAssetStatus(0),
    value: 190,
    sku: 'DUCK-003'
  },
  {
    id: 'ASSET-004',
    name: 'Logitech MX Master 3',
    category: 'Accessories',
    quantity: 7,
    status: getAssetStatus(7),
    value: 120,
    sku: 'LGMX3-004'
  }
];
