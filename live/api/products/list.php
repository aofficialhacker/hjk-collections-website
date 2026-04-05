<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$db = Database::getInstance();

// Query params
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = min(50, max(1, (int)($_GET['per_page'] ?? 12)));
$category = $_GET['category'] ?? '';
$search = $_GET['search'] ?? '';
$sort = $_GET['sort'] ?? 'newest';
$minPrice = $_GET['min_price'] ?? '';
$maxPrice = $_GET['max_price'] ?? '';
$color = $_GET['color'] ?? '';
$rating = $_GET['rating'] ?? '';
$featured = $_GET['featured'] ?? '';

// Build query
$where = ['p.is_active = 1'];
$params = [];

if (!empty($category)) {
    $where[] = 'c.slug = ?';
    $params[] = $category;
}

if (!empty($search)) {
    $where[] = '(p.name LIKE ? OR p.short_description LIKE ? OR p.tags LIKE ?)';
    $searchTerm = "%$search%";
    $params[] = $searchTerm;
    $params[] = $searchTerm;
    $params[] = $searchTerm;
}

if (!empty($featured)) {
    $where[] = 'p.is_featured = 1';
}

if (!empty($rating)) {
    $where[] = 'p.avg_rating >= ?';
    $params[] = (float)$rating;
}

// Price filter requires join to variant_sizes
$priceJoin = '';
if (!empty($minPrice) || !empty($maxPrice) || !empty($color)) {
    $priceJoin = 'INNER JOIN hjk_product_variants pv ON pv.product_id = p.id INNER JOIN hjk_variant_sizes vs ON vs.variant_id = pv.id';
    if (!empty($minPrice)) {
        $where[] = 'vs.selling_price >= ?';
        $params[] = (float)$minPrice;
    }
    if (!empty($maxPrice)) {
        $where[] = 'vs.selling_price <= ?';
        $params[] = (float)$maxPrice;
    }
    if (!empty($color)) {
        $where[] = 'pv.color = ?';
        $params[] = $color;
    }
}

$whereClause = implode(' AND ', $where);

// Sort
$orderBy = match($sort) {
    'price_low' => 'min_price ASC',
    'price_high' => 'min_price DESC',
    'name_asc' => 'p.name ASC',
    'name_desc' => 'p.name DESC',
    'rating' => 'p.avg_rating DESC',
    'popular' => 'p.total_sold DESC',
    default => 'p.created_at DESC',
};

// Count total
$countSql = "SELECT COUNT(DISTINCT p.id) FROM hjk_products p LEFT JOIN hjk_categories c ON c.id = p.category_id $priceJoin WHERE $whereClause";
$countStmt = $db->prepare($countSql);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

// Fetch products
$offset = ($page - 1) * $perPage;
$sql = "SELECT DISTINCT p.id, p.category_id AS categoryId, p.name, p.slug, p.short_description AS shortDescription, p.is_featured AS isFeatured, p.is_active AS isActive, p.avg_rating AS averageRating, p.review_count AS totalReviews, p.total_sold AS totalSold, p.tags, p.created_at AS createdAt, c.name AS categoryName, c.slug AS categorySlug,
    (SELECT MIN(vs2.selling_price) FROM hjk_product_variants pv2 JOIN hjk_variant_sizes vs2 ON vs2.variant_id = pv2.id WHERE pv2.product_id = p.id) AS min_price
    FROM hjk_products p
    LEFT JOIN hjk_categories c ON c.id = p.category_id
    $priceJoin
    WHERE $whereClause
    ORDER BY $orderBy
    LIMIT $perPage OFFSET $offset";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

// Assemble variants for each product
$productIds = array_column($products, 'id');

if (!empty($productIds)) {
    $placeholders = implode(',', array_fill(0, count($productIds), '?'));

    // Get variants
    $vStmt = $db->prepare("SELECT id, product_id, color, color_hex AS colorHex, sort_order FROM hjk_product_variants WHERE product_id IN ($placeholders) ORDER BY sort_order");
    $vStmt->execute($productIds);
    $variants = $vStmt->fetchAll();

    $variantIds = array_column($variants, 'id');

    // Get images
    $images = [];
    if (!empty($variantIds)) {
        $vPlaceholders = implode(',', array_fill(0, count($variantIds), '?'));
        $iStmt = $db->prepare("SELECT variant_id, image_url FROM hjk_variant_images WHERE variant_id IN ($vPlaceholders) ORDER BY sort_order");
        $iStmt->execute($variantIds);
        foreach ($iStmt->fetchAll() as $img) {
            $images[$img['variant_id']][] = $img['image_url'];
        }
    }

    // Get sizes
    $sizes = [];
    if (!empty($variantIds)) {
        $sStmt = $db->prepare("SELECT variant_id, size, normal_price AS normalPrice, selling_price AS sellingPrice, stock, sku FROM hjk_variant_sizes WHERE variant_id IN ($vPlaceholders)");
        $sStmt->execute($variantIds);
        foreach ($sStmt->fetchAll() as $sz) {
            $sz['normalPrice'] = (float)$sz['normalPrice'];
            $sz['sellingPrice'] = (float)$sz['sellingPrice'];
            $sz['stock'] = (int)$sz['stock'];
            $sizes[$sz['variant_id']][] = $sz;
            unset($sizes[$sz['variant_id']][array_key_last($sizes[$sz['variant_id']])]['variant_id']);
        }
    }

    // Map variants to products
    $productVariants = [];
    foreach ($variants as $v) {
        $vid = $v['id'];
        $productVariants[$v['product_id']][] = [
            'id' => (int)$vid,
            'color' => $v['color'],
            'colorHex' => $v['colorHex'],
            'images' => $images[$vid] ?? [],
            'sizes' => $sizes[$vid] ?? [],
        ];
    }

    foreach ($products as &$p) {
        $p['id'] = (int)$p['id'];
        $p['categoryId'] = (int)$p['categoryId'];
        $p['isFeatured'] = (bool)$p['isFeatured'];
        $p['isActive'] = (bool)$p['isActive'];
        $p['averageRating'] = (float)$p['averageRating'];
        $p['totalReviews'] = (int)$p['totalReviews'];
        $p['totalSold'] = (int)$p['totalSold'];
        $p['tags'] = json_decode($p['tags'] ?? '[]');
        $p['variants'] = $productVariants[$p['id']] ?? [];
        unset($p['min_price']);
    }
}

Response::paginated($products, $total, $page, $perPage);
