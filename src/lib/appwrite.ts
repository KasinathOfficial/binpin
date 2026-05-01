import { Client, Account, Databases, Storage, ID } from "appwrite";

const client = new Client()
    .setEndpoint("https://sgp.cloud.appwrite.io/v1")
    .setProject("69ed94eb0033f1ed70e4");

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

export { client, account, databases, storage, ID };

export type BinType = 'general' | 'recyclable' | 'organic' | 'medical';

export interface Bin {
  id: string;
  name: string;
  type: BinType;
  lat: number;
  lng: number;
  city?: string | null;
  photo_url: string | null;
  notes: string | null;
  upvote_count: number;
  report_count: number;
  is_deleted: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  bin_id: string;
  text: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  rating: number;
  message: string | null;
  categories: string[];
  device_type: string;
  created_at: string;
}

export interface PageView {
  id: string;
  city: string | null;
  country: string | null;
  device_type: string;
  screen_width: number;
  created_at: string;
}

export interface BinRequest {
  id: string;
  lat: number;
  lng: number;
  city: string | null;
  address: string | null;
  description: string;
  photo_url: string | null;
  upvote_count: number;
  status: 'requested' | 'under_review' | 'action_taken' | 'installed';
  created_at: string;
}

export interface MunicipalAction {
  id: string;
  request_id: string;
  designation: string;
  action_taken: string;
  proof_url: string | null;
  created_at: string;
}
