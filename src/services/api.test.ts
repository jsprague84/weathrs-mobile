import { WeathrsApi } from '@/services/api';

function mockResponse(status: number, body: unknown = {}): any {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
  };
}

describe('WeathrsApi', () => {
  let client: WeathrsApi;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    client = new WeathrsApi('https://example.test/');
    fetchMock = jest.fn();
    (globalThis as any).fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('does not prefix /api/v1 for health checks', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, { status: 'ok' }));
    await expect(client.health()).resolves.toEqual({ status: 'ok' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/health');
  });

  it('prefixes /api/v1 and passes query params for data endpoints', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, {}));
    await client.getCurrentWeather('Austin', 'metric');
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/api/v1/weather?city=Austin&units=metric');
  });
  it('adds the X-API-Key header for device endpoints', async () => {
    client.setApiKey('secret-key');
    fetchMock.mockResolvedValue(mockResponse(200, { success: true }));
    await client.unregisterDevice('token-123');
    const options = fetchMock.mock.calls[0][1];
    expect(options.headers['X-API-Key']).toBe('secret-key');
  });

  it('retries retryable status codes before succeeding', async () => {
    jest.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(mockResponse(503, {}))
      .mockResolvedValueOnce(mockResponse(200, { status: 'ok' }));
    const promise = client.health();
    await jest.advanceTimersByTimeAsync(1100);
    await expect(promise).resolves.toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry client errors and surfaces the server message', async () => {
    fetchMock.mockResolvedValue(mockResponse(400, { error: 'bad city' }));
    await expect(client.getCurrentWeather('Nowhere')).rejects.toThrow('bad city');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects with a timeout error when the request aborts', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation((_url: string, options: any) => {
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });
    const promise = (client as any).request('/weather', { timeout: 50 });
    const assertion = expect(promise).rejects.toThrow('timed out after 0.05s');
    await jest.advanceTimersByTimeAsync(60);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
