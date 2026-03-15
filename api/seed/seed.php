<?php
/**
 * HJKCollections Database Seeder
 * Run: php seed.php
 * This creates all tables and populates initial data matching data.js
 */

require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';

$db = Database::getInstance();

echo "=== HJKCollections Database Seeder ===\n\n";

// 1. Run schema
echo "Creating tables...\n";
$schema = file_get_contents(__DIR__ . '/schema.sql');
$db->exec($schema);
echo "  Tables created successfully.\n\n";

// 2. Seed Users
echo "Seeding users...\n";
$users = [
    ['Admin', 'HJK', 'admin@hjkcollections.com', '9876543210', 'admin123', 'superadmin', 1, '{"orderUpdates":true,"promotions":true,"newsletter":true}', '2025-01-01 00:00:00'],
    ['Rahul', 'Sharma', 'rahul@example.com', '9876543211', 'password123', 'customer', 1, '{"orderUpdates":true,"promotions":false,"newsletter":true}', '2026-01-15 10:30:00'],
    ['Priya', 'Patel', 'priya@example.com', '9876543212', 'password123', 'customer', 1, '{"orderUpdates":true,"promotions":true,"newsletter":true}', '2026-01-20 08:00:00'],
    ['Amit', 'Kumar', 'amit@example.com', '9876543213', 'password123', 'customer', 1, '{"orderUpdates":true,"promotions":false,"newsletter":false}', '2026-02-01 12:00:00'],
    ['Sneha', 'Desai', 'sneha@example.com', '9876543214', 'password123', 'customer', 1, '{"orderUpdates":true,"promotions":true,"newsletter":true}', '2026-02-10 09:00:00'],
    ['Vikram', 'Singh', 'vikram@example.com', '9876543215', 'password123', 'customer', 0, '{"orderUpdates":true,"promotions":false,"newsletter":false}', '2026-02-15 14:00:00'],
];

$stmt = $db->prepare('INSERT INTO hjk_users (first_name, last_name, email, phone, password, role, is_active, notification_prefs, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($users as $u) {
    $u[4] = password_hash($u[4], PASSWORD_BCRYPT);
    $stmt->execute($u);
}
echo "  " . count($users) . " users seeded.\n";

// 3. Seed Addresses
echo "Seeding addresses...\n";
$addresses = [
    [2, 'Home', 'Rahul Sharma', '9876543211', '123 MG Road', 'Apt 4B', 'Mumbai', 'Maharashtra', '400001', 1],
    [2, 'Work', 'Rahul Sharma', '9876543211', '456 Business Tower', 'Floor 8', 'Mumbai', 'Maharashtra', '400051', 0],
    [3, 'Home', 'Priya Patel', '9876543212', '789 Park Street', '', 'Ahmedabad', 'Gujarat', '380001', 1],
    [4, 'Home', 'Amit Kumar', '9876543213', '321 Nehru Place', 'Block C', 'New Delhi', 'Delhi', '110019', 1],
    [5, 'Home', 'Sneha Desai', '9876543214', '567 Koramangala', '1st Block', 'Bangalore', 'Karnataka', '560034', 1],
];

$stmt = $db->prepare('INSERT INTO hjk_addresses (user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($addresses as $a) {
    $stmt->execute($a);
}
echo "  " . count($addresses) . " addresses seeded.\n";

// 4. Seed Categories
echo "Seeding categories...\n";
$categories = [
    ['Laptop Bags', 'laptop-bags', 'Professional laptop bags with padded compartments for maximum protection', 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&h=400&fit=crop', 1, 1],
    ['Backpacks', 'backpacks', 'Versatile backpacks for everyday use, college, and adventures', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', 1, 2],
    ['Travel Bags', 'travel-bags', 'Spacious travel bags and duffel bags for your journeys', 'https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=400&h=400&fit=crop', 1, 3],
    ['School Bags', 'school-bags', 'Durable and stylish school bags for students of all ages', 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=400&h=400&fit=crop', 1, 4],
    ['Handbags', 'handbags', 'Elegant handbags and tote bags for women', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop', 1, 5],
    ['Sling Bags', 'sling-bags', 'Compact sling bags and crossbody bags for on-the-go convenience', 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=400&h=400&fit=crop', 1, 6],
];

$stmt = $db->prepare('INSERT INTO hjk_categories (name, slug, description, image, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
foreach ($categories as $c) {
    $stmt->execute($c);
}
echo "  " . count($categories) . " categories seeded.\n";

// 5. Seed Products with Variants
echo "Seeding products...\n";
$products = [
    [
        'info' => [1, 'Executive Pro Laptop Bag', 'executive-pro-laptop-bag', 'Premium leather laptop bag with padded compartment and multiple organizer pockets', '<p>The Executive Pro is our flagship laptop bag, crafted from genuine leather with a water-resistant lining. Features a padded laptop compartment that fits up to 15.6" laptops, along with dedicated pockets for your tablet, charger, and accessories.</p><ul><li>Genuine leather exterior</li><li>Water-resistant inner lining</li><li>Padded laptop compartment</li><li>Multiple organizer pockets</li><li>Adjustable shoulder strap</li><li>Top carry handle</li></ul>', '["laptop","professional","leather","office"]', 1, 1, 4.5, 28, 156],
        'variants' => [
            ['Black', '#000000', 0, [
                ['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
                [['14 inch', 2999, 2499, 25, 'EXEC-BLK-14'], ['15.6 inch', 3499, 2999, 18, 'EXEC-BLK-156']]
            ]],
            ['Brown', '#8B4513', 1, [
                ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop'],
                [['14 inch', 2999, 2499, 12, 'EXEC-BRN-14'], ['15.6 inch', 3499, 2999, 8, 'EXEC-BRN-156']]
            ]],
            ['Navy', '#1A1A2E', 2, [
                ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop'],
                [['15.6 inch', 3499, 2999, 5, 'EXEC-NVY-156']]
            ]],
        ]
    ],
    [
        'info' => [2, 'Urban Explorer Backpack', 'urban-explorer-backpack', 'Stylish and functional backpack with anti-theft design and USB charging port', '<p>The Urban Explorer is designed for the modern commuter. With its anti-theft hidden zipper design and built-in USB charging port, this backpack keeps your belongings safe while keeping you connected.</p><ul><li>Anti-theft hidden zipper</li><li>USB charging port</li><li>Water-resistant fabric</li><li>Padded back panel</li><li>Multiple compartments</li></ul>', '["backpack","anti-theft","usb","commute"]', 1, 1, 4.3, 45, 234],
        'variants' => [
            ['Charcoal Grey', '#36454F', 0, [
                ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop'],
                [['30L', 1999, 1599, 40, 'URB-GRY-30'], ['35L', 2299, 1899, 30, 'URB-GRY-35']]
            ]],
            ['Black', '#000000', 1, [
                ['https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
                [['30L', 1999, 1599, 35, 'URB-BLK-30'], ['35L', 2299, 1899, 22, 'URB-BLK-35']]
            ]],
        ]
    ],
    [
        'info' => [3, 'Voyager Duffel Bag', 'voyager-duffel-bag', 'Spacious duffel bag with shoe compartment, perfect for weekend getaways', '<p>The Voyager Duffel is your perfect travel companion. With a generous 55L capacity and separate shoe compartment, this bag makes packing a breeze.</p><ul><li>55L capacity</li><li>Separate shoe compartment</li><li>Water-resistant canvas</li><li>Detachable shoulder strap</li><li>Trolley sleeve</li></ul>', '["travel","duffel","weekend","gym"]', 1, 1, 4.6, 19, 98],
        'variants' => [
            ['Olive Green', '#556B2F', 0, [
                ['https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
                [['Medium (45L)', 2499, 1999, 20, 'VOY-OLV-M'], ['Large (55L)', 2999, 2499, 15, 'VOY-OLV-L']]
            ]],
            ['Black', '#000000', 1, [
                ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=600&h=600&fit=crop'],
                [['Medium (45L)', 2499, 1999, 18, 'VOY-BLK-M'], ['Large (55L)', 2999, 2499, 10, 'VOY-BLK-L']]
            ]],
        ]
    ],
    [
        'info' => [4, 'Scholar Plus School Bag', 'scholar-plus-school-bag', 'Ergonomic school bag with reflective strips and rain cover included', '<p>Designed for young students, the Scholar Plus combines comfort with functionality. The ergonomic back panel reduces strain, while reflective strips ensure visibility in low light.</p><ul><li>Ergonomic padded back</li><li>Reflective safety strips</li><li>Rain cover included</li><li>Multiple compartments</li><li>Durable polyester fabric</li></ul>', '["school","kids","student","ergonomic"]', 0, 1, 4.2, 67, 312],
        'variants' => [
            ['Blue', '#2563EB', 0, [
                ['https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
                [['Small (20L)', 999, 799, 50, 'SCH-BLU-S'], ['Medium (25L)', 1299, 999, 45, 'SCH-BLU-M']]
            ]],
            ['Red', '#DC2626', 1, [
                ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop'],
                [['Small (20L)', 999, 799, 38, 'SCH-RED-S'], ['Medium (25L)', 1299, 999, 30, 'SCH-RED-M']]
            ]],
            ['Pink', '#EC4899', 2, [
                ['https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
                [['Small (20L)', 999, 799, 42, 'SCH-PNK-S'], ['Medium (25L)', 1299, 999, 28, 'SCH-PNK-M']]
            ]],
        ]
    ],
    [
        'info' => [5, 'Elegance Tote Bag', 'elegance-tote-bag', 'Sophisticated leather tote bag with detachable inner pouch', '<p>The Elegance Tote is a statement piece for the modern woman. Crafted from premium faux leather, it features a spacious interior with a detachable zippered pouch for organizing essentials.</p>', '["handbag","tote","women","leather","office"]', 1, 1, 4.7, 34, 189],
        'variants' => [
            ['Beige', '#D2B48C', 0, [
                ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop'],
                [['Standard', 1899, 1499, 20, 'ELG-BEI-STD']]
            ]],
            ['Black', '#000000', 1, [
                ['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop'],
                [['Standard', 1899, 1499, 15, 'ELG-BLK-STD']]
            ]],
            ['Maroon', '#800000', 2, [
                ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop'],
                [['Standard', 1899, 1499, 10, 'ELG-MRN-STD']]
            ]],
        ]
    ],
    [
        'info' => [6, 'Metro Crossbody Sling', 'metro-crossbody-sling', 'Compact crossbody sling bag with RFID-blocking pocket', '<p>The Metro Crossbody is the perfect companion for daily commutes and outings. Its compact design fits all essentials while the RFID-blocking pocket keeps your cards safe.</p>', '["sling","crossbody","compact","rfid"]', 0, 1, 4.1, 22, 145],
        'variants' => [
            ['Black', '#000000', 0, [
                ['https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
                [['One Size', 1299, 999, 30, 'MET-BLK-OS']]
            ]],
            ['Tan', '#D2691E', 1, [
                ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&h=600&fit=crop'],
                [['One Size', 1299, 999, 25, 'MET-TAN-OS']]
            ]],
        ]
    ],
    [
        'info' => [1, 'TechShield Laptop Sleeve', 'techshield-laptop-sleeve', 'Slim protective laptop sleeve with shock-absorbing padding', '<p>The TechShield is designed for those who prefer minimal carry. Its shock-absorbing foam padding provides excellent protection while maintaining a slim profile.</p>', '["laptop","sleeve","slim","protection"]', 0, 1, 4.4, 56, 278],
        'variants' => [
            ['Grey', '#808080', 0, [
                ['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop'],
                [['13 inch', 899, 699, 35, 'TECH-GRY-13'], ['14 inch', 999, 799, 30, 'TECH-GRY-14'], ['15.6 inch', 1099, 899, 20, 'TECH-GRY-156']]
            ]],
            ['Navy Blue', '#000080', 1, [
                ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop'],
                [['13 inch', 899, 699, 28, 'TECH-NVY-13'], ['14 inch', 999, 799, 22, 'TECH-NVY-14'], ['15.6 inch', 1099, 899, 15, 'TECH-NVY-156']]
            ]],
        ]
    ],
    [
        'info' => [2, 'Adventure Trail Backpack', 'adventure-trail-backpack', 'Rugged outdoor backpack with hydration compartment and rain cover', '<p>Built for the outdoors, the Adventure Trail is made from tear-resistant nylon with a built-in rain cover. The hydration compartment and chest/waist straps make it ideal for hiking and trekking.</p>', '["backpack","hiking","outdoor","adventure","trekking"]', 1, 1, 4.8, 15, 67],
        'variants' => [
            ['Forest Green', '#228B22', 0, [
                ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop'],
                [['40L', 2799, 2299, 15, 'ADV-GRN-40'], ['50L', 3299, 2799, 10, 'ADV-GRN-50']]
            ]],
            ['Orange', '#FF8C00', 1, [
                ['https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
                [['40L', 2799, 2299, 12, 'ADV-ORG-40'], ['50L', 3299, 2799, 8, 'ADV-ORG-50']]
            ]],
        ]
    ],
    [
        'info' => [5, 'Luxe Clutch Handbag', 'luxe-clutch-handbag', 'Stunning evening clutch with detachable chain strap', '<p>Make a statement at every event with the Luxe Clutch. This elegant evening bag features a magnetic snap closure, satin lining, and a detachable gold chain strap.</p>', '["handbag","clutch","evening","party","women"]', 0, 1, 4.6, 18, 89],
        'variants' => [
            ['Gold', '#C9A96E', 0, [
                ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop'],
                [['One Size', 1599, 1299, 12, 'LUX-GLD-OS']]
            ]],
            ['Silver', '#C0C0C0', 1, [
                ['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop'],
                [['One Size', 1599, 1299, 10, 'LUX-SLV-OS']]
            ]],
            ['Rose Gold', '#B76E79', 2, [
                ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop'],
                [['One Size', 1599, 1299, 8, 'LUX-RSG-OS']]
            ]],
        ]
    ],
    [
        'info' => [3, 'GlobeTrotter Trolley Bag', 'globetrotter-trolley-bag', 'Premium hardshell trolley bag with 360° spinner wheels and TSA lock', '<p>Travel the world with the GlobeTrotter. This hardshell trolley features 360° spinner wheels for effortless mobility, a built-in TSA lock, and an expandable design for extra packing space.</p>', '["travel","trolley","luggage","hardshell"]', 1, 1, 4.4, 23, 56],
        'variants' => [
            ['Midnight Blue', '#191970', 0, [
                ['https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
                [['Cabin (20")', 4999, 3999, 10, 'GLB-BLU-20'], ['Medium (24")', 5999, 4999, 8, 'GLB-BLU-24'], ['Large (28")', 6999, 5999, 5, 'GLB-BLU-28']]
            ]],
            ['Rose Pink', '#FF69B4', 1, [
                ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=600&h=600&fit=crop'],
                [['Cabin (20")', 4999, 3999, 7, 'GLB-PNK-20'], ['Medium (24")', 5999, 4999, 5, 'GLB-PNK-24']]
            ]],
        ]
    ],
    [
        'info' => [6, 'Wanderer Waist Bag', 'wanderer-waist-bag', 'Trendy fanny pack with adjustable strap and multiple zip pockets', '<p>The Wanderer Waist Bag is perfect for festivals, travel, and everyday use. Its adjustable strap fits all body types, and multiple zip pockets keep your essentials organized and accessible.</p>', '["sling","waist","fanny","festival"]', 0, 1, 4.0, 31, 198],
        'variants' => [
            ['Black', '#000000', 0, [
                ['https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
                [['One Size', 799, 599, 45, 'WAN-BLK-OS']]
            ]],
            ['Camo', '#4B5320', 1, [
                ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&h=600&fit=crop'],
                [['One Size', 799, 599, 35, 'WAN-CMO-OS']]
            ]],
        ]
    ],
    [
        'info' => [4, 'Campus King College Bag', 'campus-king-college-bag', 'Trendy college backpack with laptop compartment and bottle holder', '<p>The Campus King is designed for college students who want style and functionality. Features a dedicated 15" laptop compartment, side bottle holders, and a front organizer pocket.</p>', '["school","college","student","laptop"]', 0, 1, 4.3, 42, 267],
        'variants' => [
            ['Navy Blue', '#000080', 0, [
                ['https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
                [['28L', 1499, 1199, 35, 'CMP-NVY-28'], ['32L', 1699, 1399, 25, 'CMP-NVY-32']]
            ]],
            ['Grey', '#808080', 1, [
                ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop'],
                [['28L', 1499, 1199, 30, 'CMP-GRY-28'], ['32L', 1699, 1399, 20, 'CMP-GRY-32']]
            ]],
        ]
    ],
];

$stmtProduct = $db->prepare('INSERT INTO hjk_products (category_id, name, slug, short_description, full_description, tags, is_featured, is_active, avg_rating, review_count, total_sold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmtVariant = $db->prepare('INSERT INTO hjk_product_variants (product_id, color, color_hex, sort_order) VALUES (?, ?, ?, ?)');
$stmtImage = $db->prepare('INSERT INTO hjk_variant_images (variant_id, image_url, sort_order) VALUES (?, ?, ?)');
$stmtSize = $db->prepare('INSERT INTO hjk_variant_sizes (variant_id, size, normal_price, selling_price, stock, sku) VALUES (?, ?, ?, ?, ?, ?)');

foreach ($products as $p) {
    $stmtProduct->execute($p['info']);
    $productId = $db->lastInsertId();

    foreach ($p['variants'] as $v) {
        $stmtVariant->execute([$productId, $v[0], $v[1], $v[2]]);
        $variantId = $db->lastInsertId();

        // Images
        $images = $v[3][0];
        foreach ($images as $i => $img) {
            $stmtImage->execute([$variantId, $img, $i]);
        }

        // Sizes
        $sizes = $v[3][1];
        foreach ($sizes as $s) {
            $stmtSize->execute([$variantId, $s[0], $s[1], $s[2], $s[3], $s[4]]);
        }
    }
}
echo "  " . count($products) . " products seeded with variants.\n";

// 6. Seed Reviews
echo "Seeding reviews...\n";
// product_id and user_id are DB auto-increment IDs
$reviews = [
    [1, 2, 'Rahul S.', 5, 'Excellent quality!', 'The leather quality is amazing. Very professional looking. Perfect for office use.', 'approved', 'Thank you for your kind words!', '2026-02-01 12:00:00'],
    [1, 3, 'Priya P.', 4, 'Good bag, slightly heavy', 'Great build quality but a bit heavier than expected. Laptop fits perfectly though.', 'approved', '', '2026-02-05 14:00:00'],
    [1, 4, 'Amit K.', 5, 'Worth every rupee', 'I\'ve been using this for a month now. The quality is outstanding.', 'approved', '', '2026-02-10 09:00:00'],
    [2, 2, 'Rahul S.', 4, 'Great daily backpack', 'Love the anti-theft design and USB port. Very convenient for daily commute.', 'approved', '', '2026-02-08 10:00:00'],
    [2, 5, 'Sneha D.', 5, 'Perfect for college', 'Fits my laptop, books, and water bottle perfectly. Very comfortable to carry.', 'approved', '', '2026-02-12 11:00:00'],
    [3, 3, 'Priya P.', 5, 'Amazing travel bag', 'Used this for a weekend trip. The shoe compartment is a game changer!', 'approved', '', '2026-02-15 10:00:00'],
    [5, 5, 'Sneha D.', 5, 'Gorgeous bag!', 'Absolutely love this tote. The detachable pouch is very handy.', 'approved', 'So glad you love it!', '2026-02-18 12:00:00'],
    [4, 4, 'Amit K.', 4, 'Great for my kid', 'My son loves it. The reflective strips give extra safety. Rain cover is a nice touch.', 'approved', '', '2026-02-20 10:00:00'],
    [8, 2, 'Rahul S.', 5, 'Built like a tank', 'Used this for a Himalayan trek. Absolutely rugged and reliable.', 'approved', '', '2026-02-22 10:00:00'],
    [10, 3, 'Priya P.', 4, 'Smooth spinner wheels', 'The 360° wheels glide effortlessly. TSA lock is very convenient for international travel.', 'approved', '', '2026-02-25 10:00:00'],
    [6, 4, 'Amit K.', 3, 'Decent sling bag', 'Good for basic use but could use a slightly wider strap for comfort.', 'pending', '', '2026-02-26 10:00:00'],
    [2, 6, 'Vikram S.', 2, 'Zipper broke after 2 weeks', 'The main zipper broke after just 2 weeks of use. Disappointing quality.', 'pending', '', '2026-02-27 10:00:00'],
];

$stmt = $db->prepare('INSERT INTO hjk_reviews (product_id, user_id, user_name, rating, title, comment, status, admin_reply, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($reviews as $r) {
    $stmt->execute($r);
}
echo "  " . count($reviews) . " reviews seeded.\n";

// 7. Seed Delivery Options
echo "Seeding delivery options...\n";
$deliveryOptions = [
    ['SpeedPost', 'India Post SpeedPost service', '5-7', 80, 1500, 1, 1],
    ['BlueDart Express', 'BlueDart premium delivery', '2-3', 150, 3000, 1, 2],
    ['Delhivery Standard', 'Delhivery standard shipping', '4-6', 60, 1500, 1, 3],
    ['DTDC Economy', 'DTDC economy shipping', '7-10', 40, 1000, 1, 4],
];

$stmt = $db->prepare('INSERT INTO hjk_delivery_options (name, description, estimated_days, cost, free_above, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
foreach ($deliveryOptions as $d) {
    $stmt->execute($d);
}
echo "  " . count($deliveryOptions) . " delivery options seeded.\n";

// 8. Seed Coupons
echo "Seeding coupons...\n";
$coupons = [
    ['WELCOME10', 'percentage', 10, 1000, 500, 1000, 156, 1, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 1],
    ['SAVE500', 'fixed', 500, 2500, null, 500, 89, 2, '2026-02-01 00:00:00', '2026-06-30 23:59:59', 1],
    ['FLAT200', 'fixed', 200, 999, null, 200, 45, 1, '2026-02-15 00:00:00', '2026-04-30 23:59:59', 1],
    ['SUMMER25', 'percentage', 25, 2000, 1000, 100, 0, 1, '2026-03-01 00:00:00', '2026-05-31 23:59:59', 0],
];

$stmt = $db->prepare('INSERT INTO hjk_coupons (code, type, value, min_order_amount, max_discount, usage_limit, used_count, per_user_limit, valid_from, valid_until, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
foreach ($coupons as $c) {
    $stmt->execute($c);
}
echo "  " . count($coupons) . " coupons seeded.\n";

// 9. Seed Orders
echo "Seeding orders...\n";

// Order 1: Delivered
$db->exec("INSERT INTO hjk_orders (order_number, user_id, subtotal, discount, coupon_code, shipping_cost, total_amount, payment_method, payment_status, payment_id, order_status, delivery_method_id, delivery_method_name, tracking_id, estimated_delivery, created_at, updated_at) VALUES ('HJK-20260215-001', 2, 2999, 0, '', 0, 2999, 'razorpay', 'paid', 'pay_mock_001', 'delivered', 1, 'SpeedPost', 'SP123456789', '2026-02-20', '2026-02-15 10:00:00', '2026-02-19 14:00:00')");
$orderId1 = $db->lastInsertId();
$db->exec("INSERT INTO hjk_order_items (order_id, product_id, product_name, variant_id, color, size, quantity, unit_price, total_price, image) VALUES ($orderId1, 1, 'Executive Pro Laptop Bag', 1, 'Black', '15.6 inch', 1, 2999, 2999, 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=150&h=150&fit=crop')");
$db->exec("INSERT INTO hjk_shipping_addresses (order_id, full_name, phone, address_line1, address_line2, city, state, pincode) VALUES ($orderId1, 'Rahul Sharma', '9876543211', '123 MG Road', 'Apt 4B', 'Mumbai', 'Maharashtra', '400001')");
$db->exec("INSERT INTO hjk_order_status_history (order_id, status, note, tracking_id, created_at) VALUES ($orderId1, 'placed', 'Order placed', '', '2026-02-15 10:00:00'), ($orderId1, 'confirmed', 'Order confirmed', '', '2026-02-15 10:30:00'), ($orderId1, 'shipped', 'Shipped via SpeedPost', 'SP123456789', '2026-02-16 08:00:00'), ($orderId1, 'delivered', 'Delivered', '', '2026-02-19 14:00:00')");

// Order 2: Shipped
$db->exec("INSERT INTO hjk_orders (order_number, user_id, subtotal, discount, coupon_code, shipping_cost, total_amount, payment_method, payment_status, payment_id, order_status, delivery_method_id, delivery_method_name, tracking_id, estimated_delivery, created_at, updated_at) VALUES ('HJK-20260220-002', 3, 2498, 498, 'WELCOME10', 0, 2000, 'razorpay', 'paid', 'pay_mock_002', 'shipped', 2, 'BlueDart Express', 'BD987654321', '2026-02-25', '2026-02-20 14:00:00', '2026-02-22 08:00:00')");
$orderId2 = $db->lastInsertId();
$db->exec("INSERT INTO hjk_order_items (order_id, product_id, product_name, variant_id, color, size, quantity, unit_price, total_price, image) VALUES ($orderId2, 5, 'Elegance Tote Bag', 11, 'Beige', 'Standard', 1, 1499, 1499, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=150&h=150&fit=crop'), ($orderId2, 6, 'Metro Crossbody Sling', 14, 'Black', 'One Size', 1, 999, 999, 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=150&h=150&fit=crop')");
$db->exec("INSERT INTO hjk_shipping_addresses (order_id, full_name, phone, address_line1, address_line2, city, state, pincode) VALUES ($orderId2, 'Priya Patel', '9876543212', '789 Park Street', '', 'Ahmedabad', 'Gujarat', '380001')");
$db->exec("INSERT INTO hjk_order_status_history (order_id, status, note, tracking_id, created_at) VALUES ($orderId2, 'placed', 'Order placed', '', '2026-02-20 14:00:00'), ($orderId2, 'confirmed', 'Order confirmed', '', '2026-02-20 15:00:00'), ($orderId2, 'shipped', 'Shipped via BlueDart', 'BD987654321', '2026-02-22 08:00:00')");

// Order 3: Confirmed
$db->exec("INSERT INTO hjk_orders (order_number, user_id, subtotal, discount, coupon_code, shipping_cost, total_amount, payment_method, payment_status, payment_id, order_status, delivery_method_id, delivery_method_name, tracking_id, estimated_delivery, created_at, updated_at) VALUES ('HJK-20260225-003', 4, 3798, 500, 'SAVE500', 0, 3298, 'razorpay', 'paid', 'pay_mock_003', 'confirmed', 1, 'SpeedPost', '', '2026-03-02', '2026-02-25 10:00:00', '2026-02-25 11:00:00')");
$orderId3 = $db->lastInsertId();
$db->exec("INSERT INTO hjk_order_items (order_id, product_id, product_name, variant_id, color, size, quantity, unit_price, total_price, image) VALUES ($orderId3, 2, 'Urban Explorer Backpack', 4, 'Charcoal Grey', '35L', 2, 1899, 3798, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=150&fit=crop')");
$db->exec("INSERT INTO hjk_shipping_addresses (order_id, full_name, phone, address_line1, address_line2, city, state, pincode) VALUES ($orderId3, 'Amit Kumar', '9876543213', '321 Nehru Place', 'Block C', 'New Delhi', 'Delhi', '110019')");
$db->exec("INSERT INTO hjk_order_status_history (order_id, status, note, created_at) VALUES ($orderId3, 'placed', 'Order placed', '2026-02-25 10:00:00'), ($orderId3, 'confirmed', 'Order confirmed', '2026-02-25 11:00:00')");

// Order 4: Placed
$db->exec("INSERT INTO hjk_orders (order_number, user_id, subtotal, discount, coupon_code, shipping_cost, total_amount, payment_method, payment_status, payment_id, order_status, created_at, updated_at) VALUES ('HJK-20260228-004', 5, 1299, 0, '', 80, 1379, 'razorpay', 'paid', 'pay_mock_004', 'placed', '2026-02-28 16:00:00', '2026-02-28 16:00:00')");
$orderId4 = $db->lastInsertId();
$db->exec("INSERT INTO hjk_order_items (order_id, product_id, product_name, variant_id, color, size, quantity, unit_price, total_price, image) VALUES ($orderId4, 9, 'Luxe Clutch Handbag', 20, 'Gold', 'One Size', 1, 1299, 1299, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=150&h=150&fit=crop')");
$db->exec("INSERT INTO hjk_shipping_addresses (order_id, full_name, phone, address_line1, address_line2, city, state, pincode) VALUES ($orderId4, 'Sneha Desai', '9876543214', '567 Koramangala', '1st Block', 'Bangalore', 'Karnataka', '560034')");
$db->exec("INSERT INTO hjk_order_status_history (order_id, status, note, created_at) VALUES ($orderId4, 'placed', 'Order placed', '2026-02-28 16:00:00')");

// Order 5: Cancelled
$db->exec("INSERT INTO hjk_orders (order_number, user_id, subtotal, discount, coupon_code, shipping_cost, total_amount, payment_method, payment_status, payment_id, order_status, created_at, updated_at) VALUES ('HJK-20260210-005', 2, 999, 0, '', 80, 1079, 'razorpay', 'paid', 'pay_mock_005', 'cancelled', '2026-02-10 10:00:00', '2026-02-10 14:00:00')");
$orderId5 = $db->lastInsertId();
$db->exec("INSERT INTO hjk_order_items (order_id, product_id, product_name, variant_id, color, size, quantity, unit_price, total_price, image) VALUES ($orderId5, 4, 'Scholar Plus School Bag', 8, 'Blue', 'Medium (25L)', 1, 999, 999, 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=150&h=150&fit=crop')");
$db->exec("INSERT INTO hjk_shipping_addresses (order_id, full_name, phone, address_line1, address_line2, city, state, pincode) VALUES ($orderId5, 'Rahul Sharma', '9876543211', '123 MG Road', 'Apt 4B', 'Mumbai', 'Maharashtra', '400001')");
$db->exec("INSERT INTO hjk_order_status_history (order_id, status, note, created_at) VALUES ($orderId5, 'placed', 'Order placed', '2026-02-10 10:00:00'), ($orderId5, 'cancelled', 'Cancelled by customer: Changed my mind', '2026-02-10 14:00:00')");

echo "  5 orders seeded.\n";

// 10. Seed Returns
echo "Seeding returns...\n";
$db->exec("INSERT INTO hjk_returns (order_id, order_number, user_id, reason, description, video_url, status, admin_note) VALUES ($orderId1, 'HJK-20260215-001', 2, 'damaged', 'Bag strap stitching came undone after first use', 'unboxing_video.mp4', 'pending', '')");
$returnId = $db->lastInsertId();
$db->exec("INSERT INTO hjk_return_items (return_id, product_id, variant_id, size, quantity, reason) VALUES ($returnId, 1, 1, '15.6 inch', 1, 'damaged')");
echo "  1 return seeded.\n";

// 11. Seed Settings
echo "Seeding settings...\n";
$settings = [
    ['site_name', 'HJKCollections'],
    ['tagline', 'Premium Bags for Every Occasion'],
    ['logo', 'assets/images/logo.png'],
    ['favicon', 'assets/images/favicon.ico'],
    ['social_facebook', 'https://facebook.com/hjkcollections'],
    ['social_instagram', 'https://instagram.com/hjkcollections'],
    ['social_twitter', 'https://twitter.com/hjkcollections'],
    ['social_youtube', 'https://youtube.com/hjkcollections'],
    ['social_whatsapp', '919876543210'],
    ['map_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241317.1160984!2d72.7411!3d19.0825!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai!5e0!3m2!1sen!2sin!4v1'],
    ['contact_email', 'support@hjkcollections.com'],
    ['contact_phone', '+91 98765 43210'],
    ['address', '123 Business Park, Andheri East, Mumbai, Maharashtra 400069'],
    ['header_announcement', 'Free shipping on orders above ₹1,500! | Use code WELCOME10 for 10% off'],
    ['footer_about', 'HJKCollections brings you the finest collection of bags crafted with premium materials. From everyday essentials to luxury travel companions, find the perfect bag for every occasion.'],
    ['currency', 'INR'],
    ['currency_symbol', '₹'],
    ['free_shipping_above', '1500'],
];

$stmt = $db->prepare('INSERT INTO hjk_settings (setting_key, setting_value) VALUES (?, ?)');
foreach ($settings as $s) {
    $stmt->execute($s);
}
echo "  " . count($settings) . " settings seeded.\n";

// 12. Seed Banners
echo "Seeding banners...\n";
$banners = [
    ['New Arrivals 2026', 'Discover our latest collection of premium bags', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1400&h=500&fit=crop', 'Shop Now', 'products.html?sort=newest', 1, 1],
    ['Laptop Bags', 'Professional bags for the modern workspace', 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1400&h=500&fit=crop', 'Explore Collection', 'products.html?category=laptop-bags', 1, 2],
    ['Travel in Style', 'Up to 30% off on travel bags this season', 'https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=1400&h=500&fit=crop', 'Shop Travel Bags', 'products.html?category=travel-bags', 1, 3],
];

$stmt = $db->prepare('INSERT INTO hjk_banners (title, subtitle, image, button_text, link_url, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
foreach ($banners as $b) {
    $stmt->execute($b);
}
echo "  " . count($banners) . " banners seeded.\n";

// 13. Seed CMS Pages
echo "Seeding CMS pages...\n";
$pages = [
    ['about', 'About Us', '<h3>Our Story</h3><p>Founded in 2020, HJKCollections started with a simple vision — to provide premium quality bags that combine style, functionality, and durability. What began as a small workshop has grown into one of India\'s most trusted bag brands.</p><h3>Our Mission</h3><p>We believe that a great bag is more than just an accessory — it\'s a companion for life\'s journey. Every HJK bag is crafted with meticulous attention to detail, using the finest materials sourced from trusted suppliers.</p><h3>Why Choose Us</h3><ul><li>Premium quality materials</li><li>Handcrafted with precision</li><li>30-day easy returns</li><li>Free shipping on orders above ₹1,500</li><li>1-year warranty on all products</li></ul>', ''],
    ['contact', 'Contact Us', '<p>We\'d love to hear from you! Whether you have a question about our products, need help with an order, or just want to say hello — our team is here for you.</p><h3>Business Hours</h3><p>Monday to Saturday: 10:00 AM - 7:00 PM<br>Sunday: Closed</p>', ''],
    ['terms', 'Terms & Conditions', '<h3>1. General</h3><p>By accessing and using HJKCollections website, you agree to be bound by these Terms and Conditions.</p><h3>2. Products</h3><p>All products are subject to availability. We reserve the right to limit quantities.</p><h3>3. Pricing</h3><p>All prices are in Indian Rupees (INR) and inclusive of GST unless stated otherwise.</p><h3>4. Orders</h3><p>We reserve the right to refuse any order at our discretion. Orders may be cancelled if payment verification fails.</p><h3>5. Shipping</h3><p>Delivery timelines are estimates and may vary based on location and availability.</p>', ''],
    ['privacy', 'Privacy Policy', '<h3>Information We Collect</h3><p>We collect personal information that you provide directly, including name, email, phone number, and address.</p><h3>How We Use Information</h3><p>Your information is used to process orders, improve our services, and communicate with you about promotions and updates.</p><h3>Data Security</h3><p>We implement industry-standard security measures to protect your personal information.</p>', ''],
    ['shipping-policy', 'Shipping Policy', '<h3>Shipping Methods</h3><p>We offer multiple shipping options including SpeedPost, BlueDart, and Delhivery.</p><h3>Delivery Time</h3><p>Standard delivery: 5-7 business days<br>Express delivery: 2-3 business days</p><h3>Free Shipping</h3><p>Free shipping on all orders above ₹1,500.</p><h3>Tracking</h3><p>Tracking information will be shared via email once your order is shipped.</p>', ''],
];

$stmt = $db->prepare('INSERT INTO hjk_cms_pages (slug, title, content, meta_description) VALUES (?, ?, ?, ?)');
foreach ($pages as $p) {
    $stmt->execute($p);
}
echo "  " . count($pages) . " CMS pages seeded.\n";

// 14. Seed Activity Log
echo "Seeding activity log...\n";
$logs = [
    [1, 'product_created', 'Created product "Executive Pro Laptop Bag"', 'product', 1, '2026-01-10 10:00:00'],
    [1, 'order_confirmed', 'Confirmed order HJK-20260215-001', 'order', $orderId1, '2026-02-15 10:30:00'],
    [1, 'review_approved', 'Approved review by Rahul S.', 'review', 1, '2026-02-02 09:00:00'],
    [1, 'coupon_created', 'Created coupon "WELCOME10"', 'coupon', 1, '2026-01-01 10:00:00'],
    [1, 'category_created', 'Created category "Laptop Bags"', 'category', 1, '2026-01-01 08:00:00'],
];

$stmt = $db->prepare('INSERT INTO hjk_activity_log (user_id, action, description, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)');
foreach ($logs as $l) {
    $stmt->execute($l);
}
echo "  " . count($logs) . " activity logs seeded.\n";

echo "\n=== Seeding Complete! ===\n";
echo "All 22 tables created and populated.\n";
