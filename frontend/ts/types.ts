export interface Admin {
  name: string;
  email: string;
  role: string;
  phone: string;
  gymName: string;
  address: string;
  capacity?: number;
  currency?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  joiningDate: string;
  membershipPlan: string;
  startDate: string;
  expiryDate: string;
  status: 'Active' | 'Expiring Soon' | 'Expired';
  trainer?: string;
  emergencyContact?: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  duration: string;
  durationDays: number;
  price: number;
  description: string;
  features: string[];
  status: string;
}

export interface Trainer {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  experience: string;
  rating: number;
  assignedMembers: string[];
  bio?: string;
  status: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: 'Present' | 'Checked Out';
}

export interface PaymentRecord {
  id: string;
  memberId: string;
  memberName: string;
  membershipPlan: string;
  amount: number;
  date: string;
  paymentMethod: 'Cash' | 'UPI' | 'Card';
  paymentStatus: 'Paid' | 'Pending';
  reference: string;
}

export interface ExerciseItem {
  name: string;
  sets: string;
  reps: string;
  weight: string;
  target: string;
}

export interface WorkoutPlan {
  id: string;
  planName: string;
  memberName: string;
  memberId: string;
  trainerName: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  targetGoal: string;
  exercises: ExerciseItem[];
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  expiringSoon: number;
  totalTrainers: number;
  monthlyRevenue: number;
  todayAttendanceCount: number;
  insideNowCount: number;
  gymCapacity: number;
  charts: {
    labels: string[];
    revenue: number[];
    growth: number[];
    planDistribution: Record<string, number>;
  };
  recentRegistrations: Member[];
  recentPayments: PaymentRecord[];
  recentAttendance: AttendanceRecord[];
}
