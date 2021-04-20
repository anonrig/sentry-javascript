const Sentry = require('../../../dist');

function assertSessions(actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.error('FAILED: Sessions do not match');
    process.exit(1);
  }
}

function constructStrippedSessionObject(actual) {
  const { init, status, errors, release, did } = actual;
  return { init, status, errors, release, did };
}

let remaining = 2;

class DummyTransport {
  sendEvent(event) {
    return Promise.resolve({
      status: 'success',
    });
  }
  sendSession(session) {
    if (remaining === 2) {
      assertSessions(constructStrippedSessionObject(session),
        {
          init: true,
          status: "ok",
          errors: 1,
          release: "1.1",
          did: "ahmed",
        }
      )
    }
    else {
      assertSessions(constructStrippedSessionObject(session),
        {
          init: false,
          status: "exited",
          errors: 1,
          release: "1.1",
          did: "ahmed",
        }
      )
    }

    --remaining;

    if (!remaining) {
      console.log('SUCCESS: All application mode sessions were sent to node transport as expected');
    }
    return Promise.resolve({
      status: 'success',
    });
  }
  close() {
    return Promise.resolve({
      status: 'success',
    });
  }
}

Sentry.init({
  dsn: 'http://test@example.com/1337',
  release: '1.1',
  transport: DummyTransport,
});

const hub = Sentry.getCurrentHub();

// Start the session
hub.startSession({ user: { username: 'ahmed' } });
// endSession should be called at the exit of a process (very end of all logic)
process.on('exit', () => hub.endSession());

// Throw an error to cause Session to be an errored Session
throw new Error('test error')
