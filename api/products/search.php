<?php
require_once __DIR__ . '/../config/Env.php';
Env::load();
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/Response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$q = trim($_GET['q'] ?? '');
if (strlen($q) < 2) {
    Response::success([]);
}

$db = Database::getInstance();
$searchTerm = "%$q%";

$stmt = $db->prepare('SELECT p.id, p.name, p.slug, p.short_description AS shortDescription, c.name AS categoryName, c.slug AS categorySlug,
    (SELECT vi.image_url FROM hjk_product_variants pv2 JOIN hjk_variant_images vi ON vi.variant_id = pv2.id WHERE pv2.product_id = p.id ORDER BY pv2.sort_order, vi.sort_order LIMIT 1) AS image,
    (SELECT MIN(vs.selling_price) FROM hjk_product_variants pv3 JOIN hjk_variant_sizes vs ON vs.variant_id = pv3.id WHERE pv3.product_id = p.id) AS price
    FROM hjk_products p
    LEFT JOIN hjk_categories c ON c.id = p.category_id
    WHERE p.is_active = 1 AND (p.name LIKE ? OR p.short_description LIKE ? OR p.tags LIKE ?)
    ORDER BY p.name ASC
    LIMIT 10');
$stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
$results = $stmt->fetchAll();

foreach ($results as &$r) {
    $r['id'] = (int)$r['id'];
    $r['price'] = (float)$r['price'];
}

Response::success($results);
