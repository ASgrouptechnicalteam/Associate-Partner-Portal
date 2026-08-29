import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const faqs = [
    {
      question: 'How do I add a new lead?',
      answer: 'To add a new lead, go to the Leads section in the sidebar and click on "Add Lead". Fill in the necessary details and save.',
      category: 'General',
      displayOrder: 1,
      roleVisibility: ["MD", "CHANNEL_PARTNER_MANAGER", "ASSOCIATE"]
    },
    {
      question: 'How are commissions calculated?',
      answer: 'Commissions are calculated based on the project tier and your designation percentage. Check the "Commissions" tab for a detailed breakdown of your earnings.',
      category: 'Commissions',
      displayOrder: 2,
      roleVisibility: ["MD", "CHANNEL_PARTNER_MANAGER", "ASSOCIATE"]
    },
    {
      question: 'What is the difference between Demo Booking and Site Visit?',
      answer: 'A Demo Booking is when a representative explains the project details either online or at a preliminary location. A Site Visit is when you physically take the customer to the project location.',
      category: 'Bookings',
      displayOrder: 3,
      roleVisibility: ["MD", "CHANNEL_PARTNER_MANAGER", "ASSOCIATE"]
    },
    {
      question: 'How can I reset my password?',
      answer: 'You can reset your password from the Profile page under Security Settings. Alternatively, your Channel Partner Manager or MD can reset it for you.',
      category: 'Account',
      displayOrder: 4,
      roleVisibility: ["MD", "CHANNEL_PARTNER_MANAGER", "ASSOCIATE"]
    },
    {
      question: 'Where can I find the layout plans?',
      answer: 'Layout plans are available inside the Project Details view. Select a project from the Hot Deals or Inventory page and click on the "Layout Viewer" tab.',
      category: 'Inventory',
      displayOrder: 5,
      roleVisibility: ["MD", "CHANNEL_PARTNER_MANAGER", "ASSOCIATE"]
    }
  ];

  console.log('Seeding FAQs...');
  for (const faq of faqs) {
    await prisma.faq.create({
      data: faq
    });
  }
  console.log('FAQs seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
