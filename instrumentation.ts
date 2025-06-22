export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Required for error capture from React Server Components
export async function onRequestError(err: unknown, request: {
  path: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
}) {
  await import('./sentry.server.config');
  const Sentry = await import('@sentry/nextjs');
  
  Sentry.captureException(err, {
    contexts: {
      nextjs: {
        request_path: request.path,
        request_method: request.method,
      },
    },
    tags: {
      component: 'server_component',
    },
  });
} 