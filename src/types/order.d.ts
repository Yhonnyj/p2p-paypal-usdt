export type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export type Order = {
  id: string;
  platform: string;
  to: string;
  amount: number;
  finalUsd: number;
  finalUsdt: number;
  paypalEmail: string;
  wallet: string;
  status: OrderStatus;
  createdAt: string;
  user: {
    email: string;
    fullName: string;
  };
};
