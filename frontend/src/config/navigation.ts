import { LayoutDashboard, Users, Building2, Network, Calendar, ClipboardCheck, MapPin, Gift, Image, MessageSquareHeart, Star, BarChart3, HelpCircle } from 'lucide-react';

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
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Projects',
    path: '/projects',
    icon: Building2,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Hot Deals',
    path: '/projects?filter=hot',
    icon: Star,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Featured Properties',
    path: '/projects?filter=featured',
    icon: Star,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Bookings',
    path: '/bookings',
    icon: Calendar,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Demo Bookings',
    path: '/demo-bookings',
    icon: MapPin,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Site Visits',
    path: '/site-visits',
    icon: MapPin,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Teams / Hierarchy',
    path: '/team',
    icon: Network,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Users / Team Management',
    path: '/users',
    icon: Users,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER'], // Normal associates do not manage users
  },
  {
    label: 'Reports',
    path: '/commissions',
    icon: BarChart3,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Commission Requests',
    path: '/authorizations',
    icon: ClipboardCheck,
    allowedRoles: ['MD'],
  },
  {
    label: 'Offers',
    path: '/offers',
    icon: Gift,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'],
  },
  {
    label: 'Carousel CMS',
    path: '/cms/carousel',
    icon: Image,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER'],
  },
  {
    label: 'Popup CMS',
    path: '/cms/popup',
    icon: MessageSquareHeart,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER'],
  },
  {
    label: 'FAQ / Help',
    path: '/faq',
    icon: HelpCircle,
    allowedRoles: ['MD', 'CHANNEL_PARTNER_MANAGER', 'ASSOCIATE'],
  }
];
