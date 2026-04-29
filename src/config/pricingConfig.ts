export const plans = {
  FREE: {
    label: 'Free',
    description: 'Full access to all chats and video sessions for 20 days.',
    price: "20 Day free trial",
  },
  STANDARD: {
    label: 'Standard',
    description: 'Random matching with all eligible users.',
    price: "350 ETB",
  },
  PRO: {
    label: 'Pro',
    description:
      'Gender-priority matching: men see women, women see men, including both Standard and Pro users of the opposite gender.',
    price: "1000 ETB",
  },
} as const;

export const TELEGRAM_HANDLE = '@esprit_iconique';
