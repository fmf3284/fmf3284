import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create amenities
  const amenitiesData = [
    'Pool',
    'Sauna',
    'Personal Training',
    'Group Classes',
    'Parking',
    'Mat Rental',
    'Showers',
    'Meditation Room',
    'Tea Bar',
    'Reformer Classes',
    'Mat Classes',
    'Private Sessions',
    'Olympic Lifting',
    'Nutrition Coaching',
    'Open Gym',
    'Basketball Courts',
    'Tennis',
    'Swimming Pool',
    'Racquetball',
    'Cafe',
    '1-on-1 Training',
    'Custom Programs',
    'Nutrition Plans',
    'Virtual Sessions',
  ];

  const amenities = await Promise.all(
    amenitiesData.map((name) =>
      prisma.amenity.upsert({
        where: { name },
        create: { name },
        update: {},
      })
    )
  );

  console.log(`✅ Created ${amenities.length} amenities`);

  // Create locations
  const locationsData = [
    {
      name: 'Elite Fitness Center',
      category: 'Gym',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      phone: '(212) 555-0123',
      website: 'www.elitefitness.com',
      email: 'info@elitefitness.com',
      description:
        'Elite Fitness Center is a premier fitness facility offering state-of-the-art equipment, expert personal training, and a wide variety of group fitness classes.',
      image: '💪',
      rating: 4.5,
      reviewCount: 243,
      priceRange: '$$',
      distance: '0.8 miles',
      latitude: 40.7589,
      longitude: -73.9851,
      amenityNames: ['Pool', 'Sauna', 'Personal Training', 'Group Classes', 'Parking'],
    },
    {
      name: 'Zen Yoga Studio',
      category: 'Yoga',
      address: '456 Park Avenue',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      phone: '(212) 555-0456',
      website: 'www.zenyoga.com',
      email: 'hello@zenyoga.com',
      description:
        'Zen Yoga Studio offers a peaceful sanctuary for yoga practitioners of all levels. Our experienced instructors guide you through various styles including Hatha, Vinyasa, and Yin yoga.',
      image: '🧘',
      rating: 4.8,
      reviewCount: 187,
      priceRange: '$',
      distance: '1.2 miles',
      latitude: 40.7614,
      longitude: -73.9776,
      amenityNames: ['Mat Rental', 'Showers', 'Meditation Room', 'Tea Bar'],
    },
    {
      name: 'PowerCore Pilates',
      category: 'Pilates',
      address: '789 Broadway',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      phone: '(212) 555-0789',
      website: 'www.powercorepilates.com',
      email: 'info@powercorepilates.com',
      description: 'PowerCore Pilates specializes in reformer and mat classes designed to strengthen your core and improve flexibility.',
      image: '🤸',
      rating: 4.6,
      reviewCount: 156,
      priceRange: '$$',
      distance: '1.5 miles',
      latitude: 40.7282,
      longitude: -73.9942,
      amenityNames: ['Reformer Classes', 'Mat Classes', 'Private Sessions', 'Showers'],
    },
    {
      name: 'CrossFit Downtown',
      category: 'Cross Training',
      address: '321 Fifth Avenue',
      city: 'New York',
      state: 'NY',
      zipCode: '10016',
      phone: '(212) 555-0321',
      website: 'www.crossfitdowntown.com',
      email: 'info@crossfitdowntown.com',
      description: 'High-intensity functional fitness program with expert coaches and a supportive community.',
      image: '🏋️',
      rating: 4.7,
      reviewCount: 298,
      priceRange: '$$$',
      distance: '2.1 miles',
      latitude: 40.7484,
      longitude: -73.9857,
      amenityNames: ['Olympic Lifting', 'Personal Training', 'Nutrition Coaching', 'Open Gym'],
    },
    {
      name: 'NYC Sports Complex',
      category: 'Sports Club',
      address: '654 West Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10014',
      phone: '(212) 555-0654',
      website: 'www.nycsportscomplex.com',
      email: 'info@nycsportscomplex.com',
      description: 'Full-service sports complex offering basketball, tennis, swimming, and more.',
      image: '⚽',
      rating: 4.4,
      reviewCount: 421,
      priceRange: '$$',
      distance: '2.8 miles',
      latitude: 40.7353,
      longitude: -74.0060,
      amenityNames: ['Basketball Courts', 'Tennis', 'Swimming Pool', 'Racquetball', 'Cafe'],
    },
    {
      name: 'Premium Personal Training',
      category: 'Personal Trainer',
      address: '987 Madison Avenue',
      city: 'New York',
      state: 'NY',
      zipCode: '10021',
      phone: '(212) 555-0987',
      website: 'www.premiumpersonaltraining.com',
      email: 'contact@premiumpersonaltraining.com',
      description: 'One-on-one personalized training programs tailored to your fitness goals.',
      image: '🎯',
      rating: 4.9,
      reviewCount: 89,
      priceRange: '$$$',
      distance: '1.0 miles',
      latitude: 40.7736,
      longitude: -73.9566,
      amenityNames: ['1-on-1 Training', 'Custom Programs', 'Nutrition Plans', 'Virtual Sessions'],
    },
  ];

  // Stable location IDs (1, 2, 3, etc.) for frontend compatibility
  const locationIds = ['1', '2', '3', '4', '5', '6'];

  for (let i = 0; i < locationsData.length; i++) {
    const locationData = locationsData[i];
    const { amenityNames, ...location } = locationData;
    const stableId = locationIds[i];

    const createdLocation = await prisma.location.upsert({
      where: { id: stableId },
      create: {
        id: stableId,
        ...location,
        amenities: {
          create: amenityNames.map((name) => ({
            amenity: {
              connect: { name },
            },
          })),
        },
      },
      update: {
        ...location,
      },
    });

    console.log(`✅ Created location: ${createdLocation.name} (ID: ${stableId})`);
  }

  // Create demo users
  const demoUser1 = await prisma.user.upsert({
    where: { email: 'demo@fitnessfinder.com' },
    create: {
      email: 'demo@fitnessfinder.com',
      name: 'Demo User',
    },
    update: {},
  });

  const demoUser2 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    create: {
      email: 'sarah@example.com',
      name: 'Sarah M.',
    },
    update: {},
  });

  console.log(`✅ Created demo users: ${demoUser1.email}, ${demoUser2.email}`);

  // Create bookmarks for demo user
  await prisma.bookmark.upsert({
    where: {
      userId_locationId: {
        userId: demoUser1.id,
        locationId: '1',
      },
    },
    create: {
      userId: demoUser1.id,
      locationId: '1',
    },
    update: {},
  });

  await prisma.bookmark.upsert({
    where: {
      userId_locationId: {
        userId: demoUser1.id,
        locationId: '2',
      },
    },
    create: {
      userId: demoUser1.id,
      locationId: '2',
    },
    update: {},
  });

  console.log(`✅ Created bookmarks for demo user`);

  // Create reviews
  const reviewsData = [
    {
      userId: demoUser2.id,
      locationId: '1',
      userName: 'Sarah M.',
      rating: 5,
      comment:
        'Amazing gym! The equipment is always clean and well-maintained. The staff is incredibly friendly and helpful. Highly recommend!',
    },
    {
      userId: demoUser1.id,
      locationId: '1',
      userName: 'Demo User',
      rating: 4.5,
      comment: 'Great facility with tons of equipment. Can get crowded during peak hours, but overall a solid gym.',
    },
    {
      userId: demoUser2.id,
      locationId: '2',
      userName: 'Sarah M.',
      rating: 5,
      comment: "The most calming yoga studio I've ever been to. The instructors are amazing and the space is beautiful.",
    },
    {
      userId: demoUser1.id,
      locationId: '6',
      userName: 'Demo User',
      rating: 5,
      comment: 'Excellent personal training service. My trainer created a custom program that helped me achieve my goals.',
    },
  ];

  for (const review of reviewsData) {
    await prisma.review.upsert({
      where: {
        userId_locationId: {
          userId: review.userId,
          locationId: review.locationId,
        },
      },
      create: review,
      update: {},
    });
  }

  console.log(`✅ Created ${reviewsData.length} reviews`);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
