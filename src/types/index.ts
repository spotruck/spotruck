export type UserRole = "foodtrucker" | "organisateur" | "admin";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Foodtrucker {
  id: string;
  profile_id: string;
  business_name: string;
  description: string;
  cuisine_types: string[];
  photos: string[];
  price_range: "budget" | "medium" | "premium";
  min_guests: number;
  max_guests: number;
  location_radius_km: number;
  base_city: string;
  rating: number;
  reviews_count: number;
  is_verified: boolean;
  stripe_account_id?: string;
  created_at: string;
}

export interface Event {
  id: string;
  organisateur_id: string;
  title: string;
  description: string;
  event_type: string;
  date_start: string;
  date_end: string;
  location: string;
  city: string;
  expected_guests: number;
  budget_min: number;
  budget_max: number;
  status: "draft" | "published" | "confirmed" | "completed" | "cancelled";
  created_at: string;
}

export interface Booking {
  id: string;
  event_id: string;
  foodtrucker_id: string;
  organisateur_id: string;
  status: "pending" | "accepted" | "refused" | "cancelled" | "completed";
  price: number;
  stripe_payment_intent_id?: string;
  message?: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
}
