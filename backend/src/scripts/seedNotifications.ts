import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateEventKey = (type: string, id: string) => `DEV_SEED__`;

async function main() {
  console.log('Starting development notification seed...');

  const md = await prisma.user.findUnique({ where: { userIdentifier: 'MD-001' } });
  const am = await prisma.user.findUnique({ where: { userIdentifier: 'AM-001' } });

  if (!md || !am) {
    throw new Error('Test users MD-001 or AM-001 not found.');
  }

  const users = [md, am];

  const devNotifications = [
    {
      category: 'Project',
      title: 'New Project Added',
      message: 'Green Valley Villas has been added to Projects.',
      entityType: 'Project',
      entityId: 'dev-proj-1',
      actionUrl: '/projects/dev-proj-1',
      eventKey: generateEventKey('PROJECT_ADDED', '1')
    },
    {
      category: 'Approval',
      title: 'Project Approval Required',
      message: 'A project has been submitted for your approval.',
      entityType: 'Project',
      entityId: 'dev-proj-2',
      actionUrl: '/projects/dev-proj-2',
      eventKey: generateEventKey('PROJECT_APPROVAL', '2')
    },
    {
      category: 'Project',
      title: 'Project Approved',
      message: 'Sunrise Heights has been approved.',
      entityType: 'Project',
      entityId: 'dev-proj-3',
      actionUrl: '/projects/dev-proj-3',
      eventKey: generateEventKey('PROJECT_APPROVED', '3')
    },
    {
      category: 'Offer',
      title: 'New Offer Available',
      message: 'A new Summer Booking Offer is available for your team.',
      entityType: 'Offer',
      entityId: 'dev-offer-1',
      actionUrl: '/offers',
      eventKey: generateEventKey('NEW_OFFER', '4')
    },
    {
      category: 'Booking',
      title: 'New Booking',
      message: 'A new booking has been created for Unit 101.',
      entityType: 'Booking',
      entityId: 'dev-book-1',
      actionUrl: '/bookings/dev-book-1',
      eventKey: generateEventKey('NEW_BOOKING', '5')
    },
    {
      category: 'Booking',
      title: 'Booking Status Updated',
      message: 'Booking for Unit 101 has been confirmed.',
      entityType: 'Booking',
      entityId: 'dev-book-1',
      actionUrl: '/bookings/dev-book-1',
      eventKey: generateEventKey('BOOKING_UPDATED', '6')
    },
    {
      category: 'Site Visit',
      title: 'Site Visit Scheduled',
      message: 'Site visit scheduled for tomorrow at 3:30 PM.',
      entityType: 'SiteVisit',
      entityId: 'dev-sv-1',
      actionUrl: '/site-visits/dev-sv-1',
      eventKey: generateEventKey('SITE_VISIT_SCHEDULED', '7')
    },
    {
      category: 'Site Visit',
      title: 'Site Visit Completed',
      message: 'Site visit for client John Doe was marked as completed.',
      entityType: 'SiteVisit',
      entityId: 'dev-sv-1',
      actionUrl: '/site-visits/dev-sv-1',
      eventKey: generateEventKey('SITE_VISIT_COMPLETED', '8')
    },
    {
      category: 'Demo',
      title: 'Demo Booking Scheduled',
      message: 'Project demo scheduled for tomorrow.',
      entityType: 'DemoBooking',
      entityId: 'dev-demo-1',
      actionUrl: '/demo-bookings',
      eventKey: generateEventKey('DEMO_SCHEDULED', '9')
    },
    {
      category: 'Demo',
      title: 'Demo Booking Status Updated',
      message: 'Demo booking was successfully completed.',
      entityType: 'DemoBooking',
      entityId: 'dev-demo-1',
      actionUrl: '/demo-bookings',
      eventKey: generateEventKey('DEMO_UPDATED', '10')
    }
  ];

  for (const user of users) {
    if (!user) continue;
    console.log('Seeding for user: ' + user.userIdentifier);
    for (const notif of devNotifications) {
      const existing = await prisma.notification.findFirst({
        where: { userId: user.id, eventKey: notif.eventKey }
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            ...notif,
            userId: user.id,
            isRead: false,
            isDismissed: false
          }
        });
      }
    }
  }

  console.log('Development notification seed completed successfully.');
}

main().catch(e => { console.error(e); }).finally(async () => { await prisma.$disconnect(); });

