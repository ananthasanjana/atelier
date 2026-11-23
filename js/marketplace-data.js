window.atelierMarketplaceProducts = [
  { id: 'item1', title: 'Crochet Caterpillar Scarf', price: 550, tags: ['crochet', 'handmade'], seller: 'knotsbymeera', sellerType: 'small-business', upiId: 'knotsbymeera@okicici', contact: '+91 90000 00001', image: 'images/marketplace/item1.png', color: 'blue', description: 'A cheerful hand-crocheted caterpillar scarf, made slowly with lots of love.' },
  { id: 'item2', title: 'Starry Crochet Beanie', price: 380, tags: ['crochet', 'handmade'], seller: 'crochetbyaditi', sellerType: 'small-business', upiId: 'crochetbyaditi@okaxis', contact: '+91 90000 00002', image: 'images/marketplace/item2.png', color: 'pink', description: 'A cozy crochet beanie for cool evenings and starry walks.' },
  { id: 'item3', title: 'Patchwork Zipper Pouch', price: 240, tags: ['upcycled', 'small biz'], seller: 'upcyclelab', sellerType: 'small-business', upiId: 'upcyclelab@okhdfcbank', contact: '+91 90000 00003', image: 'images/marketplace/item3.png', color: 'cream', description: 'A one-of-a-kind zip pouch pieced together from rescued fabric.' },
  { id: 'item4', title: 'Apple & Star Charm Bracelet', price: 180, tags: ['accessories'], seller: 'vintagebeads', sellerType: 'small-business', upiId: 'vintagebeads@okicici', contact: '+91 90000 00004', image: 'images/marketplace/item4.png', color: 'pink', description: 'A playful handmade bracelet with tiny apple and star charms.' },
  { id: 'item5', title: 'Glass Lily Beaded Choker', price: 450, tags: ['accessories'], seller: 'flora_gems', sellerType: 'small-business', upiId: 'floragems@okaxis', contact: '+91 90000 00005', image: 'images/marketplace/item5.png', color: 'blue', description: 'A delicate glass-bead choker inspired by lilies in bloom.' },
  { id: 'item6', title: 'Flora Patchwork Jacket', price: 1100, tags: ['local artisan'], seller: 'rangboutique', sellerType: 'local-artisan', upiId: 'rangboutique@okaxis', contact: '+91 90000 00006', image: 'images/marketplace/item6.png', color: 'cream', description: 'A richly detailed patchwork jacket crafted by a local maker.' },
  { id: 'item7', title: 'Satin Scrunchie Trio', price: 150, tags: ['small biz'], seller: 'silkystuff', sellerType: 'small-business', upiId: 'silkystuff@okicici', contact: '+91 90000 00007', image: 'images/marketplace/item7.png', color: 'pink', description: 'Three soft satin scrunchies in easy-to-wear colors.' },
  { id: 'item8', title: 'Turquoise Plaid Ruffled Tee', price: 320, tags: ['thrift'], seller: 'sanjs4n', sellerType: 'thrift-finds', upiId: 'sanjs4n@oksbi', contact: '+91 90000 00008', image: 'images/marketplace/item8.png', color: 'blue', description: 'A pre-loved turquoise plaid top with a sweet ruffled finish.' },
  { id: 'item9', title: 'Olive Utility Cap', price: 280, tags: ['thrift'], seller: 'thriftvault_hyd', sellerType: 'small-business', upiId: 'thriftvaulthyd@okhdfcbank', contact: '+91 90000 00009', image: 'images/marketplace/item9.png', color: 'cream', description: 'A practical olive cap, ready for another adventure.' },
  { id: 'item10', title: 'Brown Chunky Loafer Flats', price: 620, tags: ['thrift'], seller: 'retrothreads', sellerType: 'thrift-finds', upiId: 'retrothreads@okaxis', contact: '+91 90000 00010', image: 'images/marketplace/item10.png', color: 'pink', description: 'Pre-loved chunky loafers with a timeless, easy-to-style shape.' },
  { id: 'item11', title: 'Vintage Denim Maxi Skirt', price: 750, tags: ['thrift'], seller: 'sahasra', sellerType: 'thrift-finds', upiId: 'sahasra@okicici', contact: '+91 90000 00011', image: 'images/marketplace/item11.png', color: 'blue', description: 'A vintage denim maxi skirt with plenty of life left in it.' },
  { id: 'item12', title: 'Retro White Leather Jacket', price: 1650, tags: ['thrift'], seller: 'vintageselection', sellerType: 'small-business', upiId: 'vintageselection@oksbi', contact: '+91 90000 00012', image: 'images/marketplace/item12.png', color: 'cream', description: 'A statement retro jacket selected for a second life.' }
];

window.ensureAtelierMarketplaceItemsStored = function () {
  const storageKey = 'atelier_marketplace_items';
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(stored)) throw new Error('Stored marketplace items are not an array.');
    let changed = false;
    window.atelierMarketplaceProducts.forEach((product) => {
      const existing = stored.find((item) => item && item.id === product.id);
      if (!existing) {
        stored.push(product);
        changed = true;
      } else {
        if (!existing.upiId) {
          existing.upiId = product.upiId;
          changed = true;
        }
        if (!existing.contact) {
          existing.contact = product.contact;
          changed = true;
        }
      }
    });
    if (changed) window.localStorage.setItem(storageKey, JSON.stringify(stored));
  } catch (error) {
    console.error('Unable to store the seeded Atelier marketplace items.', error);
  }
};

window.normalizeAtelierMarketplaceListing = function (row) {
  const tags = Array.isArray(row.tags) ? row.tags : [];
  const category = String(row.category || tags[0] || 'Atelier find');
  return {
    ...row,
    id: String(row.id || ''),
    title: String(row.item_name || row.title || row.name || 'Atelier find'),
    price: Number(row.price) || 0,
    category,
    condition: String(row.condition || 'Good'),
    tags: tags.length ? tags : [category],
    seller: String(row.seller_username || row.seller || 'atelier-maker').replace(/^@/, ''),
    seller_id: row.seller_id || '',
    sellerType: String(row.seller_type || row.sellerType || 'community'),
    upiId: String(row.upi_id || row.upiId || ''),
    contact: String(row.contact || row.whatsapp || ''),
    image: String(row.image_url || row.image || row.photo_url || ''),
    description: String(row.description || ''),
    color: String(row.color || 'cream'),
    status: String(row.status || 'available'),
    supabaseListing: true
  };
};
