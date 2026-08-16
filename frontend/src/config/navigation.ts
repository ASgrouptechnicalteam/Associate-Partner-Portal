import { LayoutDashboard, Users, Building2, Network, Calendar, IndianRupee, Car, ClipboardCheck, MapPin, Gift, Image, MessageSquareHeart, Star, BarChart3, HelpCircle } from 'lucide-react';

export interface NavigationItem {
  label: string;
  path: string;
  icon: React.ElementType;
  allowedRoles: string[];
}

export const navigationConfig: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Projects',
    path: '/projects',
    icon: Building2,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Associates',
    path: '/users',
    icon: Users,
    allowedRoles: ['MD'],
  },
  {
    label: 'Team',
    path: '/team',
    icon: Network,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Bookings',
    path: '/bookings',
    icon: Calendar,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Commissions',
    path: '/commissions',
    icon: IndianRupee,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Travel Allowance',
    path: '/travel',
    icon: Car,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Commission Requests',
    path: '/authorizations',
    icon: ClipboardCheck,
    allowedRoles: ['MD'],
  },
  {
    label: 'Site Visits',
    path: '/site-visits',
    icon: MapPin,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Offers',
    path: '/offers',
    icon: Gift,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Carousel CMS',
    path: '/cms/carousel',
    icon: Image,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER'],
  },
  {
    label: 'Popup CMS',
    path: '/cms/popup',
    icon: MessageSquareHeart,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER'],
  },

  {
    label: 'Review Requests',
    path: '/reviews/requests',
    icon: Star,
    allowedRoles: ['ASSOCIATE'],
  },
  {
    label: 'Review Analytics',
    path: '/reviews/analytics',
    icon: BarChart3,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER'],
  },

  {
    label: 'FAQ / Help',
    path: '/faq',
    icon: HelpCircle,
    allowedRoles: ['MD', 'ASSOCIATE_MANAGER', 'ASSOCIATE'],
  },
];
