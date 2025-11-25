const mongoose = require('mongoose');
const Event = require('./models/Event');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Connection error:', err));

const sampleEvents = [
  {
    title: 'Startup Pitch Competition 2025',
    description: 'Present your innovative startup idea to industry experts and investors. Win prizes worth ₹50,000!',
    date: new Date('2025-12-15'),
    time: '10:00 AM - 4:00 PM',
    venue: 'Auditorium, Block A',
    type: 'competition',
    maxParticipants: 50,
    status: 'upcoming',
  },
  {
    title: 'Entrepreneurship Workshop',
    description: 'Learn the fundamentals of starting and scaling your own business from successful entrepreneurs.',
    date: new Date('2025-12-20'),
    time: '2:00 PM - 5:00 PM',
    venue: 'Seminar Hall, Block B',
    type: 'workshop',
    maxParticipants: 100,
    status: 'upcoming',
  },
  {
    title: 'Networking Meetup',
    description: 'Connect with fellow entrepreneurs, investors, and mentors in an informal setting.',
    date: new Date('2025-12-25'),
    time: '6:00 PM - 8:00 PM',
    venue: 'Cafeteria',
    type: 'networking',
    maxParticipants: 80,
    status: 'upcoming',
  },
  {
    title: 'Innovation Summit 2025',
    description: 'Annual summit featuring keynote speakers from top tech companies and startups.',
    date: new Date('2026-01-10'),
    time: '9:00 AM - 6:00 PM',
    venue: 'Main Auditorium',
    type: 'seminar',
    maxParticipants: 200,
    status: 'upcoming',
  },
];

async function seedDatabase() {
  try {
    // Clear existing events
    await Event.deleteMany({});
    console.log('🗑️  Cleared existing events');

    // Insert sample events
    const insertedEvents = await Event.insertMany(sampleEvents);
    console.log(`✅ Successfully seeded ${insertedEvents.length} events`);

    console.log('\n📅 Seeded Events:');
    insertedEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} - ${event.date.toDateString()}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();