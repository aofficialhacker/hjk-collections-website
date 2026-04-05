/* ============================================
   HJKCollections - Seed Data & localStorage Init
   ============================================ */

const HJKData = {
    init() {
        // Only seed if not already initialized
        if (!localStorage.getItem('hjk_initialized')) {
            this.seedAll();
            localStorage.setItem('hjk_initialized', 'true');
        }
    },

    resetAll() {
        const keys = [
            'hjk_users', 'hjk_addresses', 'hjk_categories', 'hjk_products',
            'hjk_reviews', 'hjk_cart', 'hjk_wishlist', 'hjk_orders',
            'hjk_coupons', 'hjk_delivery_options', 'hjk_returns',
            'hjk_settings', 'hjk_banners', 'hjk_cms_pages',
            'hjk_session', 'hjk_admin_session', 'hjk_activity_log',
            'hjk_newsletter', 'hjk_recently_viewed', 'hjk_initialized'
        ];
        keys.forEach(k => localStorage.removeItem(k));
        this.seedAll();
        localStorage.setItem('hjk_initialized', 'true');
    },

    seedAll() {
        this.seedSettings();
        this.seedBanners();
        this.seedCMSPages();
        this.seedUsers();
        this.seedAddresses();
        this.seedCategories();
        this.seedProducts();
        this.seedReviews();
        this.seedOrders();
        this.seedCoupons();
        this.seedDeliveryOptions();
        this.seedReturns();
        this.seedActivityLog();
    },

    seedSettings() {
        const settings = {
            siteName: 'HJKCollections',
            tagline: 'Premium Bags for Every Occasion',
            logo: 'assets/images/logo.png',
            favicon: 'assets/images/favicon.ico',
            socialLinks: {
                facebook: 'https://facebook.com/hjkcollections',
                instagram: 'https://instagram.com/hjkcollections',
                twitter: 'https://twitter.com/hjkcollections',
                youtube: 'https://youtube.com/hjkcollections',
                whatsapp: '919876543210'
            },
            mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241317.1160984!2d72.7411!3d19.0825!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai!5e0!3m2!1sen!2sin!4v1',
            contactEmail: 'support@hjkcollections.com',
            contactPhone: '+91 98765 43210',
            address: '123 Business Park, Andheri East, Mumbai, Maharashtra 400069',
            headerAnnouncement: 'Free shipping on orders above ₹1,500! | Use code WELCOME10 for 10% off',
            footerAbout: 'HJKCollections brings you the finest collection of bags crafted with premium materials. From everyday essentials to luxury travel companions, find the perfect bag for every occasion.',
            currency: 'INR',
            currencySymbol: '₹',
            freeShippingAbove: 1500
        };
        localStorage.setItem('hjk_settings', JSON.stringify(settings));
    },

    seedBanners() {
        const banners = [
            {
                id: 'banner_001',
                title: 'New Arrivals 2026',
                subtitle: 'Discover our latest collection of premium bags',
                image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1400&h=500&fit=crop',
                linkUrl: 'products.html?sort=newest',
                buttonText: 'Shop Now',
                isActive: true,
                sortOrder: 1
            },
            {
                id: 'banner_002',
                title: 'Laptop Bags',
                subtitle: 'Professional bags for the modern workspace',
                image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1400&h=500&fit=crop',
                linkUrl: 'products.html?category=laptop-bags',
                buttonText: 'Explore Collection',
                isActive: true,
                sortOrder: 2
            },
            {
                id: 'banner_003',
                title: 'Travel in Style',
                subtitle: 'Up to 30% off on travel bags this season',
                image: 'https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=1400&h=500&fit=crop',
                linkUrl: 'products.html?category=travel-bags',
                buttonText: 'Shop Travel Bags',
                isActive: true,
                sortOrder: 3
            }
        ];
        localStorage.setItem('hjk_banners', JSON.stringify(banners));
    },

    seedCMSPages() {
        const pages = [
            {
                id: 'cms_001', slug: 'about', title: 'About Us',
                content: '<h3>Our Story</h3><p>Founded in 2020, HJKCollections started with a simple vision — to provide premium quality bags that combine style, functionality, and durability. What began as a small workshop has grown into one of India\'s most trusted bag brands.</p><h3>Our Mission</h3><p>We believe that a great bag is more than just an accessory — it\'s a companion for life\'s journey. Every HJK bag is crafted with meticulous attention to detail, using the finest materials sourced from trusted suppliers.</p><h3>Why Choose Us</h3><ul><li>Premium quality materials</li><li>Handcrafted with precision</li><li>30-day easy returns</li><li>Free shipping on orders above ₹1,500</li><li>1-year warranty on all products</li></ul>',
                isActive: true, updatedAt: '2026-01-15T10:00:00Z'
            },
            {
                id: 'cms_002', slug: 'contact', title: 'Contact Us',
                content: '<p>We\'d love to hear from you! Whether you have a question about our products, need help with an order, or just want to say hello — our team is here for you.</p><h3>Business Hours</h3><p>Monday to Saturday: 10:00 AM - 7:00 PM<br>Sunday: Closed</p>',
                isActive: true, updatedAt: '2026-01-15T10:00:00Z'
            },
            {
                id: 'cms_003', slug: 'terms', title: 'Terms & Conditions',
                content: '<h3>1. General</h3><p>By accessing and using HJKCollections website, you agree to be bound by these Terms and Conditions.</p><h3>2. Products</h3><p>All products are subject to availability. We reserve the right to limit quantities.</p><h3>3. Pricing</h3><p>All prices are in Indian Rupees (INR) and inclusive of GST unless stated otherwise.</p><h3>4. Orders</h3><p>We reserve the right to refuse any order at our discretion. Orders may be cancelled if payment verification fails.</p><h3>5. Shipping</h3><p>Delivery timelines are estimates and may vary based on location and availability.</p>',
                isActive: true, updatedAt: '2026-01-15T10:00:00Z'
            },
            {
                id: 'cms_004', slug: 'privacy', title: 'Privacy Policy',
                content: '<h3>Information We Collect</h3><p>We collect personal information that you provide directly, including name, email, phone number, and address.</p><h3>How We Use Information</h3><p>Your information is used to process orders, improve our services, and communicate with you about promotions and updates.</p><h3>Data Security</h3><p>We implement industry-standard security measures to protect your personal information.</p>',
                isActive: true, updatedAt: '2026-01-15T10:00:00Z'
            },
            {
                id: 'cms_005', slug: 'shipping-policy', title: 'Shipping Policy',
                content: '<h3>Shipping Methods</h3><p>We offer multiple shipping options including SpeedPost, BlueDart, and Delhivery.</p><h3>Delivery Time</h3><p>Standard delivery: 5-7 business days<br>Express delivery: 2-3 business days</p><h3>Free Shipping</h3><p>Free shipping on all orders above ₹1,500.</p><h3>Tracking</h3><p>Tracking information will be shared via email once your order is shipped.</p>',
                isActive: true, updatedAt: '2026-01-15T10:00:00Z'
            }
        ];
        localStorage.setItem('hjk_cms_pages', JSON.stringify(pages));
    },

    seedUsers() {
        const users = [
            {
                id: 'usr_admin_001',
                firstName: 'Admin',
                lastName: 'HJK',
                email: 'admin@hjkcollections.com',
                phone: '9876543210',
                password: 'admin123',
                avatar: '',
                role: 'superadmin',
                isActive: true,
                notificationPrefs: { orderUpdates: true, promotions: true, newsletter: true },
                createdAt: '2025-01-01T00:00:00Z',
                updatedAt: '2025-01-01T00:00:00Z'
            },
            {
                id: 'usr_001',
                firstName: 'Rahul',
                lastName: 'Sharma',
                email: 'rahul@example.com',
                phone: '9876543211',
                password: 'password123',
                avatar: '',
                role: 'customer',
                isActive: true,
                notificationPrefs: { orderUpdates: true, promotions: false, newsletter: true },
                createdAt: '2026-01-15T10:30:00Z',
                updatedAt: '2026-02-20T14:00:00Z'
            },
            {
                id: 'usr_002',
                firstName: 'Priya',
                lastName: 'Patel',
                email: 'priya@example.com',
                phone: '9876543212',
                password: 'password123',
                avatar: '',
                role: 'customer',
                isActive: true,
                notificationPrefs: { orderUpdates: true, promotions: true, newsletter: true },
                createdAt: '2026-01-20T08:00:00Z',
                updatedAt: '2026-02-18T10:00:00Z'
            },
            {
                id: 'usr_003',
                firstName: 'Amit',
                lastName: 'Kumar',
                email: 'amit@example.com',
                phone: '9876543213',
                password: 'password123',
                avatar: '',
                role: 'customer',
                isActive: true,
                notificationPrefs: { orderUpdates: true, promotions: false, newsletter: false },
                createdAt: '2026-02-01T12:00:00Z',
                updatedAt: '2026-02-25T16:00:00Z'
            },
            {
                id: 'usr_004',
                firstName: 'Sneha',
                lastName: 'Desai',
                email: 'sneha@example.com',
                phone: '9876543214',
                password: 'password123',
                avatar: '',
                role: 'customer',
                isActive: true,
                notificationPrefs: { orderUpdates: true, promotions: true, newsletter: true },
                createdAt: '2026-02-10T09:00:00Z',
                updatedAt: '2026-02-28T11:00:00Z'
            },
            {
                id: 'usr_005',
                firstName: 'Vikram',
                lastName: 'Singh',
                email: 'vikram@example.com',
                phone: '9876543215',
                password: 'password123',
                avatar: '',
                role: 'customer',
                isActive: false,
                notificationPrefs: { orderUpdates: true, promotions: false, newsletter: false },
                createdAt: '2026-02-15T14:00:00Z',
                updatedAt: '2026-02-20T10:00:00Z'
            }
        ];
        localStorage.setItem('hjk_users', JSON.stringify(users));
    },

    seedAddresses() {
        const addresses = [
            {
                id: 'addr_001', userId: 'usr_001', label: 'Home',
                fullName: 'Rahul Sharma', phone: '9876543211',
                addressLine1: '123 MG Road', addressLine2: 'Apt 4B',
                city: 'Mumbai', state: 'Maharashtra', pincode: '400001',
                isDefault: true, createdAt: '2026-01-15T10:30:00Z'
            },
            {
                id: 'addr_002', userId: 'usr_001', label: 'Work',
                fullName: 'Rahul Sharma', phone: '9876543211',
                addressLine1: '456 Business Tower', addressLine2: 'Floor 8',
                city: 'Mumbai', state: 'Maharashtra', pincode: '400051',
                isDefault: false, createdAt: '2026-01-20T12:00:00Z'
            },
            {
                id: 'addr_003', userId: 'usr_002', label: 'Home',
                fullName: 'Priya Patel', phone: '9876543212',
                addressLine1: '789 Park Street', addressLine2: '',
                city: 'Ahmedabad', state: 'Gujarat', pincode: '380001',
                isDefault: true, createdAt: '2026-01-20T08:00:00Z'
            },
            {
                id: 'addr_004', userId: 'usr_003', label: 'Home',
                fullName: 'Amit Kumar', phone: '9876543213',
                addressLine1: '321 Nehru Place', addressLine2: 'Block C',
                city: 'New Delhi', state: 'Delhi', pincode: '110019',
                isDefault: true, createdAt: '2026-02-01T12:00:00Z'
            },
            {
                id: 'addr_005', userId: 'usr_004', label: 'Home',
                fullName: 'Sneha Desai', phone: '9876543214',
                addressLine1: '567 Koramangala', addressLine2: '1st Block',
                city: 'Bangalore', state: 'Karnataka', pincode: '560034',
                isDefault: true, createdAt: '2026-02-10T09:00:00Z'
            }
        ];
        localStorage.setItem('hjk_addresses', JSON.stringify(addresses));
    },

    seedCategories() {
        const categories = [
            {
                id: 'cat_001', name: 'Laptop Bags', slug: 'laptop-bags',
                description: 'Professional laptop bags with padded compartments for maximum protection',
                image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&h=400&fit=crop',
                isActive: true, sortOrder: 1, createdAt: '2026-01-01T00:00:00Z'
            },
            {
                id: 'cat_002', name: 'Backpacks', slug: 'backpacks',
                description: 'Versatile backpacks for everyday use, college, and adventures',
                image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
                isActive: true, sortOrder: 2, createdAt: '2026-01-01T00:00:00Z'
            },
            {
                id: 'cat_003', name: 'Travel Bags', slug: 'travel-bags',
                description: 'Spacious travel bags and duffel bags for your journeys',
                image: 'https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=400&h=400&fit=crop',
                isActive: true, sortOrder: 3, createdAt: '2026-01-01T00:00:00Z'
            },
            {
                id: 'cat_004', name: 'School Bags', slug: 'school-bags',
                description: 'Durable and stylish school bags for students of all ages',
                image: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=400&h=400&fit=crop',
                isActive: true, sortOrder: 4, createdAt: '2026-01-01T00:00:00Z'
            },
            {
                id: 'cat_005', name: 'Handbags', slug: 'handbags',
                description: 'Elegant handbags and tote bags for women',
                image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop',
                isActive: true, sortOrder: 5, createdAt: '2026-01-01T00:00:00Z'
            },
            {
                id: 'cat_006', name: 'Sling Bags', slug: 'sling-bags',
                description: 'Compact sling bags and crossbody bags for on-the-go convenience',
                image: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=400&h=400&fit=crop',
                isActive: true, sortOrder: 6, createdAt: '2026-01-01T00:00:00Z'
            }
        ];
        localStorage.setItem('hjk_categories', JSON.stringify(categories));
    },

    seedProducts() {
        const products = [
            {
                id: 'prod_001', categoryId: 'cat_001',
                name: 'Executive Pro Laptop Bag',
                slug: 'executive-pro-laptop-bag',
                shortDescription: 'Premium leather laptop bag with padded compartment and multiple organizer pockets',
                fullDescription: '<p>The Executive Pro is our flagship laptop bag, crafted from genuine leather with a water-resistant lining. Features a padded laptop compartment that fits up to 15.6" laptops, along with dedicated pockets for your tablet, charger, and accessories.</p><ul><li>Genuine leather exterior</li><li>Water-resistant inner lining</li><li>Padded laptop compartment</li><li>Multiple organizer pockets</li><li>Adjustable shoulder strap</li><li>Top carry handle</li></ul>',
                variants: [
                    {
                        id: 'var_001', color: 'Black', colorHex: '#000000',
                        images: [
                            'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: '14 inch', normalPrice: 2999, sellingPrice: 2499, stock: 25, sku: 'EXEC-BLK-14' },
                            { size: '15.6 inch', normalPrice: 3499, sellingPrice: 2999, stock: 18, sku: 'EXEC-BLK-156' }
                        ]
                    },
                    {
                        id: 'var_002', color: 'Brown', colorHex: '#8B4513',
                        images: [
                            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: '14 inch', normalPrice: 2999, sellingPrice: 2499, stock: 12, sku: 'EXEC-BRN-14' },
                            { size: '15.6 inch', normalPrice: 3499, sellingPrice: 2999, stock: 8, sku: 'EXEC-BRN-156' }
                        ]
                    },
                    {
                        id: 'var_003', color: 'Navy', colorHex: '#1A1A2E',
                        images: [
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: '15.6 inch', normalPrice: 3499, sellingPrice: 2999, stock: 5, sku: 'EXEC-NVY-156' }
                        ]
                    }
                ],
                tags: ['laptop', 'professional', 'leather', 'office'],
                isFeatured: true, isActive: true,
                averageRating: 4.5, totalReviews: 28, totalSold: 156,
                createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-02-15T08:00:00Z'
            },
            {
                id: 'prod_002', categoryId: 'cat_002',
                name: 'Urban Explorer Backpack',
                slug: 'urban-explorer-backpack',
                shortDescription: 'Stylish and functional backpack with anti-theft design and USB charging port',
                fullDescription: '<p>The Urban Explorer is designed for the modern commuter. With its anti-theft hidden zipper design and built-in USB charging port, this backpack keeps your belongings safe while keeping you connected.</p><ul><li>Anti-theft hidden zipper</li><li>USB charging port</li><li>Water-resistant fabric</li><li>Padded back panel</li><li>Multiple compartments</li></ul>',
                variants: [
                    {
                        id: 'var_004', color: 'Charcoal Grey', colorHex: '#36454F',
                        images: [
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: '30L', normalPrice: 1999, sellingPrice: 1599, stock: 40, sku: 'URB-GRY-30' },
                            { size: '35L', normalPrice: 2299, sellingPrice: 1899, stock: 30, sku: 'URB-GRY-35' }
                        ]
                    },
                    {
                        id: 'var_005', color: 'Black', colorHex: '#000000',
                        images: [
                            'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: '30L', normalPrice: 1999, sellingPrice: 1599, stock: 35, sku: 'URB-BLK-30' },
                            { size: '35L', normalPrice: 2299, sellingPrice: 1899, stock: 22, sku: 'URB-BLK-35' }
                        ]
                    }
                ],
                tags: ['backpack', 'anti-theft', 'usb', 'commute'],
                isFeatured: true, isActive: true,
                averageRating: 4.3, totalReviews: 45, totalSold: 234,
                createdAt: '2026-01-12T10:00:00Z', updatedAt: '2026-02-20T08:00:00Z'
            },
            {
                id: 'prod_003', categoryId: 'cat_003',
                name: 'Voyager Duffel Bag',
                slug: 'voyager-duffel-bag',
                shortDescription: 'Spacious duffel bag with shoe compartment, perfect for weekend getaways',
                fullDescription: '<p>The Voyager Duffel is your perfect travel companion. With a generous 55L capacity and separate shoe compartment, this bag makes packing a breeze.</p><ul><li>55L capacity</li><li>Separate shoe compartment</li><li>Water-resistant canvas</li><li>Detachable shoulder strap</li><li>Trolley sleeve</li></ul>',
                variants: [
                    {
                        id: 'var_006', color: 'Olive Green', colorHex: '#556B2F',
                        images: [
                            'https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'Medium (45L)', normalPrice: 2499, sellingPrice: 1999, stock: 20, sku: 'VOY-OLV-M' },
                            { size: 'Large (55L)', normalPrice: 2999, sellingPrice: 2499, stock: 15, sku: 'VOY-OLV-L' }
                        ]
                    },
                    {
                        id: 'var_007', color: 'Black', colorHex: '#000000',
                        images: [
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'Medium (45L)', normalPrice: 2499, sellingPrice: 1999, stock: 18, sku: 'VOY-BLK-M' },
                            { size: 'Large (55L)', normalPrice: 2999, sellingPrice: 2499, stock: 10, sku: 'VOY-BLK-L' }
                        ]
                    }
                ],
                tags: ['travel', 'duffel', 'weekend', 'gym'],
                isFeatured: true, isActive: true,
                averageRating: 4.6, totalReviews: 19, totalSold: 98,
                createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-02-18T08:00:00Z'
            },
            {
                id: 'prod_004', categoryId: 'cat_004',
                name: 'Scholar Plus School Bag',
                slug: 'scholar-plus-school-bag',
                shortDescription: 'Ergonomic school bag with reflective strips and rain cover included',
                fullDescription: '<p>Designed for young students, the Scholar Plus combines comfort with functionality. The ergonomic back panel reduces strain, while reflective strips ensure visibility in low light.</p><ul><li>Ergonomic padded back</li><li>Reflective safety strips</li><li>Rain cover included</li><li>Multiple compartments</li><li>Durable polyester fabric</li></ul>',
                variants: [
                    {
                        id: 'var_008', color: 'Blue', colorHex: '#2563EB',
                        images: [
                            'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'Small (20L)', normalPrice: 999, sellingPrice: 799, stock: 50, sku: 'SCH-BLU-S' },
                            { size: 'Medium (25L)', normalPrice: 1299, sellingPrice: 999, stock: 45, sku: 'SCH-BLU-M' }
                        ]
                    },
                    {
                        id: 'var_009', color: 'Red', colorHex: '#DC2626',
                        images: [
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'Small (20L)', normalPrice: 999, sellingPrice: 799, stock: 38, sku: 'SCH-RED-S' },
                            { size: 'Medium (25L)', normalPrice: 1299, sellingPrice: 999, stock: 30, sku: 'SCH-RED-M' }
                        ]
                    },
                    {
                        id: 'var_010', color: 'Pink', colorHex: '#EC4899',
                        images: [
                            'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'Small (20L)', normalPrice: 999, sellingPrice: 799, stock: 42, sku: 'SCH-PNK-S' },
                            { size: 'Medium (25L)', normalPrice: 1299, sellingPrice: 999, stock: 28, sku: 'SCH-PNK-M' }
                        ]
                    }
                ],
                tags: ['school', 'kids', 'student', 'ergonomic'],
                isFeatured: false, isActive: true,
                averageRating: 4.2, totalReviews: 67, totalSold: 312,
                createdAt: '2026-01-18T10:00:00Z', updatedAt: '2026-02-22T08:00:00Z'
            },
            {
                id: 'prod_005', categoryId: 'cat_005',
                name: 'Elegance Tote Bag',
                slug: 'elegance-tote-bag',
                shortDescription: 'Sophisticated leather tote bag with detachable inner pouch',
                fullDescription: '<p>The Elegance Tote is a statement piece for the modern woman. Crafted from premium faux leather, it features a spacious interior with a detachable zippered pouch for organizing essentials.</p>',
                variants: [
                    {
                        id: 'var_011', color: 'Beige', colorHex: '#D2B48C',
                        images: [
                            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'Standard', normalPrice: 1899, sellingPrice: 1499, stock: 20, sku: 'ELG-BEI-STD' }
                        ]
                    },
                    {
                        id: 'var_012', color: 'Black', colorHex: '#000000',
                        images: [
                            'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'Standard', normalPrice: 1899, sellingPrice: 1499, stock: 15, sku: 'ELG-BLK-STD' }
                        ]
                    },
                    {
                        id: 'var_013', color: 'Maroon', colorHex: '#800000',
                        images: [
                            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'Standard', normalPrice: 1899, sellingPrice: 1499, stock: 10, sku: 'ELG-MRN-STD' }
                        ]
                    }
                ],
                tags: ['handbag', 'tote', 'women', 'leather', 'office'],
                isFeatured: true, isActive: true,
                averageRating: 4.7, totalReviews: 34, totalSold: 189,
                createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-02-25T08:00:00Z'
            },
            {
                id: 'prod_006', categoryId: 'cat_006',
                name: 'Metro Crossbody Sling',
                slug: 'metro-crossbody-sling',
                shortDescription: 'Compact crossbody sling bag with RFID-blocking pocket',
                fullDescription: '<p>The Metro Crossbody is the perfect companion for daily commutes and outings. Its compact design fits all essentials while the RFID-blocking pocket keeps your cards safe.</p>',
                variants: [
                    {
                        id: 'var_014', color: 'Black', colorHex: '#000000',
                        images: [
                            'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'One Size', normalPrice: 1299, sellingPrice: 999, stock: 30, sku: 'MET-BLK-OS' }
                        ]
                    },
                    {
                        id: 'var_015', color: 'Tan', colorHex: '#D2691E',
                        images: [
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'One Size', normalPrice: 1299, sellingPrice: 999, stock: 25, sku: 'MET-TAN-OS' }
                        ]
                    }
                ],
                tags: ['sling', 'crossbody', 'compact', 'rfid'],
                isFeatured: false, isActive: true,
                averageRating: 4.1, totalReviews: 22, totalSold: 145,
                createdAt: '2026-01-22T10:00:00Z', updatedAt: '2026-02-20T08:00:00Z'
            },
            {
                id: 'prod_007', categoryId: 'cat_001',
                name: 'TechShield Laptop Sleeve',
                slug: 'techshield-laptop-sleeve',
                shortDescription: 'Slim protective laptop sleeve with shock-absorbing padding',
                fullDescription: '<p>The TechShield is designed for those who prefer minimal carry. Its shock-absorbing foam padding provides excellent protection while maintaining a slim profile.</p>',
                variants: [
                    {
                        id: 'var_016', color: 'Grey', colorHex: '#808080',
                        images: [
                            'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: '13 inch', normalPrice: 899, sellingPrice: 699, stock: 35, sku: 'TECH-GRY-13' },
                            { size: '14 inch', normalPrice: 999, sellingPrice: 799, stock: 30, sku: 'TECH-GRY-14' },
                            { size: '15.6 inch', normalPrice: 1099, sellingPrice: 899, stock: 20, sku: 'TECH-GRY-156' }
                        ]
                    },
                    {
                        id: 'var_017', color: 'Navy Blue', colorHex: '#000080',
                        images: [
                            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: '13 inch', normalPrice: 899, sellingPrice: 699, stock: 28, sku: 'TECH-NVY-13' },
                            { size: '14 inch', normalPrice: 999, sellingPrice: 799, stock: 22, sku: 'TECH-NVY-14' },
                            { size: '15.6 inch', normalPrice: 1099, sellingPrice: 899, stock: 15, sku: 'TECH-NVY-156' }
                        ]
                    }
                ],
                tags: ['laptop', 'sleeve', 'slim', 'protection'],
                isFeatured: false, isActive: true,
                averageRating: 4.4, totalReviews: 56, totalSold: 278,
                createdAt: '2026-01-25T10:00:00Z', updatedAt: '2026-02-15T08:00:00Z'
            },
            {
                id: 'prod_008', categoryId: 'cat_002',
                name: 'Adventure Trail Backpack',
                slug: 'adventure-trail-backpack',
                shortDescription: 'Rugged outdoor backpack with hydration compartment and rain cover',
                fullDescription: '<p>Built for the outdoors, the Adventure Trail is made from tear-resistant nylon with a built-in rain cover. The hydration compartment and chest/waist straps make it ideal for hiking and trekking.</p>',
                variants: [
                    {
                        id: 'var_018', color: 'Forest Green', colorHex: '#228B22',
                        images: [
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: '40L', normalPrice: 2799, sellingPrice: 2299, stock: 15, sku: 'ADV-GRN-40' },
                            { size: '50L', normalPrice: 3299, sellingPrice: 2799, stock: 10, sku: 'ADV-GRN-50' }
                        ]
                    },
                    {
                        id: 'var_019', color: 'Orange', colorHex: '#FF8C00',
                        images: [
                            'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: '40L', normalPrice: 2799, sellingPrice: 2299, stock: 12, sku: 'ADV-ORG-40' },
                            { size: '50L', normalPrice: 3299, sellingPrice: 2799, stock: 8, sku: 'ADV-ORG-50' }
                        ]
                    }
                ],
                tags: ['backpack', 'hiking', 'outdoor', 'adventure', 'trekking'],
                isFeatured: true, isActive: true,
                averageRating: 4.8, totalReviews: 15, totalSold: 67,
                createdAt: '2026-01-28T10:00:00Z', updatedAt: '2026-02-18T08:00:00Z'
            },
            {
                id: 'prod_009', categoryId: 'cat_005',
                name: 'Luxe Clutch Handbag',
                slug: 'luxe-clutch-handbag',
                shortDescription: 'Stunning evening clutch with detachable chain strap',
                fullDescription: '<p>Make a statement at every event with the Luxe Clutch. This elegant evening bag features a magnetic snap closure, satin lining, and a detachable gold chain strap.</p>',
                variants: [
                    {
                        id: 'var_020', color: 'Gold', colorHex: '#C9A96E',
                        images: [
                            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'One Size', normalPrice: 1599, sellingPrice: 1299, stock: 12, sku: 'LUX-GLD-OS' }
                        ]
                    },
                    {
                        id: 'var_021', color: 'Silver', colorHex: '#C0C0C0',
                        images: [
                            'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'One Size', normalPrice: 1599, sellingPrice: 1299, stock: 10, sku: 'LUX-SLV-OS' }
                        ]
                    },
                    {
                        id: 'var_022', color: 'Rose Gold', colorHex: '#B76E79',
                        images: [
                            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'One Size', normalPrice: 1599, sellingPrice: 1299, stock: 8, sku: 'LUX-RSG-OS' }
                        ]
                    }
                ],
                tags: ['handbag', 'clutch', 'evening', 'party', 'women'],
                isFeatured: false, isActive: true,
                averageRating: 4.6, totalReviews: 18, totalSold: 89,
                createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-02-25T08:00:00Z'
            },
            {
                id: 'prod_010', categoryId: 'cat_003',
                name: 'GlobeTrotter Trolley Bag',
                slug: 'globetrotter-trolley-bag',
                shortDescription: 'Premium hardshell trolley bag with 360° spinner wheels and TSA lock',
                fullDescription: '<p>Travel the world with the GlobeTrotter. This hardshell trolley features 360° spinner wheels for effortless mobility, a built-in TSA lock, and an expandable design for extra packing space.</p>',
                variants: [
                    {
                        id: 'var_023', color: 'Midnight Blue', colorHex: '#191970',
                        images: [
                            'https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'Cabin (20")', normalPrice: 4999, sellingPrice: 3999, stock: 10, sku: 'GLB-BLU-20' },
                            { size: 'Medium (24")', normalPrice: 5999, sellingPrice: 4999, stock: 8, sku: 'GLB-BLU-24' },
                            { size: 'Large (28")', normalPrice: 6999, sellingPrice: 5999, stock: 5, sku: 'GLB-BLU-28' }
                        ]
                    },
                    {
                        id: 'var_024', color: 'Rose Pink', colorHex: '#FF69B4',
                        images: [
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553991562-9f24b119ff51?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'Cabin (20")', normalPrice: 4999, sellingPrice: 3999, stock: 7, sku: 'GLB-PNK-20' },
                            { size: 'Medium (24")', normalPrice: 5999, sellingPrice: 4999, stock: 5, sku: 'GLB-PNK-24' }
                        ]
                    }
                ],
                tags: ['travel', 'trolley', 'luggage', 'hardshell'],
                isFeatured: true, isActive: true,
                averageRating: 4.4, totalReviews: 23, totalSold: 56,
                createdAt: '2026-02-05T10:00:00Z', updatedAt: '2026-02-28T08:00:00Z'
            },
            {
                id: 'prod_011', categoryId: 'cat_006',
                name: 'Wanderer Waist Bag',
                slug: 'wanderer-waist-bag',
                shortDescription: 'Trendy fanny pack with adjustable strap and multiple zip pockets',
                fullDescription: '<p>The Wanderer Waist Bag is perfect for festivals, travel, and everyday use. Its adjustable strap fits all body types, and multiple zip pockets keep your essentials organized and accessible.</p>',
                variants: [
                    {
                        id: 'var_025', color: 'Black', colorHex: '#000000',
                        images: [
                            'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'One Size', normalPrice: 799, sellingPrice: 599, stock: 45, sku: 'WAN-BLK-OS' }
                        ]
                    },
                    {
                        id: 'var_026', color: 'Camo', colorHex: '#4B5320',
                        images: [
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: 'One Size', normalPrice: 799, sellingPrice: 599, stock: 35, sku: 'WAN-CMO-OS' }
                        ]
                    }
                ],
                tags: ['sling', 'waist', 'fanny', 'festival'],
                isFeatured: false, isActive: true,
                averageRating: 4.0, totalReviews: 31, totalSold: 198,
                createdAt: '2026-02-08T10:00:00Z', updatedAt: '2026-02-22T08:00:00Z'
            },
            {
                id: 'prod_012', categoryId: 'cat_004',
                name: 'Campus King College Bag',
                slug: 'campus-king-college-bag',
                shortDescription: 'Trendy college backpack with laptop compartment and bottle holder',
                fullDescription: '<p>The Campus King is designed for college students who want style and functionality. Features a dedicated 15" laptop compartment, side bottle holders, and a front organizer pocket.</p>',
                variants: [
                    {
                        id: 'var_027', color: 'Navy Blue', colorHex: '#000080',
                        images: [
                            'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: '28L', normalPrice: 1499, sellingPrice: 1199, stock: 35, sku: 'CMP-NVY-28' },
                            { size: '32L', normalPrice: 1699, sellingPrice: 1399, stock: 25, sku: 'CMP-NVY-32' }
                        ]
                    },
                    {
                        id: 'var_028', color: 'Grey', colorHex: '#808080',
                        images: [
                            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop',
                            'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop'
                        ],
                        sizes: [
                            { size: '28L', normalPrice: 1499, sellingPrice: 1199, stock: 30, sku: 'CMP-GRY-28' },
                            { size: '32L', normalPrice: 1699, sellingPrice: 1399, stock: 20, sku: 'CMP-GRY-32' }
                        ]
                    }
                ],
                tags: ['school', 'college', 'student', 'laptop'],
                isFeatured: false, isActive: true,
                averageRating: 4.3, totalReviews: 42, totalSold: 267,
                createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-02-26T08:00:00Z'
            }
        ];
        localStorage.setItem('hjk_products', JSON.stringify(products));
    },

    seedReviews() {
        const reviews = [
            { id: 'rev_001', productId: 'prod_001', userId: 'usr_001', userName: 'Rahul S.', rating: 5, title: 'Excellent quality!', comment: 'The leather quality is amazing. Very professional looking. Perfect for office use.', status: 'approved', adminReply: 'Thank you for your kind words!', createdAt: '2026-02-01T12:00:00Z' },
            { id: 'rev_002', productId: 'prod_001', userId: 'usr_002', userName: 'Priya P.', rating: 4, title: 'Good bag, slightly heavy', comment: 'Great build quality but a bit heavier than expected. Laptop fits perfectly though.', status: 'approved', adminReply: '', createdAt: '2026-02-05T14:00:00Z' },
            { id: 'rev_003', productId: 'prod_001', userId: 'usr_003', userName: 'Amit K.', rating: 5, title: 'Worth every rupee', comment: 'I\'ve been using this for a month now. The quality is outstanding.', status: 'approved', adminReply: '', createdAt: '2026-02-10T09:00:00Z' },
            { id: 'rev_004', productId: 'prod_002', userId: 'usr_001', userName: 'Rahul S.', rating: 4, title: 'Great daily backpack', comment: 'Love the anti-theft design and USB port. Very convenient for daily commute.', status: 'approved', adminReply: '', createdAt: '2026-02-08T10:00:00Z' },
            { id: 'rev_005', productId: 'prod_002', userId: 'usr_004', userName: 'Sneha D.', rating: 5, title: 'Perfect for college', comment: 'Fits my laptop, books, and water bottle perfectly. Very comfortable to carry.', status: 'approved', adminReply: '', createdAt: '2026-02-12T11:00:00Z' },
            { id: 'rev_006', productId: 'prod_003', userId: 'usr_002', userName: 'Priya P.', rating: 5, title: 'Amazing travel bag', comment: 'Used this for a weekend trip. The shoe compartment is a game changer!', status: 'approved', adminReply: '', createdAt: '2026-02-15T10:00:00Z' },
            { id: 'rev_007', productId: 'prod_005', userId: 'usr_004', userName: 'Sneha D.', rating: 5, title: 'Gorgeous bag!', comment: 'Absolutely love this tote. The detachable pouch is very handy.', status: 'approved', adminReply: 'So glad you love it!', createdAt: '2026-02-18T12:00:00Z' },
            { id: 'rev_008', productId: 'prod_004', userId: 'usr_003', userName: 'Amit K.', rating: 4, title: 'Great for my kid', comment: 'My son loves it. The reflective strips give extra safety. Rain cover is a nice touch.', status: 'approved', adminReply: '', createdAt: '2026-02-20T10:00:00Z' },
            { id: 'rev_009', productId: 'prod_008', userId: 'usr_001', userName: 'Rahul S.', rating: 5, title: 'Built like a tank', comment: 'Used this for a Himalayan trek. Absolutely rugged and reliable.', status: 'approved', adminReply: '', createdAt: '2026-02-22T10:00:00Z' },
            { id: 'rev_010', productId: 'prod_010', userId: 'usr_002', userName: 'Priya P.', rating: 4, title: 'Smooth spinner wheels', comment: 'The 360° wheels glide effortlessly. TSA lock is very convenient for international travel.', status: 'approved', adminReply: '', createdAt: '2026-02-25T10:00:00Z' },
            { id: 'rev_011', productId: 'prod_006', userId: 'usr_003', userName: 'Amit K.', rating: 3, title: 'Decent sling bag', comment: 'Good for basic use but could use a slightly wider strap for comfort.', status: 'pending', adminReply: '', createdAt: '2026-02-26T10:00:00Z' },
            { id: 'rev_012', productId: 'prod_002', userId: 'usr_005', userName: 'Vikram S.', rating: 2, title: 'Zipper broke after 2 weeks', comment: 'The main zipper broke after just 2 weeks of use. Disappointing quality.', status: 'pending', adminReply: '', createdAt: '2026-02-27T10:00:00Z' }
        ];
        localStorage.setItem('hjk_reviews', JSON.stringify(reviews));
    },

    seedOrders() {
        const orders = [
            {
                id: 'ord_001', orderNumber: 'HJK-20260215-001', userId: 'usr_001',
                items: [
                    { productId: 'prod_001', productName: 'Executive Pro Laptop Bag', variantId: 'var_001', color: 'Black', size: '15.6 inch', quantity: 1, unitPrice: 2999, totalPrice: 2999, image: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=150&h=150&fit=crop' }
                ],
                shippingAddress: { fullName: 'Rahul Sharma', phone: '9876543211', addressLine1: '123 MG Road', addressLine2: 'Apt 4B', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
                subtotal: 2999, discount: 0, couponCode: '', shippingCost: 0, totalAmount: 2999,
                paymentMethod: 'razorpay', paymentStatus: 'paid', paymentId: 'pay_mock_001',
                orderStatus: 'delivered',
                statusHistory: [
                    { status: 'placed', timestamp: '2026-02-15T10:00:00Z', note: 'Order placed' },
                    { status: 'confirmed', timestamp: '2026-02-15T10:30:00Z', note: 'Order confirmed' },
                    { status: 'shipped', timestamp: '2026-02-16T08:00:00Z', note: 'Shipped via SpeedPost', trackingId: 'SP123456789' },
                    { status: 'delivered', timestamp: '2026-02-19T14:00:00Z', note: 'Delivered' }
                ],
                deliveryMethod: 'del_001', deliveryMethodName: 'SpeedPost', trackingId: 'SP123456789',
                estimatedDelivery: '2026-02-20', notes: '',
                createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-02-19T14:00:00Z'
            },
            {
                id: 'ord_002', orderNumber: 'HJK-20260220-002', userId: 'usr_002',
                items: [
                    { productId: 'prod_005', productName: 'Elegance Tote Bag', variantId: 'var_011', color: 'Beige', size: 'Standard', quantity: 1, unitPrice: 1499, totalPrice: 1499, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=150&h=150&fit=crop' },
                    { productId: 'prod_006', productName: 'Metro Crossbody Sling', variantId: 'var_014', color: 'Black', size: 'One Size', quantity: 1, unitPrice: 999, totalPrice: 999, image: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=150&h=150&fit=crop' }
                ],
                shippingAddress: { fullName: 'Priya Patel', phone: '9876543212', addressLine1: '789 Park Street', addressLine2: '', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
                subtotal: 2498, discount: 498, couponCode: 'WELCOME10', shippingCost: 0, totalAmount: 2000,
                paymentMethod: 'razorpay', paymentStatus: 'paid', paymentId: 'pay_mock_002',
                orderStatus: 'shipped',
                statusHistory: [
                    { status: 'placed', timestamp: '2026-02-20T14:00:00Z', note: 'Order placed' },
                    { status: 'confirmed', timestamp: '2026-02-20T15:00:00Z', note: 'Order confirmed' },
                    { status: 'shipped', timestamp: '2026-02-22T08:00:00Z', note: 'Shipped via BlueDart', trackingId: 'BD987654321' }
                ],
                deliveryMethod: 'del_002', deliveryMethodName: 'BlueDart Express', trackingId: 'BD987654321',
                estimatedDelivery: '2026-02-25', notes: '',
                createdAt: '2026-02-20T14:00:00Z', updatedAt: '2026-02-22T08:00:00Z'
            },
            {
                id: 'ord_003', orderNumber: 'HJK-20260225-003', userId: 'usr_003',
                items: [
                    { productId: 'prod_002', productName: 'Urban Explorer Backpack', variantId: 'var_004', color: 'Charcoal Grey', size: '35L', quantity: 2, unitPrice: 1899, totalPrice: 3798, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=150&fit=crop' }
                ],
                shippingAddress: { fullName: 'Amit Kumar', phone: '9876543213', addressLine1: '321 Nehru Place', addressLine2: 'Block C', city: 'New Delhi', state: 'Delhi', pincode: '110019' },
                subtotal: 3798, discount: 500, couponCode: 'SAVE500', shippingCost: 0, totalAmount: 3298,
                paymentMethod: 'razorpay', paymentStatus: 'paid', paymentId: 'pay_mock_003',
                orderStatus: 'confirmed',
                statusHistory: [
                    { status: 'placed', timestamp: '2026-02-25T10:00:00Z', note: 'Order placed' },
                    { status: 'confirmed', timestamp: '2026-02-25T11:00:00Z', note: 'Order confirmed' }
                ],
                deliveryMethod: 'del_001', deliveryMethodName: 'SpeedPost', trackingId: '',
                estimatedDelivery: '2026-03-02', notes: '',
                createdAt: '2026-02-25T10:00:00Z', updatedAt: '2026-02-25T11:00:00Z'
            },
            {
                id: 'ord_004', orderNumber: 'HJK-20260228-004', userId: 'usr_004',
                items: [
                    { productId: 'prod_009', productName: 'Luxe Clutch Handbag', variantId: 'var_020', color: 'Gold', size: 'One Size', quantity: 1, unitPrice: 1299, totalPrice: 1299, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=150&h=150&fit=crop' }
                ],
                shippingAddress: { fullName: 'Sneha Desai', phone: '9876543214', addressLine1: '567 Koramangala', addressLine2: '1st Block', city: 'Bangalore', state: 'Karnataka', pincode: '560034' },
                subtotal: 1299, discount: 0, couponCode: '', shippingCost: 80, totalAmount: 1379,
                paymentMethod: 'razorpay', paymentStatus: 'paid', paymentId: 'pay_mock_004',
                orderStatus: 'placed',
                statusHistory: [
                    { status: 'placed', timestamp: '2026-02-28T16:00:00Z', note: 'Order placed' }
                ],
                deliveryMethod: '', deliveryMethodName: '', trackingId: '',
                estimatedDelivery: '', notes: '',
                createdAt: '2026-02-28T16:00:00Z', updatedAt: '2026-02-28T16:00:00Z'
            },
            {
                id: 'ord_005', orderNumber: 'HJK-20260210-005', userId: 'usr_001',
                items: [
                    { productId: 'prod_004', productName: 'Scholar Plus School Bag', variantId: 'var_008', color: 'Blue', size: 'Medium (25L)', quantity: 1, unitPrice: 999, totalPrice: 999, image: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=150&h=150&fit=crop' }
                ],
                shippingAddress: { fullName: 'Rahul Sharma', phone: '9876543211', addressLine1: '123 MG Road', addressLine2: 'Apt 4B', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
                subtotal: 999, discount: 0, couponCode: '', shippingCost: 80, totalAmount: 1079,
                paymentMethod: 'razorpay', paymentStatus: 'paid', paymentId: 'pay_mock_005',
                orderStatus: 'cancelled',
                statusHistory: [
                    { status: 'placed', timestamp: '2026-02-10T10:00:00Z', note: 'Order placed' },
                    { status: 'cancelled', timestamp: '2026-02-10T14:00:00Z', note: 'Cancelled by customer: Changed my mind' }
                ],
                deliveryMethod: '', deliveryMethodName: '', trackingId: '',
                estimatedDelivery: '', notes: '',
                createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-02-10T14:00:00Z'
            }
        ];
        localStorage.setItem('hjk_orders', JSON.stringify(orders));
    },

    seedCoupons() {
        const coupons = [
            {
                id: 'coupon_001', code: 'WELCOME10', type: 'percentage', value: 10,
                minOrderAmount: 1000, maxDiscount: 500, usageLimit: 1000, usedCount: 156,
                perUserLimit: 1, validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T23:59:59Z',
                isActive: true, createdAt: '2026-01-01T00:00:00Z'
            },
            {
                id: 'coupon_002', code: 'SAVE500', type: 'fixed', value: 500,
                minOrderAmount: 2500, maxDiscount: null, usageLimit: 500, usedCount: 89,
                perUserLimit: 2, validFrom: '2026-02-01T00:00:00Z', validUntil: '2026-06-30T23:59:59Z',
                isActive: true, createdAt: '2026-02-01T00:00:00Z'
            },
            {
                id: 'coupon_003', code: 'FLAT200', type: 'fixed', value: 200,
                minOrderAmount: 999, maxDiscount: null, usageLimit: 200, usedCount: 45,
                perUserLimit: 1, validFrom: '2026-02-15T00:00:00Z', validUntil: '2026-04-30T23:59:59Z',
                isActive: true, createdAt: '2026-02-15T00:00:00Z'
            },
            {
                id: 'coupon_004', code: 'SUMMER25', type: 'percentage', value: 25,
                minOrderAmount: 2000, maxDiscount: 1000, usageLimit: 100, usedCount: 0,
                perUserLimit: 1, validFrom: '2026-03-01T00:00:00Z', validUntil: '2026-05-31T23:59:59Z',
                isActive: false, createdAt: '2026-02-28T00:00:00Z'
            }
        ];
        localStorage.setItem('hjk_coupons', JSON.stringify(coupons));
    },

    seedDeliveryOptions() {
        const options = [
            {
                id: 'del_001', name: 'SpeedPost', description: 'India Post SpeedPost service',
                estimatedDays: '5-7', cost: 80, freeAbove: 1500, isActive: true, sortOrder: 1
            },
            {
                id: 'del_002', name: 'BlueDart Express', description: 'BlueDart premium delivery',
                estimatedDays: '2-3', cost: 150, freeAbove: 3000, isActive: true, sortOrder: 2
            },
            {
                id: 'del_003', name: 'Delhivery Standard', description: 'Delhivery standard shipping',
                estimatedDays: '4-6', cost: 60, freeAbove: 1500, isActive: true, sortOrder: 3
            },
            {
                id: 'del_004', name: 'DTDC Economy', description: 'DTDC economy shipping',
                estimatedDays: '7-10', cost: 40, freeAbove: 1000, isActive: true, sortOrder: 4
            }
        ];
        localStorage.setItem('hjk_delivery_options', JSON.stringify(options));
    },

    seedReturns() {
        const returns = [
            {
                id: 'ret_001', orderId: 'ord_001', orderNumber: 'HJK-20260215-001', userId: 'usr_001',
                items: [{ productId: 'prod_001', variantId: 'var_001', size: '15.6 inch', quantity: 1, reason: 'damaged' }],
                reason: 'damaged', description: 'Bag strap stitching came undone after first use',
                videoUrl: 'unboxing_video.mp4', status: 'pending', adminNote: '',
                createdAt: '2026-02-22T10:00:00Z'
            }
        ];
        localStorage.setItem('hjk_returns', JSON.stringify(returns));
    },

    seedActivityLog() {
        const log = [
            { id: 'log_001', userId: 'usr_admin_001', action: 'product_created', description: 'Created product "Executive Pro Laptop Bag"', entityType: 'product', entityId: 'prod_001', timestamp: '2026-01-10T10:00:00Z' },
            { id: 'log_002', userId: 'usr_admin_001', action: 'order_confirmed', description: 'Confirmed order HJK-20260215-001', entityType: 'order', entityId: 'ord_001', timestamp: '2026-02-15T10:30:00Z' },
            { id: 'log_003', userId: 'usr_admin_001', action: 'review_approved', description: 'Approved review by Rahul S.', entityType: 'review', entityId: 'rev_001', timestamp: '2026-02-02T09:00:00Z' },
            { id: 'log_004', userId: 'usr_admin_001', action: 'coupon_created', description: 'Created coupon "WELCOME10"', entityType: 'coupon', entityId: 'coupon_001', timestamp: '2026-01-01T10:00:00Z' },
            { id: 'log_005', userId: 'usr_admin_001', action: 'category_created', description: 'Created category "Laptop Bags"', entityType: 'category', entityId: 'cat_001', timestamp: '2026-01-01T08:00:00Z' }
        ];
        localStorage.setItem('hjk_activity_log', JSON.stringify(log));
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    HJKData.init();
});
