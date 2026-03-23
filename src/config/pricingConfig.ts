export const plans = {
  FREE: {
    label: 'Free',
    description: 'Can register and log in, but cannot join chats.',
    price: null,
  },
  STANDARD: {
    label: 'Standard',
    description: 'Random matching with all eligible users.',
    price: null,
  },
  PRO: {
    label: 'Pro',
    description:
      'Gender-priority matching: men see women, women see men, including both Standard and Pro users of the opposite gender.',
    price: null,
  },
} as const;

export const TELEGRAM_HANDLE = '@YourTelegramHandle';
