import Pusher from 'pusher-js';

// ✅ Make sure env variables are available
const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY!;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!;

export const pusherClient = new Pusher(pusherKey, {
  cluster: pusherCluster,
});
