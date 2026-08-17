const fs = require('fs');
const state = { lang: 'en', filters: { type: 'all', category: 'all', governorate: 'all', query: '' }, favorites: new Set() };
const ads = [{
  id: '0730d216-9124-4c49-8516-9bb651c57f2b',
  type: 'delivery',
  category: 'delivery',
  governorate: 'amman',
  title: { ar: 'kdkdk', en: 'kdkdk' },
  desc: { ar: 'jdncskljf', en: 'jdncskljf' },
  price: 55.00,
  createdAt: new Date('2026-08-16T15:52:08.164202Z'),
  mine: false,
  image: 'https://placehold.co/400x300/e9ecef/495057?text=Daily+Job'
}];
const CATEGORIES = [
  { key: 'daily', en: 'Daily Jobs' },
  { key: 'services', en: 'Services' },
  { key: 'delivery', en: 'Delivery & Courier', parent: 'services' },
  { key: 'other', en: 'Other' }
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));
function getMainCategory(key) {
  const cat = CAT_MAP[key];
  return cat?.parent || cat?.key || key;
}
function getFilteredAds() {
  const f = state.filters;
  return ads.slice().filter((ad) => {
    if (f.type !== 'all') {
      const adMainType = getMainCategory(ad.type);
      if (adMainType !== f.type) return false;
    }
    if (f.category !== 'all' && f.category !== ad.category) return false;
    if (f.governorate !== 'all' && ad.governorate !== f.governorate) return false;
    return true;
  });
}
console.log(getFilteredAds());
